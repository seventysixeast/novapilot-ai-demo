"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Command, Search, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sidebarGroups } from "./sidebar-config";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const allActions = useMemo(() => {
    return sidebarGroups.flatMap(group => group.items);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(
    () => allActions.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [query, allActions],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-xs font-bold text-slate-500 transition-all hover:bg-slate-100/80 hover:border-slate-200"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Quick Search...</span>
        <span className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-400">
          <Command className="h-2.5 w-2.5" /> K
        </span>
      </button>
      
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/40 backdrop-blur-md p-4 pt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-xl rounded-[2rem] border border-slate-100 bg-white shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative border-b border-slate-50 p-6">
                <Search className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Navigate to workflow or search intelligence..."
                  className="w-full pl-12 pr-4 py-3 text-lg font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
                  autoFocus
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto p-4 custom-scrollbar scrollbar-hide">
                {filtered.length > 0 ? (
                  <div className="space-y-1">
                    {filtered.map((item) => (
                      <button
                        key={item.href}
                        className="group w-full flex items-center justify-between rounded-2xl px-5 py-4 text-left transition-all hover:bg-slate-50"
                        onClick={() => {
                          router.push(item.href);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-sky-500 group-hover:border-sky-200 transition-all">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.label}</p>
                            <p className="text-[10px] font-medium text-slate-400">Jump to {item.label}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">No signals matched your query</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching for 'Dashboard' or 'AI Workspace'</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5 shadow-sm text-slate-900">↵</span> Select
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5 shadow-sm text-slate-900">↑↓</span> Navigate
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-sky-600">NovaPilot Search</div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
