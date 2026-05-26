import { createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { PRICING_PLANS } from "./plans";
import { requireStripe } from "@/lib/stripe";

export type BillingPlanCode = keyof typeof PRICING_PLANS;
export type BillingProvider = "stripe" | "paypal";

type BillingProviderAsset = {
  provider: BillingProvider;
  plan_code: BillingPlanCode;
  provider_product_id: string | null;
  provider_price_id: string | null;
  provider_plan_id: string | null;
  amount_cents: number;
  currency: string;
};

type PlanDefinition = (typeof PRICING_PLANS)[BillingPlanCode];

const CURRENCY = "usd";
const PAYPAL_BASE_URL = env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

function getPlanDefinition(planCode: string): { code: BillingPlanCode; plan: PlanDefinition } {
  const code = (planCode as BillingPlanCode) in PRICING_PLANS ? (planCode as BillingPlanCode) : "basic";
  return { code, plan: PRICING_PLANS[code] };
}

async function getBillingAdminClient() {
  return createAdminClient();
}

async function loadBillingAsset(provider: BillingProvider, planCode: BillingPlanCode) {
  const supabase = await getBillingAdminClient();
  const { data } = await supabase
    .from("billing_provider_assets")
    .select("provider, plan_code, provider_product_id, provider_price_id, provider_plan_id, amount_cents, currency")
    .eq("provider", provider)
    .eq("plan_code", planCode)
    .maybeSingle();

  return data as BillingProviderAsset | null;
}

async function persistBillingAsset(asset: BillingProviderAsset) {
  const supabase = await getBillingAdminClient();
  await supabase.from("billing_provider_assets").upsert(
    {
      provider: asset.provider,
      plan_code: asset.plan_code,
      provider_product_id: asset.provider_product_id,
      provider_price_id: asset.provider_price_id,
      provider_plan_id: asset.provider_plan_id,
      amount_cents: asset.amount_cents,
      currency: asset.currency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,plan_code" },
  );
}

export function getBillingGatewayStatus() {
  return {
    stripeReady: Boolean(env.STRIPE_SECRET_KEY),
    paypalReady: Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET),
    paypalMode: env.PAYPAL_ENV,
  };
}

export async function resolveStripePriceId(planCode: string, interval = "monthly") {
  const { code, plan } = getPlanDefinition(planCode);
  const envPriceId =
    code === "basic"
      ? env.STRIPE_PRICE_STARTER
      : code === "pro"
        ? env.STRIPE_PRICE_GROWTH
        : env.STRIPE_PRICE_PRO;

  if (envPriceId) {
    await persistBillingAsset({
      provider: "stripe",
      plan_code: code,
      provider_product_id: null,
      provider_price_id: envPriceId,
      provider_plan_id: null,
      amount_cents: Math.round(plan.price * 100),
      currency: CURRENCY,
    });

    return envPriceId;
  }

  const stripe = requireStripe();
  const lookupKey = `novapilot_${code}_${interval}`;

  if (interval === "monthly") {
    const cachedAsset = await loadBillingAsset("stripe", code);
    if (cachedAsset?.provider_price_id) {
      return cachedAsset.provider_price_id;
    }
  }

  const existingPrices = await stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
    limit: 1,
  });

  const existing = existingPrices.data[0];
  if (existing) {
    if (interval === "monthly") {
      await persistBillingAsset({
        provider: "stripe",
        plan_code: code,
        provider_product_id: typeof existing.product === "string" ? existing.product : existing.product.id,
        provider_price_id: existing.id,
        provider_plan_id: null,
        amount_cents: Math.round(plan.price * 100),
        currency: existing.currency ?? CURRENCY,
      });
    }
    return existing.id;
  }

  const product = await stripe.products.create({
    name: `NovaPilot ${plan.name}`,
    description: `${plan.name} subscription for NovaPilot AI`,
    metadata: {
      plan_code: code,
      provider: "stripe",
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: CURRENCY,
    unit_amount: interval === "annual" ? Math.round(plan.price * 0.8 * 12) * 100 : Math.round(plan.price * 100),
    recurring: { interval: interval === "annual" ? "year" : "month" },
    lookup_key: lookupKey,
    metadata: {
      plan_code: code,
      provider: "stripe",
    },
  });

  if (interval === "monthly") {
    await persistBillingAsset({
      provider: "stripe",
      plan_code: code,
      provider_product_id: product.id,
      provider_price_id: price.id,
      provider_plan_id: null,
      amount_cents: Math.round(plan.price * 100),
      currency: CURRENCY,
    });
  }

  return price.id;
}

async function getPayPalAccessToken() {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local.");
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to authorize PayPal API: ${errorText}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("PayPal authorization response did not include an access token.");
  }

  return data.access_token;
}

async function createPayPalProduct(accessToken: string, planCode: BillingPlanCode, plan: PlanDefinition) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      "PayPal-Request-Id": `novapilot-product-${planCode}`,
    },
    body: JSON.stringify({
      name: `NovaPilot ${plan.name}`,
      description: `${plan.name} subscription for NovaPilot AI`,
      type: "SERVICE",
      category: "SOFTWARE",
      home_url: "https://novapilot.ai",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create PayPal product: ${errorText}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("PayPal product response did not include an id.");
  }

  return data.id;
}

