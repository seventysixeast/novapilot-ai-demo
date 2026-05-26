import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { SetupAssistant } from "@/components/onboarding/setup-assistant";
import { cn } from "@/lib/utils";
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { bootstrapWorkspace, completeOnboardingStep } from "@/features/onboarding/actions";

type OnboardingProgress = {
  role_template: string;
  step_1_connected: boolean;
  step_2_queries: boolean;
  step_3_team: boolean;
  completed: boolean;
};

export default async function OnboardingPage() {
  const membership = await getCurrentMembership();
  const supabase = await createClient();

  let progress: OnboardingProgress | null = null;

  if (membership) {
    const { data } = await supabase
      .from("onboarding_progress")
      .select("role_template, step_1_connected, step_2_queries, step_3_team, completed")
      .eq("organization_id", membership.organizationId)
      .maybeSingle();
    progress = (data ?? null) as OnboardingProgress | null;
  }

  if (!membership) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-5 py-20 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Finish workspace setup</h1>
        <p className="max-w-xl text-sm text-slate-600">
          Your account is active but your workspace is not fully provisioned yet. Continue setup to unlock onboarding and billing.
        </p>
        <form action={bootstrapWorkspace}>
          <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Create my workspace
          </button>
        </form>
      </div>
    );
  }

  const checklist = [
    {
      label: "Connect a data source",
      done: progress?.step_1_connected ?? false,
      description: "Start with Stripe, HubSpot, or Google Analytics 4.",
      icon: Globe,
      step: "connect",
      href: "/dashboard/connectors",
    },
    {
      label: "Ask your first question",
      done: progress?.step_2_queries ?? false,
      description: "Use the AI workspace to check what the data says.",
      icon: Zap,
      step: "query",
      href: "/dashboard/chat",
    },
    {
      label: "Invite your team",
      done: progress?.step_3_team ?? false,
      description: "Bring teammates in so everyone can collaborate on insights.",
      icon: ShieldCheck,
      step: "team",
      href: "/dashboard/settings",
    },
  ];
  const completedCount = checklist.filter((item) => item.done).length;
  const percentage = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-12 animate-in fade-in slide-in-from-bottom-4">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600">Get started</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">Set up your workspace</h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          Connect your tools, ask a question, and see the first insight in a few minutes.
        </p>
      </header>

      {/* Premium Progress Bar */}
      <div className="relative p-10 rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl shadow-slate-200">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-sky-400">Setup progress</h3>
            <span className="text-4xl font-bold text-white tracking-tighter">{percentage}%</span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.8)] transition-all duration-1000 ease-out" 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed">
            Finish these steps to unlock AI answers, charts, and alerts.
          </p>
        </div>
        
        {/* Abstract background blur */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
      </div>

      <div className="space-y-4">
        {checklist.map((item) => (
          <article key={item.label} className={cn(
            "group card p-8 flex items-center gap-8 transition-all duration-500",
            item.done ? "bg-slate-50/50 border-slate-100 opacity-60" : "hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/5 hover:-translate-y-0.5"
          )}>
            <div className={cn(
              "h-16 w-16 rounded-[1.25rem] flex items-center justify-center shrink-0 border transition-all duration-500",
              item.done 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : "bg-white border-slate-200 text-slate-400 group-hover:bg-sky-50 group-hover:border-sky-200 group-hover:text-sky-600"
            )}>
              <item.icon className="h-7 w-7" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className={cn(
                "text-xl font-bold tracking-tight transition-all",
                item.done ? "text-slate-400" : "text-slate-900"
              )}>
                {item.label}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
            </div>
            {item.done ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                <form action={completeOnboardingStep}>
                  <input type="hidden" name="step" value={item.step} />
                  <button className="flex items-center gap-2 h-12 px-5 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:border-slate-300 hover:text-slate-900">
                    Mark done
                  </button>
                </form>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-sky-500 hover:scale-105 active:scale-95"
                >
                  Open <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>

      <SetupAssistant />
    </div>
  );
}
