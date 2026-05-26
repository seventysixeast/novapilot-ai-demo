"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type UserNavProps = {
  isCollapsed?: boolean;
  userEmail?: string;
  role?: string;
};

export function UserNav({ isCollapsed = false, userEmail, role }: UserNavProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className={cn(
      "flex items-center gap-3",
      isCollapsed ? "justify-center" : "justify-between"
    )}>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account</span>
            <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
              {role ? role.replaceAll("_", " ") : "Workspace member"}
            </span>
          </div>
        )}
      
      <div className="relative group">
        <button className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/10 transition-all hover:scale-105 active:scale-95 group-hover:bg-sky-500">
          <User className="h-5 w-5" />
        </button>

        {/* Premium Dropdown Menu */}
        <div className={cn(
          "absolute mt-2 w-56 rounded-2xl bg-white border border-slate-100 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] overflow-hidden",
          isCollapsed ? "left-0" : "right-0"
        )}>
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 mb-2 border-b border-slate-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{userEmail || "Identity not synced"}</p>
            </div>
            
            <Link 
              href="/dashboard/settings" 
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group/item"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                Settings
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-all" />
            </Link>
            
            <Link 
              href="/dashboard/billing" 
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group/item"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4" />
                Billing
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-all" />
            </Link>
            
            <div className="h-px bg-slate-50 my-2" />
            
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
