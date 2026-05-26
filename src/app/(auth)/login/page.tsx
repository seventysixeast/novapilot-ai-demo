import Link from "next/link";
import { ArrowRight, Lock, Shield, Zap } from "lucide-react";

import { AuthVisual } from "@/components/auth/auth-visual";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Logo } from "@/components/brand/logo";
import { loginWithGoogle, loginWithPassword } from "@/features/auth/actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  return (
    <main className="flex min-h-screen w-full bg-[#fdfdfe] selection:bg-sky-100">
      <div className="relative flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
          <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-sky-200/20 blur-[120px]" />
          <div className="absolute top-[60%] left-[60%] h-[30%] w-[30%] rounded-full bg-indigo-200/20 blur-[100px]" />
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="mb-12">
            <Logo href="/" size="md" />
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-[1.1]">Sign in</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
              Access your workspace, continue AI sessions, and review trusted knowledge from one secure account.
            </p>
          </div>

          {searchParams.error && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              <p className="text-sm font-bold tracking-tight text-red-800">{searchParams.error}</p>
            </div>
          )}

          {searchParams.message && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <p className="text-sm font-bold tracking-tight text-emerald-800">{searchParams.message}</p>
            </div>
          )}

          <div className="space-y-4">
            <form action={loginWithGoogle}>
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              <span className="bg-[#fdfdfe] px-4">or use email</span>
            </div>
          </div>

          <form action={loginWithPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
              <input
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                type="email"
                name="email"
                placeholder="name@company.ai"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                <Link href="/forgot-password" id="forgot-password" className="text-[10px] font-black uppercase tracking-widest text-sky-600 transition-colors hover:text-sky-500">
                  Recover
                </Link>
              </div>
              <input
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                type="password"
                name="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <FormSubmitButton
              idleText="Enter Workspace"
              pendingText="Signing in..."
              className="w-full rounded-2xl bg-slate-900 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99]"
              icon={<ArrowRight className="h-4 w-4" />}
            />
          </form>

          <div className="mt-12 text-center space-y-6">
            <p className="text-sm text-slate-500">
              New to NovaPilot?{" "}
              <Link href="/signup" className="border-b-2 border-transparent pb-1 font-bold text-slate-900 transition-all hover:border-sky-100 hover:text-sky-600">
                Create workspace
              </Link>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 opacity-40">
              {[
                { icon: Shield, text: "AES-256" },
                { icon: Lock, text: "Private Node" },
                { icon: Zap, text: "TLS 1.3" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-slate-900">
                  <Icon className="h-3 w-3" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
            If sign in fails while the workspace is syncing, try again in a moment or use magic link access.
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-1/2">
        <AuthVisual />
        <div className="absolute bottom-12 left-12 right-12 z-20">
          <div className="glass rounded-[2.5rem] border-white/5 p-8 backdrop-blur-3xl">
            <p className="mb-4 text-lg font-bold leading-relaxed text-white">
              The synthesis velocity of NovaPilot has completely recalibrated our strategic deployment cycles.
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500" />
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-white">Marcus Chen</p>
                <p className="text-[10px] font-bold text-white/40">Director of Intelligence, Quantum Systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
