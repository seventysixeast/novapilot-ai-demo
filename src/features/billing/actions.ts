"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { cancelPayPalSubscription, cancelStripeSubscriptionAtPeriodEnd, resolveStripePriceId } from "@/lib/billing/gateway";
import { env } from "@/lib/env";

export async function createCheckoutSession(formData: FormData) {
  const planCode = String(formData.get("plan_code") ?? "basic");
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!env.STRIPE_SECRET_KEY) {
    redirect("/dashboard/billing?error=Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local and restart.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const priceId = await resolveStripePriceId(planCode);
  const stripe = (await import("@/lib/stripe")).requireStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        organizationId: membership.organizationId,
        planCode,
      },
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?success=true`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?canceled=true`,
    client_reference_id: membership.organizationId,
    metadata: {
      organizationId: membership.organizationId,
      planCode,
      userId: user?.id ?? membership.userId,
    },
  }, {
    idempotencyKey: `novapilot-checkout-${membership.organizationId}-${planCode}`,
  });

  if (session.url) {
    redirect(session.url);
  }

  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?error=Unable to open Stripe checkout.");
}

export async function cancelSubscription() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  const supabase = await createClient();

  const { data: currentSub } = await supabase
    .from("subscriptions")
    .select("billing_provider, provider_subscription_id, current_period_end")
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  const provider = currentSub?.billing_provider;
  const providerSubscriptionId = currentSub?.provider_subscription_id;

  if (provider && providerSubscriptionId) {
    if (provider === "stripe") {
      await cancelStripeSubscriptionAtPeriodEnd(providerSubscriptionId);
    }
    if (provider === "paypal") {
      await cancelPayPalSubscription(providerSubscriptionId);
    }
  }

  await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true, status: "active" })
    .eq("organization_id", membership.organizationId);

  await supabase.from("billing_events").insert({
    organization_id: membership.organizationId,
    event_type: "subscription_canceled",
    metadata: {},
  });

  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?warning=Subscription will cancel at period end");
}

export async function applyCoupon(formData: FormData) {
  const code = String(formData.get("coupon_code") ?? "").trim().toUpperCase();
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!code) redirect("/dashboard/billing?error=Enter a valid coupon code");

  const supabase = await createClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("id, code, active, expires_at, redeemed_count, max_redemptions")
    .eq("code", code)
    .maybeSingle();

  const validCoupon = coupon as
    | {
        id: string;
        code: string;
        active: boolean;
        expires_at: string | null;
        redeemed_count: number;
        max_redemptions: number | null;
      }
    | null;

  if (!validCoupon || !validCoupon.active) {
    redirect("/dashboard/billing?error=Coupon is invalid or inactive");
  }

  if (validCoupon.expires_at && new Date(validCoupon.expires_at).getTime() < Date.now()) {
    redirect("/dashboard/billing?error=Coupon has expired");
  }

  if (validCoupon.max_redemptions && validCoupon.redeemed_count >= validCoupon.max_redemptions) {
    redirect("/dashboard/billing?error=Coupon redemption limit reached");
  }

  await supabase.from("coupon_redemptions").upsert(
    {
      organization_id: membership.organizationId,
      coupon_id: validCoupon.id,
      redeemed_by: membership.userId,
    },
    { onConflict: "organization_id,coupon_id" },
  );

  await supabase
    .from("coupons")
    .update({ redeemed_count: validCoupon.redeemed_count + 1 })
    .eq("id", validCoupon.id);

  await supabase.from("billing_events").insert({
    organization_id: membership.organizationId,
    event_type: "coupon_applied",
    metadata: { code: validCoupon.code },
  });

  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?message=Coupon applied");
}

export async function createReferral(formData: FormData) {
  const referredEmail = String(formData.get("referred_email") ?? "").trim().toLowerCase();
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!referredEmail) redirect("/dashboard/billing?error=Enter an email to invite");

  const supabase = await createClient();
  const referralCode = `NP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await supabase.from("referrals").insert({
    organization_id: membership.organizationId,
    referred_email: referredEmail,
    referral_code: referralCode,
    status: "pending",
    reward_credits: 1000,
  });

  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?message=Referral invite created");
}
