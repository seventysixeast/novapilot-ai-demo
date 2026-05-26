import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { Settings, Shield, Bell, Cpu, Globe, User, ChevronRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PRICING_PLANS } from "@/lib/billing/plans";

export default async function SettingsPage() {
  const membership = await getCurrentMembership();
  const supabase = await createClient();

  type ProfileRecord = { full_name: string | null; avatar_url: string | null; job_title: string | null };
  type SubscriptionRecord = { plan_code: string; status: string; current_period_end: string | null };

  let profile: ProfileRecord | null = null;
  let subscription: SubscriptionRecord | null = null;
  let orgName = "My Organization";

  if (membership) {
    const [{ data: profileData }, { data: orgData }, { data: subscriptionData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url, job_title")
        .eq("id", membership.userId)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("name")
        .eq("id", membership.organizationId)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan_code, status, current_period_end")
        .eq("organization_id", membership.organizationId)
        .maybeSingle(),
    ]);
    profile = (profileData as ProfileRecord | null) ?? null;
    subscription = (subscriptionData as SubscriptionRecord | null) ?? null;
    if (orgData?.name) orgName = orgData.name;
  }

  const activePlan = PRICING_PLANS[subscription?.plan_code || "basic"] || PRICING_PLANS.basic;

  const settingsSections = [
    {
      icon: User,
      title: "Profile",
      desc: "Manage your personal identity and credentials",
      href: "#profile",
      status: profile?.full_name ? "configured" : "pending",
      color: "sky",
    },
    {
      icon: Globe,
      title: "Workspace",
      desc: "Organization name, slug, and team settings",
      href: "#workspace",
      status: "configured",
      color: "indigo",
    },
    {
      icon: Bell,
      title: "Notifications",
      desc: "Alert preferences and digest scheduling",
      href: "/dashboard/notifications",
      status: "configured",
      color: "amber",
    },
    {
      icon: Cpu,
      title: "AI Configuration",
      desc: "Model routing, provider preferences, and response tuning",
      href: "/dashboard/admin/ai",
      status: "configured",
      color: "violet",
    },
    {
      icon: Shield,
      title: "Security & Access",
      desc: "Role-based access control, audit logs, and session management",
      href: "/dashboard/admin",
      status: "configured",
      color: "emerald",
    },
  ];

  const colorMap: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600 border-sky-100 group-hover:bg-sky-500",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-500",
    amber: "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500",
    violet: "bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-500",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            System Configuration
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 leading-relaxed">
          Configure your intelligence workspace, integrations, and account preferences.
        </p>
      </header>

      {/* Profile Card */}
      <article className="card p-8" id="profile">
        <div className="flex items-start gap-6">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shrink-0">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" fill unoptimized className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400">
                <User className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Node</p>
            <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || "Anonymous User"}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{profile?.job_title || "No title configured"}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                {membership?.role?.replace("_", " ") || "Member"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-[10px] font-black uppercase tracking-widest text-sky-700 border border-sky-100">
                {orgName}
              </span>
            </div>
          </div>
          <button className="h-10 px-5 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
            Edit Profile
          </button>
        </div>
      </article>

      {/* Settings Navigation Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="group card p-6 flex flex-col gap-4 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:text-white ${colorMap[section.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {section.status === "configured" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">{section.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{section.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                Configure <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Workspace Card */}
      <article className="card p-8" id="workspace">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Workspace Configuration</h2>
            <p className="text-sm text-slate-500 mt-0.5">Organization-level settings and branding</p>
          </div>
          <button className="h-10 px-5 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
            Edit
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Organization Name", value: orgName },
            { label: "Role", value: membership?.role?.replace("_", " ") || "Member" },
            { label: "Plan Tier", value: activePlan.name },
            { label: "Billing Status", value: subscription?.status || "inactive" },
            { label: "Region", value: "Global Edge" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
              <p className="text-sm font-bold text-slate-900 mt-1 capitalize">{item.value}</p>
            </div>
          ))}
        </div>
      </article>

      {/* Danger Zone */}
      <article className="card p-8 border-rose-100 bg-rose-50/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danger Zone</h2>
            <p className="text-sm text-slate-500 mt-0.5">Irreversible actions that affect your workspace.</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between p-5 rounded-2xl border border-rose-200 bg-white">
          <div>
            <p className="text-sm font-bold text-slate-900">Delete Workspace</p>
            <p className="text-xs text-slate-500 mt-0.5">Permanently remove all data and cancel your subscription.</p>
          </div>
          <button className="h-10 px-5 rounded-2xl border border-rose-200 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
            Delete
          </button>
        </div>
      </article>
    </div>
  );
}
