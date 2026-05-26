import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { resolvePayPalPlanCode, verifyPayPalWebhook } from "@/lib/billing/gateway";

type PayPalResource = {
  id?: string;
  custom_id?: string;
  plan_id?: string;
  status?: string;
  amount?: {
    total?: string;
    value?: string;
    currency?: string;
  };
  billing_info?: {
    next_billing_time?: string;
    last_payment?: {
      amount?: {
        value?: string;
        currency_code?: string;
      };
    };
  };
  supplementary_data?: {
    related_ids?: {
      custom_id?: string;
    };
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const body = JSON.parse(rawBody) as {
    id?: string;
    event_type?: string;
    resource?: PayPalResource;
  };

  const eventType = body.event_type;
  const resource = body.resource;
  const externalId = body.id || `${eventType || "paypal-event"}-${resource?.id || Date.now()}`;

  if (!env.PAYPAL_WEBHOOK_ID) {
    return new NextResponse("PayPal webhook id is not configured", { status: 400 });
  }

  try {
    const verified = await verifyPayPalWebhook(req, rawBody);
    if (!verified) {
      return new NextResponse("PayPal webhook signature verification failed", { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal webhook verification failed";
    return new NextResponse(message, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Log event for idempotency
  const { error: logError } = await supabase.from("webhook_events").insert({
    provider: "paypal",
    external_id: externalId,
    event_type: eventType,
    payload: body,
    processed: false,
  });

  if (logError && logError.code === "23505") {
    return new NextResponse("Event already processed", { status: 200 });
  }

  // Extract organization ID from custom_id or metadata if available
  const organizationId = resource?.custom_id || resource?.supplementary_data?.related_ids?.custom_id;

  if (!organizationId) {
    return new NextResponse("Missing organization reference", { status: 400 });
  }

  const planCode = resource?.plan_id ? await resolvePayPalPlanCode(resource.plan_id) : "basic";

  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.UPDATED": {
      await supabase.from("subscriptions").upsert({
        organization_id: organizationId,
        plan_code: planCode,
        status: resource.status === "ACTIVE" ? "active" : "trialing",
        current_period_end: resource.billing_info?.next_billing_time ? new Date(resource.billing_info.next_billing_time).toISOString() : null,
        billing_provider: "paypal",
        provider_subscription_id: resource.id ?? null,
      }, { onConflict: "organization_id" });
      break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
      await supabase.from("subscriptions")
        .update({ status: "canceled", provider_subscription_id: null })
        .eq("organization_id", organizationId);
      break;
      }

      case "PAYMENT.SALE.COMPLETED":
      case "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED": {
      const amountValue = resource.amount?.total || resource.amount?.value || resource.billing_info?.last_payment?.amount?.value || "0";
      const currency = resource.amount?.currency || resource.billing_info?.last_payment?.amount?.currency_code || "USD";
      await supabase.from("invoices").upsert({
        organization_id: organizationId,
        invoice_number: `PAYPAL-${resource.id}`,
        amount_cents: Math.round(parseFloat(String(amountValue)) * 100),
        currency: String(currency).toLowerCase(),
        status: "paid",
        issued_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      }, { onConflict: "invoice_number" });
      await supabase.from("subscriptions").upsert({
        organization_id: organizationId,
        plan_code: planCode,
        status: "active",
        current_period_end: resource.billing_info?.next_billing_time ? new Date(resource.billing_info.next_billing_time).toISOString() : null,
        billing_provider: "paypal",
        provider_subscription_id: resource.id ?? null,
      }, { onConflict: "organization_id" });
      break;
      }

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
      await supabase.from("subscriptions")
        .update({ status: "past_due" })
        .eq("organization_id", organizationId);
      break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    await supabase
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString(), error_message: message })
      .eq("external_id", externalId)
      .eq("provider", "paypal");
    return new NextResponse(message, { status: 500 });
  }

  await supabase
    .from("webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString(), error_message: null })
    .eq("external_id", externalId)
    .eq("provider", "paypal");

  return new NextResponse("Webhook processed", { status: 200 });
}
