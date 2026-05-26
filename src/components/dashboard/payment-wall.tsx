"use client";

import { AlertCircle, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PaymentWall({ hasActiveSubscription }: { hasActiveSubscription: boolean }) {
  const pathname = usePathname();

  // Don't show the wall on the billing pages itself, otherwise user can't pay!
  if (hasActiveSubscription || pathname?.startsWith("/dashboard/billing")) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <article className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-br from-sky-600 to-violet-700 p-6 text-center text-white">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight">Workspace locked</h2>
          <p className="mt-2 text-sm text-sky-100 font-medium opacity-90">
            Provision your workspace to unlock professional-grade growth signals.
          </p>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-sky-100 p-1">
                <Sparkles className="h-3 w-3 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">14-day trial</p>
                <p className="text-xs text-slate-500">Try the full product with secure card verification.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-amber-100 p-1">
                <AlertCircle className="h-3 w-3 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Answers and insights</p>
                <p className="text-xs text-slate-500">Your workspace is ready to unlock after upgrade.</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link 
              href="/dashboard/billing" 
              className="block w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Go to billing
            </Link>
            <p className="mt-3 text-center text-[10px] text-slate-400 font-medium">
              Secure access • Billing required
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
