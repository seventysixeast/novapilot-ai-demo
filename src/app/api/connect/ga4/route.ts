import { NextRequest, NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/server/tenant";

export async function GET(request: NextRequest) {
  const membership = await getCurrentMembership();
  if (!membership) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  const clientId = process.env.GA4_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard/connectors?error=Google Analytics Client ID is missing", request.nextUrl));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/connect/ga4/callback`;
  const scopes = "https://www.googleapis.com/auth/analytics.readonly";

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
