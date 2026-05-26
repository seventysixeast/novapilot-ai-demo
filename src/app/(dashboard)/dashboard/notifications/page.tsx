import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";
import { Bell, CheckCircle2, AlertCircle, Info, Zap, Clock, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG = {
  info: { icon: Info, color: "bg-sky-50 border-sky-100 text-sky-600", dot: "bg-sky-500", label: "Info" },
  warning: { icon: AlertCircle, color: "bg-amber-50 border-amber-100 text-amber-600", dot: "bg-amber-500", label: "Warning" },
  success: { icon: CheckCircle2, color: "bg-emerald-50 border-emerald-100 text-emerald-600", dot: "bg-emerald-500", label: "Success" },
  ai: { icon: Zap, color: "bg-violet-50 border-violet-100 text-violet-600", dot: "bg-violet-500", label: "AI" },
};

export default async function NotificationsPage() {
  const membership = await getCurrentMembership();
  const supabase = await createClient();

  const { data } = membership
    ? await supabase
        .from("notifications")
        .select("id, title, body, is_read, created_at")
        .eq("organization_id", membership.organizationId)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const notifications = (data ?? []) as Array<{
    id: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
  }>;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-4 w-4 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.6)]" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Alerts</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Alerts</h1>
          <p className="text-slate-500 leading-relaxed">
            Product updates, AI answers, and account changes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-50 border border-sky-100">
              <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">
                {unreadCount} Unread
              </span>
            </div>
          )}
          <button className="h-10 px-5 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2">
            <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
          </button>
        </div>
      </header>

      {/* Notification List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            // Heuristic: derive level from title
            const level =
              notification.title.toLowerCase().includes("anomal") ||
              notification.title.toLowerCase().includes("risk") ||
              notification.title.toLowerCase().includes("warn")
                ? "warning"
                : notification.title.toLowerCase().includes("ai") ||
                  notification.title.toLowerCase().includes("agent") ||
                  notification.title.toLowerCase().includes("sync")
                ? "ai"
                : notification.title.toLowerCase().includes("success") ||
                  notification.title.toLowerCase().includes("activated") ||
                  notification.title.toLowerCase().includes("paid")
                ? "success"
                : "info";

            const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];
            const Icon = config.icon;

            return (
              <article
                key={notification.id}
                className={cn(
                  "card p-5 flex items-start gap-5 transition-all hover:shadow-md",
                  !notification.is_read && "border-l-4 border-l-sky-400"
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center shrink-0", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                      {!notification.is_read && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-sky-500 text-white">
                          New
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "shrink-0 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                      config.color
                    )}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notification.body}</p>
                  {notification.created_at && (
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="py-24 text-center">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
              <Bell className="h-7 w-7 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">You&apos;re all caught up</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              NovaPilot will post updates here when something important changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
