import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { getCurrentMembership } from "@/lib/server/tenant";
import { resolveStripePriceId } from "@/lib/billing/gateway";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const formData = await req.formData();
  const planCode = String(formData.get("plan_code") || "basic");
  const interval = String(formData.get("interval") || "monthly");
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const stripe = requireStripe();
    const priceId = await resolveStripePriceId(planCode, interval);

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
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&plan=${planCode}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      client_reference_id: membership.organizationId,
      metadata: { organizationId: membership.organizationId, planCode },
    }, {
      idempotencyKey: `novapilot-checkout-${membership.organizationId}-${planCode}`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err: unknown) {
    console.error("Stripe Error:", err);
    const message = encodeURIComponent(err instanceof Error ? err.message : "Stripe session failed");
    return NextResponse.redirect(new URL(`/dashboard/billing/checkout?plan=${encodeURIComponent(planCode)}&error=${message}`, req.url), { status: 303 });
  }
}
