import { NextRequest, NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/server/tenant";

export async function GET(request: NextRequest) {
  const membership = await getCurrentMembership();
  if (!membership) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  const clientId = process.env.HUBSPOT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard/connectors?error=HubSpot Client ID is missing", request.nextUrl));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/connect/hubspot/callback`;
  const scopes = "oauth crm.objects.contacts.read crm.objects.deals.read";

  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

  return NextResponse.redirect(authUrl);
}
