import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = await createAdminClient();

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const { organizationId, planCode } = payment.notes;

    // Update or insert subscription
    const { error } = await supabase.from("subscriptions").upsert({
      organization_id: organizationId,
      plan_code: planCode,
      status: "active",
      billing_provider: "razorpay",
      provider_subscription_id: payment.id,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    }, { onConflict: "organization_id" });

    if (error) {
      console.error("Failed to update subscription via Razorpay webhook:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    // Log billing event
    await supabase.from("billing_events").insert({
      organization_id: organizationId,
      event_type: "subscription_created",
      metadata: {
        payment_id: payment.id,
        order_id: payment.order_id,
        provider: "razorpay",
      },
    });
  }

  return NextResponse.json({ received: true });
}
