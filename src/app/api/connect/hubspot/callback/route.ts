import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorMsg = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (errorMsg) {
    return NextResponse.redirect(new URL(`/dashboard/connectors?error=HubSpot authorization failed: ${errorMsg}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/connectors?error=Authorization code not found", appUrl));
  }

  const membership = await getCurrentMembership();
  if (!membership) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/dashboard/connectors?error=HubSpot credentials not configured on server", appUrl));
  }

  try {
    const redirectUri = `${appUrl}/api/connect/hubspot/callback`;
    const tokenResponse = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.redirect(
        new URL(`/dashboard/connectors?error=Failed to exchange token: ${errorData.message || tokenResponse.statusText}`, appUrl)
      );
    }

    const tokens = await tokenResponse.json();
    const supabase = await createClient();

    // 1. Insert or update the connector
    const { data: connector, error: dbError } = await supabase
      .from("data_connections")
      .upsert({
        organization_id: membership.organizationId,
        provider: "hubspot",
        status: "connected",
        last_synced_at: new Date().toISOString(),
        metadata: {
          environment: "production_main",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          token_acquired_at: new Date().toISOString(),
        }
      }, { onConflict: "organization_id,provider" })
      .select("id")
      .single();

    if (dbError || !connector) {
      return NextResponse.redirect(new URL(`/dashboard/connectors?error=Database error: ${dbError?.message}`, appUrl));
    }

    // 2. Update onboarding progress
    const { data: current } = await supabase
      .from("onboarding_progress")
      .select("step_1_connected, step_2_queries, step_3_team")
      .eq("organization_id", membership.organizationId)
      .maybeSingle();

    const completed =
      true && // step_1_connected is now true
      (current?.step_2_queries ?? false) &&
      (current?.step_3_team ?? false);

    await supabase
      .from("onboarding_progress")
      .upsert({
        organization_id: membership.organizationId,
        step_1_connected: true,
        completed: Boolean(completed),
        updated_at: new Date().toISOString()
      }, { onConflict: "organization_id" });

    // 3. Register successful sync job
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${membership.organizationId}:${connector.id}:${new Date().toISOString().slice(0, 13)}`)
      .digest("hex");

    await supabase.from("sync_jobs").upsert(
      {
        organization_id: membership.organizationId,
        connection_id: connector.id,
        provider: "hubspot",
        idempotency_key: idempotencyKey,
        status: "succeeded",
        attempts: 1,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "idempotency_key" },
    );

    revalidatePath("/dashboard/connectors");
    revalidatePath("/dashboard/onboarding");

    return NextResponse.redirect(new URL("/dashboard/connectors?message=HubSpot connected and synced successfully!", appUrl));
  } catch (error: any) {
    return NextResponse.redirect(new URL(`/dashboard/connectors?error=Server error: ${error.message || error}`, appUrl));
  }
}
