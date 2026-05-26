import Link from "next/link";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleAlert,
  CreditCard,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { env } from "@/lib/env";
import { CheckoutSubmitButton } from "./checkout-submit-button";
import { RazorpayButton } from "./razorpay-button";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; error?: string; canceled?: string; status?: string; interval?: string }>;
}) {
  const { plan, error, canceled, status, interval = "monthly" } = await searchParams;
  if (!plan) redirect("/dashboard/billing");

  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  const supabase = await createClient();

  const { data: planData } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("plan_code", plan)
    .single();

  if (!planData) redirect("/dashboard/billing");
  const paypalConfigured = Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY);
  const monthlyPrice = Number(planData.price_monthly || 0);
  const annualPrice = Math.round(monthlyPrice * 0.8 * 12);
  const hasAnnualPrice = annualPrice > 0;
  const yearlyEquivalent = annualPrice > 0 ? annualPrice / 12 : monthlyPrice;
  const annualSavings = annualPrice > 0 ? Math.max(0, monthlyPrice * 12 - annualPrice) : 0;
  const featureList = Array.isArray(planData.features) ? planData.features : [];
  const statusHint = status === "syncing";

  return (
    <section className="relative mx-auto w-full max-w-7xl pb-24 pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.2),transparent_60%),radial-gradient(circle_at_90%_15%,rgba(14,165,233,0.12),transparent_50%)]" />
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <LockKeyhole className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Secure checkout
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="text-premium text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Upgrade to {planData.name}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Clear pricing, instant activation, and encrypted payments. Pick your preferred method and
            complete checkout in under a minute.
          </p>
        </div>
      </header>

      {(error || canceled || statusHint) && (
        <div className="mt-6 grid gap-3">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{safeDecode(error)}</p>
            </div>
          )}
          {canceled && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Checkout was canceled. Your plan has not changed yet, and you can retry anytime.</p>
            </div>
          )}
          {statusHint && (
            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Payment received. We are syncing your subscription and usage limits now. This usually takes
                a few seconds.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_30px_70px_-35px_rgba(2,6,23,0.35)] sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Payment methods</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Stripe and PayPal are active. Additional local payment options are coming soon.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                PCI-compliant partners
              </div>
            </div>

            <div className="space-y-4">
              <form
                action="/api/billing/checkout/stripe"
                method="POST"
                className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-sky-50/40 p-4 transition hover:border-sky-300 hover:shadow-md"
              >
                <input type="hidden" name="plan_code" value={plan} />
                <input type="hidden" name="interval" value={interval} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                      <svg width="30" height="13" viewBox="0 0 60 26" aria-hidden="true">
                        <path
                          d="M59.64 13.28c0-1.85-.88-3.32-2.66-4.22l-3.53-1.79c-1.16-.59-1.68-1.04-1.68-1.76 0-.76.65-1.26 1.89-1.26 1.4 0 2.89.39 4.19 1.08l.74-4.6A11.48 11.48 0 0 0 53.03 0C48.94 0 46 2.1 46 5.86c0 2.02.96 3.61 3.07 4.63l3.1 1.49c1.03.5 1.47.93 1.47 1.59 0 .73-.63 1.19-1.87 1.19-1.72 0-3.6-.53-5.17-1.4l-.77 4.68c1.77.9 3.9 1.34 6.17 1.34 4.48 0 7.64-2.16 7.64-6.1ZM28.46.37l-1.85 11.2-.2-1.05c-.7-2.48-2.9-5.16-5.36-6.5L24.37.37h4.09Zm11.15 0-6.2 14.65h-4.37L25.58.37h4.35l2.39 8.14c.26.89.44 1.78.56 2.67.16-.67.42-1.51.77-2.67l3.16-8.14h3.8Zm5.57 0-3.43 14.65h-4.13L41.06.37h4.12Z"
                          fill="#635BFF"
                        />
                        <path
                          d="M18.15 9.08c0 4.67-3.24 7.95-7.88 7.95H3.55L5.15 6.4h4.45c2.27 0 3.63 1 3.63 2.68Zm6.05-3.3C24.2 2.28 21.6.37 17.9.37H1.69L0 14.97h8.74c5.74 0 9.46-3.7 9.46-9.19Z"
                          fill="#7A73FF"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Stripe</p>
                      <p className="text-xs text-slate-500">
                        Cards, Link, Apple Pay, and region-supported wallets
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <CheckoutSubmitButton
                    provider="Stripe"
                    helperText="Recommended"
                    disabled={!stripeConfigured}
                  />
                  {!stripeConfigured && (
                    <p className="text-xs text-rose-600">Stripe is unavailable in this deployment.</p>
                  )}
                </div>
              </form>

              <form
                action="/api/billing/checkout/paypal"
                method="POST"
                className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-blue-50/30 p-4 transition hover:border-blue-300 hover:shadow-md"
              >
                <input type="hidden" name="plan_code" value={plan} />
                <input type="hidden" name="interval" value={interval} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M7.47 20.82h3.15l.86-5.45.06-.36a.96.96 0 0 1 .95-.81h1.18c3.83 0 6.83-1.56 7.71-6.06.03-.13.05-.26.07-.38-.02 0-.04.01-.05.01-.94 4.3-3.88 5.86-7.7 5.86h-1.18c-.47 0-.87.34-.95.8l-.92 5.83-.03.2Z"
                          fill="#253B80"
                        />
                        <path
                          d="M21.37 7.76c.26-1.67 0-2.81-.88-3.8-.96-1.08-2.7-1.54-4.95-1.54H9.38c-.43 0-.79.31-.85.73L5.96 19.4c-.04.26.16.5.43.5h3.8l.95-6.01-.03.19c.07-.42.43-.73.85-.73h1.78c3.5 0 6.24-1.42 7.04-5.54.03-.17.06-.33.08-.49.15-.09.28-.2.41-.32.07-.61.07-1.14 0-1.64Z"
                          fill="#179BD7"
                        />
                        <path
                          d="M20.53 7.43a6.94 6.94 0 0 1-.41.32c-.03.16-.05.32-.08.49-.8 4.12-3.54 5.54-7.04 5.54h-1.78c-.42 0-.78.31-.85.73l-1.16 7.31a.46.46 0 0 0 .46.54h3.03c.37 0 .69-.27.75-.64l.03-.15.57-3.61.04-.2c.06-.37.38-.64.75-.64h.47c3.05 0 5.43-1.24 6.13-4.85.29-1.5.14-2.75-.63-3.71-.07-.09-.15-.17-.25-.25Z"
                          fill="#222D65"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">PayPal</p>
                      <p className="text-xs text-slate-500">
                        PayPal balance, linked bank account, or saved cards
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <CheckoutSubmitButton
                    provider="PayPal"
                    helperText="Alternative"
                    disabled={!paypalConfigured}
                  />
                  {!paypalConfigured && (
                    <p className="text-xs text-rose-600">PayPal is unavailable in this deployment.</p>
                  )}
                </div>
              </form>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_25px_50px_-30px_rgba(2,6,23,0.35)] sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">UPI & Local Payments</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Direct bank transfer via UPI (Google Pay, PhonePe) and Indian Debit Cards.
                </p>
              </div>
              <div className="flex -space-x-2">
                {[
                  "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-pay-icon.png",
                  "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-logo-icon.png",
                  "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/upi-payment-icon.png"
                ].map((url, i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-50 p-1">
                    <img src={url} alt="Local Payment" className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-orange-50/30 to-rose-50/20 p-5 transition hover:border-orange-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 italic">Recommended for Indian Users</p>
                  <p className="text-xs text-slate-500">Zero processing fees for UPI transfers.</p>
                </div>
                <div className="h-10 w-16 grayscale hover:grayscale-0 transition cursor-default">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-full w-full object-contain" />
                </div>
              </div>
              <div className="mt-5">
                <RazorpayButton planCode={plan} planName={planData.name} interval={interval} />
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_48px_-34px_rgba(2,6,23,0.3)] sm:p-7">
            <h3 className="text-lg font-semibold text-slate-900">Trust and security</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Secure, encrypted payments through trusted partners",
                "Transparent pricing with no hidden platform fees",
                "Cancel or change your plan anytime from Billing",
                "Subscription and invoices synced with webhook automation",
              ].map((point) => (
                <div key={point} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-xs text-slate-600">{point}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <Link href="/terms" className="inline-flex items-center gap-1 hover:text-slate-700">
                Terms
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/privacy" className="inline-flex items-center gap-1 hover:text-slate-700">
                Privacy
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-1 hover:text-slate-700">
                Billing support
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        </div>

        <aside className="xl:sticky xl:top-20 xl:h-fit">
          <article className="rounded-[30px] border border-slate-900/90 bg-slate-900 p-6 text-white shadow-[0_34px_80px_-30px_rgba(15,23,42,0.8)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Order summary</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{planData.name}</h2>
            <p className="mt-1 text-sm text-slate-300">{planData.description}</p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Billed {interval === "annual" ? "annually" : "monthly"}
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    ${(interval === "annual" ? annualPrice : monthlyPrice).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-slate-300">per workspace</p>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {hasAnnualPrice && interval === "monthly"
                  ? `Annual equivalent: $${yearlyEquivalent.toFixed(2)}/mo billed at $${annualPrice.toFixed(2)}/yr`
                  : interval === "annual" 
                  ? `You are saving $${annualSavings.toFixed(2)} a year compared to monthly billing.`
                  : "Annual billing details are shown at checkout when available."}
              </p>
              {annualSavings > 0 && interval === "monthly" && (
                <p className="mt-2 text-xs font-medium text-emerald-300">
                  Save ${annualSavings.toFixed(2)} annually with yearly billing.
                </p>
              )}
            </div>

            <ul className="mt-5 space-y-3">
              {featureList.slice(0, 5).map((feature: string) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>Plan subtotal</span>
                <span>${(interval === "annual" ? annualPrice : monthlyPrice).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Taxes & fees</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total due today</span>
                <span>${(interval === "annual" ? annualPrice : monthlyPrice).toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400">
                Includes a 14-day trial where available. You can cancel before renewal.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
              Your subscription is managed from Billing. Changes, downgrades, and invoices remain fully
              self-serve.
            </div>
          </article>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <p className="font-medium text-slate-700">Need enterprise invoice or procurement support?</p>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-800">
              Talk to billing support
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
