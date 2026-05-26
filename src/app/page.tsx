import Link from "next/link";
import Script from "next/script";
import { createClient } from "@/lib/supabase/server";

import { LandingNav } from "@/components/marketing/landing-nav";
import { HeroAnimation } from "@/components/marketing/hero-animation";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FadeIn } from "@/components/ui/fade-in";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp, Globe, Lock } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brand.name,
      url: brand.url,
    },
  ];

  return (
    <div className="bg-[#fdfdfe] selection:bg-sky-100">
      <LandingNav isAuthenticated={isAuthenticated} />
      
      <main className="relative pt-20 overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1000px] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_70%)]" />
          <div className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full bg-indigo-400/5 blur-[120px] animate-pulse" />
          <div className="absolute top-[40%] right-[10%] w-96 h-96 rounded-full bg-sky-400/5 blur-[140px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          {/* Hero Section */}
          <section className="relative pt-16 pb-24 text-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-white mb-8 shadow-xl shadow-slate-200">
                <Sparkles className="h-3 w-3 text-sky-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">AI workspace for teams</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 leading-[1.05] max-w-5xl mx-auto text-premium">
                AI that helps teams <span className="gradient-brand">find answers and act faster.</span>
              </h1>
              <p className="mt-8 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                NovaPilot helps you connect data, ask questions, and see what needs attention next.
              </p>
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                <Link href={isAuthenticated ? "/dashboard" : "/signup"} className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 group">
                  {isAuthenticated ? "Go to Dashboard" : "Start free"} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#product" className="h-14 px-8 rounded-2xl bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[11px] shadow-sm flex items-center justify-center gap-3 transition-all hover:bg-slate-50 hover:border-slate-300">
                  See how it works
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="mt-20 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#fdfdfe] to-transparent z-10 h-32 bottom-0" />
                <HeroAnimation />
              </div>
            </FadeIn>
          </section>

          {/* Feature Matrix */}
          <section id="product" className="py-24 border-t border-slate-100">
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard 
                icon={Globe}
                title="Connect data" 
                desc="Bring in Stripe, HubSpot, GA4, and documents in one place." 
                index={1}
              />
              <FeatureCard 
                icon={Zap}
                title="Ask questions" 
                desc="Ask in plain English and get clear answers with sources." 
                index={2}
              />
              <FeatureCard 
                icon={Shield}
                title="Get alerts" 
                desc="See changes, risks, and next steps without digging through charts." 
                index={3}
              />
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="py-24 border-t border-slate-100">
            <FadeIn>
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 shadow-sm mb-4">
                  <Zap className="h-3 w-3 text-sky-500" /> How it works
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">From data to decision in minutes</h2>
                <p className="mt-4 text-slate-500 max-w-xl mx-auto leading-relaxed">No dashboards to build. No queries to write. Just ask, and NovaPilot finds the answer.</p>
              </div>
            </FadeIn>

            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent hidden lg:block" />
              <div className="grid gap-6 lg:grid-cols-4">
                {[
                  { step: "01", icon: Globe, color: "sky", title: "Connect your data", desc: "Link Stripe, HubSpot, GA4, Notion, or upload documents directly. Works in minutes." },
                  { step: "02", icon: ArrowRight, color: "violet", title: "Upload knowledge", desc: "Add PDFs, docs, notes, and meeting summaries. NovaPilot indexes everything automatically." },
                  { step: "03", icon: Sparkles, color: "amber", title: "Ask in plain English", desc: "Type a question like you'd ask a colleague. No SQL, no filters, no learning curve." },
                  { step: "04", icon: TrendingUp, color: "emerald", title: "Get clear answers", desc: "Receive grounded answers with confidence scores, source citations, and next steps." },
                ].map(({ step, icon: Icon, color, title, desc }) => (
                  <FadeIn key={step}>
                    <div className={cn(
                      "group relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                      color === "sky" && "hover:border-sky-200",
                      color === "violet" && "hover:border-violet-200",
                      color === "amber" && "hover:border-amber-200",
                      color === "emerald" && "hover:border-emerald-200",
                    )}>
                      <div className={cn(
                        "mb-5 flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-black",
                        color === "sky" && "border-sky-100 bg-sky-50 text-sky-600",
                        color === "violet" && "border-violet-100 bg-violet-50 text-violet-600",
                        color === "amber" && "border-amber-100 bg-amber-50 text-amber-600",
                        color === "emerald" && "border-emerald-100 bg-emerald-50 text-emerald-600",
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Step {step}</p>
                      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>

          {/* ── AI INSIGHT PIPELINE ── */}
          <section className="py-20 border-t border-slate-100">
            <FadeIn>
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 shadow-sm mb-4">
                  <Sparkles className="h-3 w-3 text-violet-500" /> Under the hood
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">Your data becomes intelligence</h2>
                <p className="mt-4 text-slate-500 max-w-xl mx-auto">NovaPilot reads your data, understands context, and surfaces what matters — automatically.</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 md:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400/5 rounded-full blur-3xl" />
                <div className="relative z-10 grid gap-6 md:grid-cols-3">
                  {[
                    { label: "Raw data", items: ["Stripe MRR", "HubSpot CRM", "GA4 traffic", "PDF reports", "Meeting notes"], color: "slate", icon: "📥" },
                    { label: "NovaPilot AI", items: ["Reads & indexes sources", "Understands context", "Detects patterns", "Scores confidence", "Builds citations"], color: "sky", icon: "⚡" },
                    { label: "Clear output", items: ["Plain-English answers", "Confidence scores", "Source citations", "Anomaly alerts", "Action suggestions"], color: "emerald", icon: "✅" },
                  ].map(({ label, items, color, icon }, i) => (
                    <div key={label} className="flex flex-col gap-4">
                      {i === 1 && (
                        <div className="hidden md:flex absolute left-1/3 top-1/2 -translate-y-1/2 items-center justify-center w-6 h-6">
                          <ArrowRight className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                      <div className={cn(
                        "rounded-2xl border p-6",
                        color === "slate" && "border-slate-200 bg-white",
                        color === "sky" && "border-sky-200 bg-sky-50/60",
                        color === "emerald" && "border-emerald-200 bg-emerald-50/60",
                      )}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xl">{icon}</span>
                          <p className={cn(
                            "text-sm font-bold",
                            color === "slate" && "text-slate-700",
                            color === "sky" && "text-sky-700",
                            color === "emerald" && "text-emerald-700",
                          )}>{label}</p>
                        </div>
                        <ul className="space-y-2">
                          {items.map((item) => (
                            <li key={item} className={cn(
                              "flex items-center gap-2 text-xs",
                              color === "slate" && "text-slate-500",
                              color === "sky" && "text-sky-700",
                              color === "emerald" && "text-emerald-700",
                            )}>
                              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                                color === "slate" && "bg-slate-300",
                                color === "sky" && "bg-sky-400",
                                color === "emerald" && "bg-emerald-400",
                              )} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </section>

          {/* ── USE CASES ── */}
          <section className="py-20 border-t border-slate-100">
            <FadeIn>
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 shadow-sm mb-4">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> Real use cases
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">Built for modern teams</h2>
                <p className="mt-4 text-slate-500 max-w-xl mx-auto">Whether you are a founder, operator, or analyst — NovaPilot saves hours every week.</p>
              </div>
            </FadeIn>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                { role: "Founders", emoji: "🚀", query: "\"Why did MRR drop this week?\"", answer: "3 churned accounts from the SMB segment. CAC rose 18%. Recommend reviewing onboarding flow.", tags: ["Revenue", "Churn", "CAC"] },
                { role: "Sales teams", emoji: "📈", query: "\"Which leads are most likely to close?\"", answer: "4 accounts show high engagement signals: 3 demos, 2 proposals viewed, 1 within budget range.", tags: ["Pipeline", "CRM", "Forecast"] },
                { role: "Product teams", emoji: "🛠️", query: "\"What are users complaining about most?\"", answer: "Top 3 themes: slow load times (42%), missing export (28%), pricing confusion (19%).", tags: ["Feedback", "NPS", "Insights"] },
                { role: "Operators", emoji: "⚙️", query: "\"Any anomalies in last 7 days?\"", answer: "Traffic spike on Tuesday (+340%) — traced to a ProductHunt launch. Revenue stable.", tags: ["Anomaly", "Traffic", "Alert"] },
                { role: "Analysts", emoji: "📊", query: "\"Compare Q1 vs Q2 revenue growth.\"", answer: "Q2 grew 34% vs Q1. Top driver: Enterprise plan upgrades. Churn improved by 6 points.", tags: ["Analytics", "Growth", "Trends"] },
                { role: "Executives", emoji: "🎯", query: "\"What should I focus on this week?\"", answer: "Priority 1: Renewal risk for 3 key accounts. Priority 2: Onboarding drop-off at step 4.", tags: ["Strategy", "Risk", "Focus"] },
              ].map(({ role, emoji, query, answer, tags }) => (
                <FadeIn key={role}>
                  <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/50">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{emoji}</span>
                      <p className="text-sm font-bold text-slate-900">{role}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 mb-3">
                      <p className="text-xs text-slate-500 italic">{query}</p>
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3 mb-4">
                      <p className="text-xs text-sky-800 leading-relaxed">{answer}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">{t}</span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="py-20 border-t border-slate-100">
            <FadeIn>
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 shadow-sm mb-4">
                  <Shield className="h-3 w-3 text-slate-500" /> Quick answers
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">Common questions</h2>
              </div>
            </FadeIn>
            <div className="mx-auto max-w-3xl grid gap-4">
              {[
                { q: "Do I need technical skills to use NovaPilot?", a: "No. If you can type a question, you can use NovaPilot. It's designed for founders, operators, and team leads — not engineers." },
                { q: "What data sources can I connect?", a: "Stripe, HubSpot, GA4, Notion, Slack, and more — plus file uploads (PDF, DOCX, CSV, Markdown). New connectors are added regularly." },
                { q: "How does the AI answer my questions?", a: "NovaPilot uses retrieval-augmented generation (RAG): it searches your connected data, finds relevant context, and generates a grounded answer with source citations." },
                { q: "Is my data private and secure?", a: "Yes. Each workspace is isolated. Your data is never used to train AI models and is encrypted at rest and in transit using AES-256." },
                { q: "How long does setup take?", a: "Most teams are up and running in under 10 minutes. Connect a data source, upload a document, ask your first question — that's it." },
                { q: "What makes this different from ChatGPT?", a: "ChatGPT uses general knowledge. NovaPilot answers from your actual data — with confidence scores, source citations, and anomaly detection built in." },
              ].map(({ q, a }) => (
                <FadeIn key={q}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300">
                    <p className="text-sm font-semibold text-slate-900 mb-2">{q}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* Trust Infrastructure */}
          <section className="py-24">
            <article className="card p-12 bg-slate-950 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                    Trust your data. <br/>
                    <span className="text-slate-500">By default.</span>
                  </h2>
                  <p className="mt-6 text-slate-400 text-lg leading-relaxed">
                    Every answer shows where it came from. Your workspace stays private and your data stays yours.
                  </p>
                  <div className="mt-10 flex gap-8">
                    <TrustMetric value="99.9%" label="Data Fidelity" />
                    <TrustMetric value="AES-256" label="Encryption" />
                    <TrustMetric value="SOC2" label="Compliance" />
                  </div>
                </div>
                <div className="grid gap-4">
                  <article className="glass p-6 rounded-2xl border-white/5">
                    <Lock className="h-5 w-5 text-sky-400 mb-4" />
                    <h3 className="text-white font-bold mb-2">Private workspace</h3>
                    <p className="text-slate-500 text-sm">Your data stays in your organization and is not mixed with other customers.</p>
                  </article>
                  <article className="glass p-6 rounded-2xl border-white/5">
                    <TrendingUp className="h-5 w-5 text-emerald-400 mb-4" />
                    <h3 className="text-white font-bold mb-2">Clear confidence</h3>
                    <p className="text-slate-500 text-sm">Each answer gets a confidence score and citations when available.</p>
                  </article>
                </div>
              </div>
            </article>
          </section>

          <FadeIn delay={0.2}>
            <PricingSection />
          </FadeIn>

          <section className="py-32 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-8">Ready to get started?</h2>
            <Link href={isAuthenticated ? "/dashboard" : "/signup"} className="inline-flex h-16 px-12 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-sky-200 items-center justify-center gap-4 transition-all hover:bg-sky-600 hover:scale-105 active:scale-95">
              {isAuthenticated ? "Go to Dashboard" : "Start free"} <ArrowRight className="h-5 w-5" />
            </Link>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-100 bg-slate-50/50 py-20 px-6">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Link href="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900 transition">Terms</Link>
              <Link href="/security" className="hover:text-slate-900 transition">Security</Link>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              © 2026 NovaPilot AI. Clear answers by design.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, index }: any) {
  return (
    <article className="group card p-10 hover:border-sky-200 transition-all duration-500">
      <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:bg-sky-500 group-hover:text-white group-hover:rotate-6 transition-all duration-500">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Protocol 0{index}</p>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-[15px]">{desc}</p>
    </article>
  );
}

function TrustMetric({ value, label }: any) {
  return (
    <div className="space-y-1">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  );
}