async function createPayPalPlan(accessToken: string, productId: string, planCode: BillingPlanCode, plan: PlanDefinition, interval = "monthly") {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      "PayPal-Request-Id": `novapilot-plan-${planCode}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: `NovaPilot ${plan.name} Monthly`,
      description: `${plan.name} subscription for NovaPilot AI`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: interval === "annual" ? "YEAR" : "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: interval === "annual" ? Math.round(plan.price * 0.8 * 12).toFixed(2) : plan.price.toFixed(2),
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create PayPal plan: ${errorText}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("PayPal plan response did not include an id.");
  }

  return data.id;
}

export async function resolvePayPalPlanId(planCode: string, interval = "monthly") {
  const { code, plan } = getPlanDefinition(planCode);
  const envPlanId =
    code === "basic"
      ? env.PAYPAL_PLAN_STARTER_ID
      : code === "pro"
        ? env.PAYPAL_PLAN_GROWTH_ID
        : env.PAYPAL_PLAN_PRO_ID;

  if (envPlanId) {
    await persistBillingAsset({
      provider: "paypal",
      plan_code: code,
      provider_product_id: null,
      provider_price_id: null,
      provider_plan_id: envPlanId,
      amount_cents: Math.round(plan.price * 100),
      currency: "USD",
    });

    return envPlanId;
  }

  if (interval === "monthly") {
    const cachedAsset = await loadBillingAsset("paypal", code);
    if (cachedAsset?.provider_plan_id) {
      return cachedAsset.provider_plan_id;
    }
  }

  const accessToken = await getPayPalAccessToken();
  const productId = await createPayPalProduct(accessToken, code, plan);
  const planId = await createPayPalPlan(accessToken, productId, code, plan, interval);

  if (interval === "monthly") {
    await persistBillingAsset({
      provider: "paypal",
      plan_code: code,
      provider_product_id: productId,
      provider_price_id: null,
      provider_plan_id: planId,
      amount_cents: Math.round(plan.price * 100),
      currency: "USD",
    });
  }

  return planId;
}

export async function createPayPalSubscriptionApprovalUrl(args: {
  planCode: string;
  interval?: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const { code } = getPlanDefinition(args.planCode);
  const accessToken = await getPayPalAccessToken();
  const planId = await resolvePayPalPlanId(code, args.interval || "monthly");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      "PayPal-Request-Id": `novapilot-subscription-${args.organizationId}-${code}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: args.organizationId,
      application_context: {
        brand_name: env.PAYPAL_BRAND_NAME,
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: args.successUrl,
        cancel_url: args.cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create PayPal subscription: ${errorText}`);
  }

  const data = (await response.json()) as {
    id?: string;
    links?: Array<{ rel?: string; href?: string }>;
  };

  const approvalUrl = data.links?.find((link) => link.rel === "approve" || link.rel === "approval_url")?.href;
  if (!approvalUrl) {
    throw new Error("PayPal subscription response did not include an approval URL.");
  }

  return {
    subscriptionId: data.id || null,
    approvalUrl,
    planId,
  };
}

export async function verifyPayPalWebhook(req: Request, rawBody: string) {
  const accessToken = await getPayPalAccessToken();
  const webhookId = env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    throw new Error("PAYPAL_WEBHOOK_ID is required to verify PayPal webhooks.");
  }

  const payload = {
    auth_algo: req.headers.get("paypal-auth-algo") || req.headers.get("PAYPAL-AUTH-ALGO") || "",
    cert_url: req.headers.get("paypal-cert-url") || req.headers.get("PAYPAL-CERT-URL") || "",
    transmission_id: req.headers.get("paypal-transmission-id") || req.headers.get("PAYPAL-TRANSMISSION-ID") || "",
    transmission_sig: req.headers.get("paypal-transmission-sig") || req.headers.get("PAYPAL-TRANSMISSION-SIG") || "",
    transmission_time: req.headers.get("paypal-transmission-time") || req.headers.get("PAYPAL-TRANSMISSION-TIME") || "",
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to verify PayPal webhook: ${errorText}`);
  }

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export async function resolvePayPalPlanCode(planId: string) {
  const supabase = await getBillingAdminClient();

  const { data } = await supabase
    .from("billing_provider_assets")
    .select("plan_code")
    .eq("provider", "paypal")
    .eq("provider_plan_id", planId)
    .maybeSingle();

  if (data?.plan_code) {
    return data.plan_code as BillingPlanCode;
  }

  if (planId === env.PAYPAL_PLAN_STARTER_ID) return "basic";
  if (planId === env.PAYPAL_PLAN_GROWTH_ID) return "pro";
  if (planId === env.PAYPAL_PLAN_PRO_ID) return "enterprise";

  return "basic";
}

export async function cancelStripeSubscriptionAtPeriodEnd(subscriptionId: string) {
  const stripe = requireStripe();
  const updated = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return updated;
}

export async function cancelPayPalSubscription(subscriptionId: string, reason = "Requested by customer") {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel PayPal subscription: ${errorText}`);
  }
}
