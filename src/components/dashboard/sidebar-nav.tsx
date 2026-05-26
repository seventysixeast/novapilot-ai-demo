"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarGroups } from "./sidebar-config";

export function SidebarNav({ 
  onNavigate, 
  isCollapsed = false 
}: { 
  onNavigate?: () => void; 
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8">
      {sidebarGroups.map((group, groupIdx) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!isCollapsed && (
            <motion.h3 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
            >
              {group.label}
            </motion.h3>
          )}
          
          <div className="flex flex-col gap-0.5">
            {group.items.map((item, itemIdx) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (groupIdx * 0.1) + (itemIdx * 0.05) }}
                >
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl transition-all duration-300",
                      isCollapsed ? "justify-center p-3" : "px-4 py-2.5",
                      active
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900",
                      item.isCore && !active && "bg-sky-50 text-sky-700 hover:bg-sky-100"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-300",
                      active ? "text-sky-400" : item.isCore ? "text-sky-600" : "text-slate-400 group-hover:text-slate-900"
                    )} />
                    
                    {!isCollapsed && (
                      <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                        <span className={cn(
                          "text-[12px] font-bold tracking-tight truncate transition-all",
                          active ? "translate-x-0.5" : ""
                        )}>
                          {item.label}
                        </span>
                        
                        {item.isPro && !active && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded-lg border border-sky-100 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                            Pro
                          </span>
                        )}
                        
                      </div>
                    )}

                    {active && (
                      <motion.div 
                        layoutId="sidebar-active-indicator"
                        className="absolute left-1 h-5 w-1 rounded-full bg-sky-500"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-semibold tracking-normal rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-[100] whitespace-nowrap shadow-xl">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
