import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const SAFE_FALLBACK = "/dashboard";

function getSafeNextPath(input: string | null) {
  if (!input) return SAFE_FALLBACK;
  if (!input.startsWith("/")) return SAFE_FALLBACK;
  if (input.startsWith("//")) return SAFE_FALLBACK;
  return input;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as "email" | "recovery" | "invite" | "email_change",
    });
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=Authentication callback is missing required parameters.", request.url));
}
