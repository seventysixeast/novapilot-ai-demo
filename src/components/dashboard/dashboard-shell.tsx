"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { UserNav } from "./user-nav";
import { Logo, LogoMark } from "@/components/brand/logo";
import { MobileSidebar } from "./mobile-sidebar";
import { CommandPalette } from "./command-palette";
import { PageTransition } from "@/components/ui/page-transition";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string;
  role?: string;
}

export function DashboardShell({ children, userEmail, role }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#fdfdfe] text-slate-900 overflow-hidden">
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 84 : 280 }}
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-100 h-full relative z-[60] transition-all duration-300 ease-in-out",
          isCollapsed ? "items-center" : ""
        )}
      >
        <div className={cn(
          "h-20 shrink-0 flex items-center px-6",
          isCollapsed ? "justify-center px-0" : "justify-between"
        )}>
          {!isCollapsed ? (
            <Logo className="h-6" />
          ) : (
            <LogoMark className="h-8 w-8" />
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "absolute -right-3 top-24 h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all z-50",
              isCollapsed && "rotate-180"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 scrollbar-hide hover:scrollbar-default">
          <SidebarNav isCollapsed={isCollapsed} />
        </div>

        <div className="shrink-0 p-4 border-t border-slate-100 bg-white transition-all duration-300"
          style={{ ...(isCollapsed ? { width: '100%' } : {}) }}
        >
          <UserNav isCollapsed={isCollapsed} userEmail={userEmail} role={role} />
        </div>
      </motion.aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-20 shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <MobileSidebar userEmail={userEmail} />
            <CommandPalette />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Workspace ready</span>
            </div>
            
            <div className="h-8 w-px bg-slate-100 hidden md:block" />
            
            <div className="flex items-center gap-2">
              <button className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50">
                <Bell className="h-4 w-4" />
              </button>
              <button className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#fdfdfe] relative" id="dashboard-main">
          <div className="flex-1 w-full max-w-[1600px] mx-auto p-6 lg:p-12 flex flex-col">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
          
          <footer className="mt-auto py-10 px-12 border-t border-slate-50 flex justify-between items-center opacity-25 pointer-events-none">
            <LogoMark className="h-6 w-6" />
            <p className="text-[10px] font-black uppercase tracking-widest">NovaPilot</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
