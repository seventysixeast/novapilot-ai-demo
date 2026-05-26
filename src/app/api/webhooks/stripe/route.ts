import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { requireStripe } from "@/lib/stripe";

type StripeSubscriptionRecord = {
  status: string;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
  metadata?: Record<string, string | undefined>;
};

type StripeInvoiceRecord = {
  id: string;
  number?: string | null;
  subscription?: string | { id: string } | null;
  metadata?: Record<string, string | undefined>;
  amount_paid?: number | null;
  amount_due?: number | null;
  currency?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  created?: number;
  status_transitions?: {
    paid_at?: number | null;
  } | null;
  lines?: {
    data: Array<{
      period?: {
        end?: number | null;
      } | null;
    }>;
  };
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || req.headers.get("Stripe-Signature");

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Stripe webhook secret is not configured", { status: 400 });
  }

  if (!signature) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  const stripe = requireStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown webhook error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Log event for idempotency
  const { error: logError } = await supabase.from("webhook_events").insert({
    provider: "stripe",
    external_id: event.id,
    event_type: event.type,
    payload: event.data.object,
    processed: false,
  });

  if (logError && logError.code === "23505") {
    return new NextResponse("Event already processed", { status: 200 });
  }

  async function upsertSubscription(organizationId: string, planCode: string, status: string, periodEnd?: number | null, cancelAtPeriodEnd?: boolean) {
    await supabase.from("subscriptions").upsert(
      {
        organization_id: organizationId,
        plan_code: planCode,
        status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: cancelAtPeriodEnd ?? false,
      },
      { onConflict: "organization_id" },
    );
  }

  async function resolveOrgAndPlanFromSubscription(subscriptionId: string) {
    const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as StripeSubscriptionRecord;
    return {
      organizationId: subscription.metadata?.organizationId || subscription.metadata?.organization_id || null,
      planCode: subscription.metadata?.planCode || "enterprise",
      subscription,
    };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId || session.client_reference_id;
      if (!organizationId) {
        return new NextResponse("Missing organization reference", { status: 400 });
      }

      const planCode = session.metadata?.planCode || "enterprise";
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        const { subscription } = await resolveOrgAndPlanFromSubscription(subscriptionId);
        const currentPeriodEnd = subscription.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        await upsertSubscription(
          organizationId,
          planCode,
          subscription.status === "active" || subscription.status === "trialing" ? subscription.status : "trialing",
          currentPeriodEnd,
          subscription.cancel_at_period_end ?? false,
        );
        await supabase
          .from("subscriptions")
          .update({
            billing_provider: "stripe",
            provider_subscription_id: subscriptionId,
          })
          .eq("organization_id", organizationId);
      } else {
        await upsertSubscription(organizationId, planCode, "trialing");
      }
      break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
      const subscription = event.data.object as unknown as StripeSubscriptionRecord;
      const subscriptionId = (event.data.object as Stripe.Subscription).id;
      const organizationId = subscription.metadata?.organizationId || subscription.metadata?.organization_id;
      if (!organizationId) {
        return new NextResponse("Missing organization reference", { status: 400 });
      }

      await upsertSubscription(
        organizationId,
        subscription.metadata?.planCode || "enterprise",
        subscription.status,
        subscription.current_period_end,
        subscription.cancel_at_period_end ?? false,
      );
      await supabase
        .from("subscriptions")
        .update({
          billing_provider: "stripe",
          provider_subscription_id: subscriptionId,
        })
        .eq("organization_id", organizationId);
      break;
      }

      case "customer.subscription.deleted": {
      const subscription = event.data.object as unknown as StripeSubscriptionRecord;
      const organizationId = subscription.metadata?.organizationId || subscription.metadata?.organization_id;
      if (!organizationId) {
        return new NextResponse("Missing organization reference", { status: 400 });
      }

      await supabase
        .from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false, provider_subscription_id: null })
        .eq("organization_id", organizationId);
      break;
      }

      case "invoice.payment_succeeded": {
      const invoice = event.data.object as unknown as StripeInvoiceRecord;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      const subscription = subscriptionId ? (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as StripeSubscriptionRecord : null;
      const organizationId = invoice.metadata?.organizationId || subscription?.metadata?.organizationId || subscription?.metadata?.organization_id;

      if (!organizationId) {
        return new NextResponse("Missing organization reference", { status: 400 });
      }

      await upsertSubscription(
        organizationId,
        subscription?.metadata?.planCode || invoice.metadata?.planCode || "enterprise",
        "active",
        subscription?.current_period_end ?? invoice.lines?.data[0]?.period?.end ?? null,
        subscription?.cancel_at_period_end ?? false,
      );
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            billing_provider: "stripe",
            provider_subscription_id: subscriptionId,
          })
          .eq("organization_id", organizationId);
      }

      await supabase.from("invoices").upsert({
        organization_id: organizationId,
        invoice_number: invoice.number || invoice.id,
        amount_cents: invoice.amount_paid || invoice.amount_due || 0,
        currency: invoice.currency || "usd",
        status: "paid",
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        issued_at: new Date((invoice.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        paid_at: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString(),
      }, { onConflict: "invoice_number" });
      break;
      }

      case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as StripeInvoiceRecord;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      const subscription = subscriptionId ? (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as StripeSubscriptionRecord : null;
      const organizationId = invoice.metadata?.organizationId || subscription?.metadata?.organizationId || subscription?.metadata?.organization_id;

      if (!organizationId) {
        return new NextResponse("Missing organization reference", { status: 400 });
      }

      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("organization_id", organizationId);

      const { data: billingContact } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId)
        .limit(1)
        .maybeSingle();

      if (billingContact?.user_id) {
        await supabase.from("notifications").insert({
          organization_id: organizationId,
          title: "Payment Failed",
          body: "Your recent subscription payment failed. Please update your payment method to avoid service interruption.",
          user_id: billingContact.user_id,
        });
      }
      break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    await supabase
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString(), error_message: message })
      .eq("external_id", event.id)
      .eq("provider", "stripe");
    return new NextResponse(message, { status: 500 });
  }

  await supabase
    .from("webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString(), error_message: null })
    .eq("external_id", event.id)
    .eq("provider", "stripe");

  return new NextResponse("Webhook processed", { status: 200 });
}
