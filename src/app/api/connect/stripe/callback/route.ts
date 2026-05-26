import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorMsg = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (errorMsg) {
    return NextResponse.redirect(new URL(`/dashboard/connectors?error=Stripe authorization failed: ${errorMsg}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/connectors?error=Stripe authorization code not found", appUrl));
  }

  const membership = await getCurrentMembership();
  if (!membership) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.redirect(new URL("/dashboard/connectors?error=Stripe Secret Key not configured on server", appUrl));
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-04-22.dahlia" as any,
    });

    // Exchange auth code for Connected Account details
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code: code,
    });

    const connectedAccountId = response.stripe_user_id;
    const supabase = await createClient();

    // 1. Insert or update the connector
    const { data: connector, error: dbError } = await supabase
      .from("data_connections")
      .upsert({
        organization_id: membership.organizationId,
        provider: "stripe",
        status: "connected",
        last_synced_at: new Date().toISOString(),
        metadata: {
          environment: "production_main",
          stripe_user_id: connectedAccountId,
          livemode: response.livemode,
          scope: response.scope,
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
        provider: "stripe",
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

    return NextResponse.redirect(new URL("/dashboard/connectors?message=Stripe connected and synced successfully!", appUrl));
  } catch (error: any) {
    return NextResponse.redirect(new URL(`/dashboard/connectors?error=Server error: ${error.message || error}`, appUrl));
  }
}
