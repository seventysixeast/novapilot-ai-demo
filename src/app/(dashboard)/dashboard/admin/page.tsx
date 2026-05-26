import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { checkPermission } from "@/lib/server/permissions";
import { redirect } from "next/navigation";
import { Shield, Users, Crown, Settings, ArrowUpRight, Activity, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-700 border-violet-200",
  admin: "bg-sky-100 text-sky-700 border-sky-200",
  manager: "bg-indigo-100 text-indigo-700 border-indigo-200",
  team_member: "bg-slate-100 text-slate-700 border-slate-200",
  customer: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function AdminPage() {
  const membership = await getCurrentMembership();

  if (!membership || !(await checkPermission("admin"))) {
    redirect("/dashboard?error=Unauthorized");
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      user_id,
      role,
      profiles (
        full_name,
        avatar_url,
        job_title
      )
    `)
    .eq("organization_id", membership.organizationId);

  const memberList = (members ?? []) as any[];
  const adminCount = memberList.filter((m) =>
    ["super_admin", "admin"].includes(m.role)
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-600">
              Admin Control Plane
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Workspace Admin</h1>
          <p className="text-slate-500 leading-relaxed">
            Manage team members, roles, and organizational access control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/ai"
            className="h-11 px-5 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            AI Models <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/dashboard/settings"
            className="h-11 px-5 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Members", value: memberList.length, icon: Users, color: "sky" },
          { label: "Admin Roles", value: adminCount, icon: Crown, color: "violet" },
          { label: "Active Sessions", value: memberList.length, icon: Activity, color: "emerald" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="card p-6 flex items-center gap-5">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center border shrink-0",
                stat.color === "sky" ? "bg-sky-50 text-sky-600 border-sky-100" :
                stat.color === "violet" ? "bg-violet-50 text-violet-600 border-violet-100" :
                "bg-emerald-50 text-emerald-600 border-emerald-100"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Members Table */}
      <article className="card overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Team Members</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-lg">
            {memberList.length} members
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {memberList.length > 0 ? (
            memberList.map((m) => (
              <div key={m.user_id} className="flex items-center gap-5 px-8 py-4 hover:bg-slate-50/50 transition-all group">
                {/* Avatar */}
                <img
                  src={
                    m.profiles?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`
                  }
                  alt="Avatar"
                  className="h-10 w-10 rounded-full border border-slate-200 shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {m.profiles?.full_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.profiles?.job_title || "No title"}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </div>

                {/* Role Badge */}
                <span className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                  ROLE_STYLES[m.role] || ROLE_STYLES.team_member
                )}>
                  {m.role.replace(/_/g, " ")}
                </span>

                {/* Action */}
                <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
                  Edit Role
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="mx-auto w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
                <Users className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900">No team members yet</p>
              <p className="text-xs text-slate-500 mt-1">Invite your team to get started.</p>
            </div>
          )}
        </div>
      </article>

      {/* Access Control Note */}
      <article className="card p-6 border-amber-100 bg-amber-50/30 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Role-Based Access Control Active</p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            NovaPilot enforces a 5-tier RBAC model: Super Admin → Admin → Manager → Team Member → Customer.
            All plan enforcement, feature gating, and billing access is governed by these roles.
          </p>
        </div>
      </article>
    </div>
  );
}
