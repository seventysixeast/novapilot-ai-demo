import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createPayPalSubscriptionApprovalUrl } from "@/lib/billing/gateway";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const formData = await req.formData();
  const planCode = String(formData.get("plan_code") || "basic");
  const interval = String(formData.get("interval") || "monthly");
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isConfigured = Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);

  if (!isConfigured) {
    return NextResponse.redirect(
      new URL(`/dashboard/billing/checkout?plan=${encodeURIComponent(planCode)}&error=PayPal+is+not+configured+for+this+deployment`, req.url),
      { status: 303 },
    );
  }

  try {
    const approval = await createPayPalSubscriptionApprovalUrl({
      planCode,
      interval,
      organizationId: membership.organizationId,
      successUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&plan=${planCode}`,
      cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing/checkout?plan=${encodeURIComponent(planCode)}&canceled=true`,
    });

    return NextResponse.redirect(approval.approvalUrl, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal checkout failed";
    return NextResponse.redirect(
      new URL(`/dashboard/billing/checkout?plan=${encodeURIComponent(planCode)}&error=${encodeURIComponent(message)}`, req.url),
      { status: 303 },
    );
  }
}
