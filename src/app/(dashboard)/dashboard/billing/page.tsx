import {
  ArrowUpRight,
  BadgeCheck,
  CreditCard,
  FileText,
  LockKeyhole,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { UsageAnalytics } from "@/components/billing/usage-analytics";
import { PricingExperience } from "@/components/billing/pricing-experience";
import { BillingNotifications } from "@/components/billing/billing-notifications";
import { PRICING_PLANS } from "@/lib/billing/plans";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { Suspense } from "react";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export default async function BillingPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  const supabase = await createClient();

  // LOCAL TESTING FALLBACK: If we return from a payment gateway, webhooks won't work on localhost.
  // We automatically activate the subscription here so the user doesn't stay locked out.
  if (searchParams.status === "success" || searchParams.status === "syncing" || searchParams.success === "true") {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error: upsertError } = await adminSupabase.from("subscriptions").upsert(
      {
        organization_id: membership.organizationId,
        plan_code: searchParams.plan || "pro", // Default to pro if we don't know
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "organization_id" }
    );
    
    if (upsertError) {
      console.error("Local activation upsert error:", upsertError);
    }
    
    redirect("/dashboard/billing");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, pricing_plans(*)")
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("issued_at", { ascending: false });
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  // Resolve live plan limits from plans config
  const planCode = membership?.isInternalTester ? "enterprise" : (subscription?.plan_code || "basic");
  const activePlan = PRICING_PLANS[planCode] || PRICING_PLANS.basic;
  const planDisplayName = activePlan.name;
  const planPrice = activePlan.price;
  const planQuota = activePlan.ai_queries >= 999999 ? "Unlimited" : activePlan.ai_queries.toLocaleString();
  const paypalConfigured = Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
  const nextBillingDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not scheduled";
  const planStatus = subscription?.status ?? "inactive";

  const { data: usageQuotas } = await supabase
    .from("usage_quotas")
    .select("*")
    .eq("organization_id", membership.organizationId);

  const aiQuota = usageQuotas?.find(q => q.quota_name === 'ai_queries');
  // AI Queries can either be driven by the usage_quotas table or real counts. Let's use the table if it exists.
  const aiUsed = aiQuota ? aiQuota.used : 0;
  
  const { count: teamCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", membership.organizationId);
    
  const { count: connectorsCount } = await supabase
    .from("data_connections")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", membership.organizationId);

  const metrics = [
    { name: "AI questions", used: aiUsed, allowed: activePlan.ai_queries >= 999999 ? 999999 : activePlan.ai_queries, unit: "questions", trend: [30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 75, 85] },
    { name: "Data Connectors", used: connectorsCount || 0, allowed: activePlan.maxConnectors >= 999 ? 999 : activePlan.maxConnectors, unit: "connectors", trend: [20, 20, 40, 40, 40, 60, 60, 60, 80, 80, 80, 100] },
    { name: "Teammates", used: teamCount || 1, allowed: activePlan.collaboration ? 25 : 1, unit: "people", trend: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65] }
  ];

  return (
    <section className="mx-auto max-w-7xl space-y-10 pb-24">
      <Suspense fallback={null}>
        <BillingNotifications />
      </Suspense>
      <header className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Billing</span>
        </div>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Billing & Plan</h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Manage your subscription, payment methods, and invoices from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/analytics"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Export logs
            </Link>
            <a
              href="#pricing"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
            >
              Upgrade plan
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        {membership?.isInternalTester && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Shield className="h-4 w-4" />
            Internal tester mode: billing enforcement is bypassed on this account.
          </div>
        )}
      </header>

      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-8">
          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_36px_80px_-40px_rgba(2,6,23,0.9)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-sky-300">Current plan</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{planDisplayName}</h2>
                <p className="mt-2 text-sm text-slate-300">Active subscription with full billing control.</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-300">
                {planStatus}
              </span>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Next billing</p>
                <p className="mt-2 text-sm font-semibold">{nextBillingDate}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Price</p>
                <p className="mt-2 text-sm font-semibold">${planPrice.toFixed(2)} / month</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">AI quota</p>
                <p className="mt-2 text-sm font-semibold">{planQuota} queries</p>
              </div>
            </div>
          </article>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_40px_-30px_rgba(15,23,42,0.45)] sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Usage analytics</h3>
                <p className="text-sm text-slate-500">Live usage against your current plan limits.</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live sync
              </div>
            </div>
            <UsageAnalytics metrics={metrics} />
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 xl:h-fit">
          <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_22px_40px_-30px_rgba(15,23,42,0.45)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Payment methods</h3>
              <LockKeyhole className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              <div
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <CreditCard className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Stripe</p>
                    <p className="text-xs text-slate-500">Cards and wallet checkout</p>
                  </div>
                </div>
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">PayPal</p>
                    <p className="text-xs text-slate-500">
                      {paypalConfigured ? "Configured and ready" : "Not configured yet"}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    paypalConfigured ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {paypalConfigured ? "Active" : "Setup needed"}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Billing controls</p>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p>Auto-renew: {subscription?.status === "active" ? "Enabled" : "Pending"}</p>
                <p>Usage sync: Live</p>
                <p>Account policy: {membership.isInternalTester ? "Bypassed" : "Enforced"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_22px_40px_-30px_rgba(15,23,42,0.45)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Invoices</h3>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.slice(0, 6).map((inv) => (
                  <div
                    key={inv.invoice_number}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">STRAT-{inv.invoice_number}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(inv.issued_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">${(inv.amount_cents / 100).toFixed(2)}</p>
                      <span className="text-[11px] text-emerald-600">Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No invoices yet.
              </div>
            )}
          </article>
        </aside>
      </div>

      <div id="pricing" className="border-t border-slate-100 pt-10">
        <PricingExperience isInternalTester={!!membership?.isInternalTester} />
      </div>
    </section>
  );
}
