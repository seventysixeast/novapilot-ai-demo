import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { runConnectorSync, connectConnector } from "@/features/connectors/actions";
import { getCurrentMembership } from "@/lib/server/tenant";
import { getPlanLimitsForOrganization } from "@/lib/server/permissions";
import { createClient } from "@/lib/supabase/server";
import { RefreshCcw, Lock, Link2, AlertCircle, CheckCircle2, Clock, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PROVIDER_COLORS: Record<string, string> = {
  stripe: "bg-violet-50 text-violet-600 border-violet-100",
  hubspot: "bg-orange-50 text-orange-600 border-orange-100",
  google_analytics: "bg-sky-50 text-sky-600 border-sky-100",
  ga4: "bg-sky-50 text-sky-600 border-sky-100",
  default: "bg-slate-50 text-slate-600 border-slate-100",
};

const AVAILABLE_PROVIDERS = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Sync your customers, subscriptions, invoices, and revenue metrics.",
    category: "Finance & Billing",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync contacts, deals, pipeline performance, and sales attribution.",
    category: "CRM & Sales",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Sync active users, pageviews, session duration, and traffic channels.",
    category: "Analytics & Traffic",
  },
];

export default async function ConnectorsPage() {
  const membership = await getCurrentMembership();
  const supabase = await createClient();

  let connectors: Array<{
    id: string;
    provider: string;
    status: "connected" | "syncing" | "error" | "disconnected";
    last_synced_at: string | null;
  }> = [];

  const limits = await getPlanLimitsForOrganization();

  if (membership) {
    const { data } = await supabase
      .from("data_connections")
      .select("id, provider, status, last_synced_at")
      .eq("organization_id", membership.organizationId)
      .order("provider");
    connectors = (data ?? []) as typeof connectors;
  }

  const activeCount = connectors.filter((c) => c.status === "connected").length;
  const staleCount = connectors.filter((c) => c.status !== "connected" && c.last_synced_at).length;

  const connectedProviders = new Set(connectors.map(c => c.provider.toLowerCase()));
  const integrationsToConnect = AVAILABLE_PROVIDERS.filter(p => !connectedProviders.has(p.id));

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
              Sources ready
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Data sources</h1>
          <p className="text-slate-500 max-w-xl leading-relaxed">
            Connect your tools and keep them up to date automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Limit</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {connectors.length} / {limits.maxConnectors >= 999 ? "∞" : limits.maxConnectors} sources
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <Link
            href="/dashboard/billing"
            className="h-10 px-5 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Upgrade <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Connected", value: activeCount, color: "emerald" },
          { label: "Needs attention", value: staleCount, color: "amber" },
          { label: "Plan Limit", value: limits.maxConnectors >= 999 ? "∞" : limits.maxConnectors, color: "sky" },
        ].map((stat) => (
          <article
            key={stat.label}
            className="card p-5 flex flex-col gap-2"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={cn(
              "text-3xl font-bold",
              stat.color === "emerald" ? "text-emerald-600" :
              stat.color === "amber" ? "text-amber-600" :
              "text-sky-600"
            )}>{stat.value}</p>
          </article>
        ))}
      </div>

      {/* Connectors List */}
      <article className="card overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Connected sources</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-lg">
            {connectors.length} total
          </span>
        </div>

        {connectors.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {connectors.map((connector, index) => {
              const isLocked = index >= limits.maxConnectors;
              const providerKey = connector.provider.toLowerCase().replace(" ", "_");
              const colorClass = PROVIDER_COLORS[providerKey] || PROVIDER_COLORS.default;
              const isConnected = connector.status === "connected";

              return (
                <div
                  key={connector.id}
                  className={cn(
                    "flex items-center gap-6 px-8 py-5 transition-all",
                    isLocked ? "opacity-50 bg-slate-50/30" : "hover:bg-slate-50/40"
                  )}
                >
                  {/* Provider Icon */}
                  <div className={cn(
                    "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 text-[10px] font-black uppercase",
                    colorClass
                  )}>
                    {connector.provider.slice(0, 2)}
                  </div>

                  {/* Provider Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 capitalize">{connector.provider}</p>
                      {isLocked && <Lock className="h-3 w-3 text-slate-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {connector.last_synced_at
                        ? `Last synced ${new Date(connector.last_synced_at).toLocaleString()}`
                        : "Never synced"}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    isLocked
                      ? "bg-slate-100 text-slate-500 border-slate-200"
                      : isConnected
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : connector.status === "error"
                      ? "bg-rose-50 text-rose-700 border-rose-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {isLocked ? (
                      <Lock className="h-3 w-3" />
                    ) : isConnected ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {isLocked ? "Locked" : connector.status}
                  </span>

                  {/* Action */}
                  <div className="shrink-0">
                    {isLocked ? (
                      <Link
                        href="/dashboard/billing"
                        className="h-9 px-4 rounded-xl bg-sky-50 text-sky-700 text-[10px] font-black uppercase tracking-widest border border-sky-100 flex items-center gap-1.5 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all"
                      >
                        Upgrade <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <form action={runConnectorSync}>
                        <input type="hidden" name="connector_id" value={connector.id} />
                        <input type="hidden" name="provider" value={connector.provider} />
                        <FormSubmitButton
                          idleText="Sync"
                          pendingText="Syncing..."
                          icon={<RefreshCcw className="h-3.5 w-3.5" />}
                        />
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <Link2 className="h-5 w-5 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No sources connected yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Choose one of our available integrations below to get started.
            </p>
          </div>
        )}
      </article>

      {/* Available Integrations */}
      {integrationsToConnect.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Available Integrations</h2>
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {integrationsToConnect.length} integrations left
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {integrationsToConnect.map((integration) => {
              const providerKey = integration.id;
              const colorClass = PROVIDER_COLORS[providerKey] || PROVIDER_COLORS.default;
              const isLocked = connectors.length >= limits.maxConnectors;

              return (
                <article
                  key={integration.id}
                  className={cn(
                    "card p-6 flex flex-col justify-between gap-6 transition-all duration-300 relative group overflow-hidden border border-slate-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5",
                    isLocked && "opacity-80"
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl border flex items-center justify-center text-xs font-black uppercase shadow-sm group-hover:scale-105 transition-all duration-300",
                        colorClass
                      )}>
                        {integration.name.slice(0, 2)}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        {integration.category}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900 leading-snug capitalize">
                        {integration.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    {isLocked ? (
                      <Link
                        href="/dashboard/billing"
                        className="w-full h-10 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Unlock on Pro
                      </Link>
                    ) : (
                      <form action={connectConnector}>
                        <input type="hidden" name="provider" value={integration.id} />
                        <FormSubmitButton
                          idleText={`Connect ${integration.name}`}
                          pendingText="Connecting..."
                          icon={<Plus className="h-3.5 w-3.5" />}
                          className="w-full h-10 text-[10px] rounded-xl font-black tracking-widest bg-slate-900 text-white hover:bg-sky-500 border border-transparent shadow-md hover:shadow-sky-100 transition-all cursor-pointer"
                        />
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {integrationsToConnect.length === 0 && (
        <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center max-w-xl mx-auto">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-4 text-emerald-500 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">All integrations connected!</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            You have successfully connected all available data pipelines. Contact our support team if you want to request custom API integrations.
          </p>
        </div>
      )}
    </div>
  );
}

