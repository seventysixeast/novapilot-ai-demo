"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Logo } from "@/components/brand/logo";

export function MobileSidebar({ userEmail }: { userEmail?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden shadow-sm hover:bg-slate-50 transition-all"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[100] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute left-0 top-0 h-full w-[min(88vw,320px)] bg-white border-r border-slate-100 flex flex-col p-8"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="mb-10 flex items-center justify-between">
                <Logo className="h-6" />
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 hover:text-slate-900 transition-all"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide -mx-2 px-2">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50">
                {userEmail ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signed in as</p>
                    <p className="truncate text-xs font-semibold text-slate-900">{userEmail}</p>
                  </div>
                ) : (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">NovaPilot AI</p>
                )}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
