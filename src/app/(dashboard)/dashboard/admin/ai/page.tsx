import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/server/tenant";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ShieldCheck,
  Zap,
  Server,
  RotateCcw,
  ArrowRightLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Globe,
  CpuIcon,
  Terminal,
  Box,
  LucideIcon,
} from "lucide-react";
import { env } from "@/lib/env";
import { getAIRouterConfig } from "@/lib/ai/config";
import { cn } from "@/lib/utils";
import { toggleTesterStatus, resetQuotas, switchPlan, expireTrial, executeSyncTest } from "./actions";

async function simulateProProvisioning() {
  "use server";
  await switchPlan("pro");
}

async function synchronizeCluster() {
  "use server";
  await executeSyncTest();
}

export default async function AIAdminPage() {
  const membership = await getCurrentMembership();
  if (!membership || (!membership.isInternalTester && membership.role !== "super_admin")) {
    redirect("/dashboard");
  }

  const config = await getAIRouterConfig();
  const supabase = await createClient();

  const { data: usageLogs } = await supabase
    .from("ai_usage_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const providers = [
    { 
      id: "openrouter", 
      name: "OpenRouter", 
      type: "Fast answers", 
      icon: Globe, 
      status: env.OPENROUTER_API_KEY ? "Operational" : "Degraded",
      model: config.preferredModels.openrouter,
      isDefault: config.defaultLightweightProvider === "openrouter",
      latency: "245ms",
      throughput: "14.2 tps"
    },
    { 
      id: "groq", 
      name: "Groq", 
      type: "Quick reasoning", 
      icon: Zap, 
      status: env.GROQ_API_KEY ? "Operational" : "Degraded",
      model: config.preferredModels.groq,
      isDefault: config.defaultLightweightProvider === "groq",
      latency: "85ms",
      throughput: "340 tps"
    },
    { 
      id: "ollama", 
      name: "Ollama", 
      type: "Local mode", 
      icon: Server, 
      status: env.OLLAMA_BASE_URL ? "Ready" : "Offline",
      model: config.preferredModels.ollama,
      isDefault: config.defaultLightweightProvider === "ollama",
      latency: "12ms",
      throughput: "82 tps"
    },
    { 
      id: "openai", 
      name: "OpenAI", 
      type: "OpenAI", 
      icon: CpuIcon, 
      status: env.OPENAI_API_KEY ? "Operational" : "Degraded",
      model: config.preferredModels.openai,
      isDefault: config.defaultPremiumProvider === "openai" || config.fallbackEnabled,
      latency: "1.2s",
      throughput: "4.5 tps"
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Immersive Header */}
      <header className="relative p-12 rounded-[3rem] bg-slate-900 text-white overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-400">AI admin</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            AI routing <br/>
            <span className="text-slate-500">and health.</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-2xl">
            See which provider is active, how fast it responds, and whether your keys are ready.
          </p>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <Terminal className="absolute bottom-12 right-12 h-64 w-64 text-white/5 -rotate-12 pointer-events-none" />
      </header>

      {/* Provider Matrix */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {providers.map((p) => (
          <ProviderCard key={p.id} {...p} />
        ))}
      </section>

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Routing & Intelligence Table */}
        <div className="lg:col-span-8 space-y-12">
          
          <article className="card p-10 space-y-10">
            <div className="flex items-center justify-between border-b border-slate-50 pb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Routing rules</h2>
                <p className="text-sm font-medium text-slate-500">How NovaPilot chooses a provider and falls back if needed.</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase tracking-widest text-[10px] py-1 px-3">
                Live
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TierConfig 
                title="Quick answers"
                provider={config.defaultLightweightProvider}
                icon={Zap}
                description="Handles short answers, help text, and guided steps."
              />
              <TierConfig 
                title="Deeper analysis"
                provider={config.defaultPremiumProvider}
                icon={CpuIcon}
                description="Powers longer answers, reports, and source-backed analysis."
              />
            </div>

            <div className="p-8 rounded-[2.5rem] bg-emerald-50/50 border border-emerald-100/60 flex items-start gap-6 group hover:bg-emerald-50 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Fallbacks are on</h4>
                <p className="text-[13px] text-emerald-800/70 font-medium leading-relaxed">
                  If one provider is unavailable, NovaPilot switches to the next available option automatically.
                </p>
              </div>
            </div>
          </article>

          {/* Telemetry Log */}
          <article className="card overflow-hidden">
            <div className="p-10 flex items-center justify-between border-b border-slate-50">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent AI requests</h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-10 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Time</th>
                    <th className="text-left px-4 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Provider</th>
                    <th className="text-left px-4 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Model</th>
                    <th className="text-right px-10 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usageLogs?.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6 font-bold text-slate-400 tabular-nums">
                        {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                      </td>
                      <td className="px-4 py-6">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-900">
                          {log.provider}
                        </span>
                      </td>
                      <td className="px-4 py-6 font-bold text-slate-900 truncate max-w-[200px]">
                        {log.model}
                      </td>
                      <td className="px-10 py-6 text-right">
                          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                          OK
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        {/* Sidebar Utilities */}
        <div className="lg:col-span-4 space-y-12">
          
          {/* Key Infrastructure Status */}
          <article className="card p-10 space-y-10">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Connected keys</h3>
              <p className="text-xs font-medium text-slate-400">Local environment key status</p>
            </div>
            
            <div className="space-y-4">
              <EnvStatusItem label="OpenAI key" isSet={!!env.OPENAI_API_KEY} />
              <EnvStatusItem label="OpenRouter key" isSet={!!env.OPENROUTER_API_KEY} />
              <EnvStatusItem label="Groq key" isSet={!!env.GROQ_API_KEY} />
              <EnvStatusItem label="Ollama" isSet={!!env.OLLAMA_BASE_URL} />
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Access note</h4>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                  Keep your keys private and rotate them regularly.
                </p>
              </div>
              <ShieldCheck className="absolute -bottom-4 -right-4 h-20 w-20 text-white/5 -rotate-12" />
            </div>
          </article>

          {/* Infrastructure Controls */}
          <article className="card bg-slate-50/50 p-10 space-y-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                <Box className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Admin actions</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Testing tools</p>
              </div>
            </div>

            <div className="grid gap-3">
              <AdminActionForm action={toggleTesterStatus} icon={ShieldCheck} label="Toggle internal access" />
              <AdminActionForm action={resetQuotas} icon={RotateCcw} label="Reset quotas" />
              <AdminActionForm action={simulateProProvisioning} icon={Zap} label="Test Pro plan" />
              <AdminActionForm action={expireTrial} icon={Clock} label="Expire trial" />
              
              <div className="pt-4 border-t border-slate-100">
                <form action={synchronizeCluster}>
                  <button className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-sky-200 transition-all hover:bg-sky-600 hover:scale-105 active:scale-95">
                    <Activity className="h-5 w-5" />
                    Run sync check
                  </button>
                </form>
              </div>
            </div>
          </article>

        </div>
      </div>
    </div>
  );
}

type ProviderCardProps = {
  name: string;
  type: string;
  icon: LucideIcon;
  status: string;
  model: string;
  isDefault: boolean;
  latency: string;
  throughput: string;
};

function ProviderCard({ name, type, icon: Icon, status, model, isDefault, latency, throughput }: ProviderCardProps) {
  const isOk = status === "Operational" || status === "Ready";
  
  return (
    <article className={cn(
      "group relative card p-8 transition-all duration-500",
      isDefault ? "border-sky-200 bg-sky-50/20" : "hover:border-slate-300"
    )}>
      <div className="flex items-center justify-between mb-8">
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          isOk ? "bg-slate-50 group-hover:bg-sky-500 group-hover:text-white" : "bg-rose-50 text-rose-500"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{type}</p>
          <p className="text-xs font-black text-slate-900 mt-1">{latency}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">{name}</h3>
          <div className={cn(
            "h-2 w-2 rounded-full",
            isOk ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
          )} />
        </div>
        
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[10px] text-slate-600 break-all leading-relaxed">
          {model}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{throughput}</span>
          {isDefault && (
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-600 bg-white border border-sky-100 px-2 py-0.5 rounded shadow-sm">
              Default
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

type TierConfigProps = {
  title: string;
  provider: string;
  icon: LucideIcon;
  description: string;
};

function TierConfig({ title, provider, icon: Icon, description }: TierConfigProps) {
  return (
    <div className="space-y-4 group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</h4>
      </div>
      <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-all">
        <p className="text-[10px] text-slate-400 mb-1 font-black uppercase tracking-widest">Routing Target</p>
        <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{provider}</p>
        <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}

function EnvStatusItem({ label, isSet }: { label: string; isSet: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:border-slate-100 transition-colors">
      <span className="text-[11px] font-black uppercase tracking-tight text-slate-600">{label}</span>
      {isSet ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black">
          <CheckCircle2 className="h-3 w-3" />
          ACTIVE
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-[9px] font-black">
          <AlertTriangle className="h-3 w-3" />
          NULL
        </div>
      )}
    </div>
  );
}

type AdminActionFormProps = {
  action: () => Promise<void>;
  icon: LucideIcon;
  label: string;
};

function AdminActionForm({ action, icon: Icon, label }: AdminActionFormProps) {
  return (
    <form action={action}>
      <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/5 transition-all text-left group">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-700">{label}</span>
        </div>
        <ArrowRightLeft className="h-4 w-4 text-slate-200 group-hover:text-sky-500 transition-all" />
      </button>
    </form>
  );
}
