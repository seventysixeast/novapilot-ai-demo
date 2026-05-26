import { NextRequest, NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/server/tenant";

export async function GET(request: NextRequest) {
  const membership = await getCurrentMembership();
  if (!membership) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard/connectors?error=Stripe Client ID is missing. Please configure STRIPE_CLIENT_ID in your .env.local", request.nextUrl));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/connect/stripe/callback`;

  // Standard Stripe Connect OAuth Authorize URL
  const authUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
