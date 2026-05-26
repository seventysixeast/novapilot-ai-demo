import Link from "next/link";
import { UserPlus, Shield, Lock, Zap } from "lucide-react";

import { AuthVisual } from "@/components/auth/auth-visual";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Logo } from "@/components/brand/logo";
import { loginWithGoogle, signup } from "@/features/auth/actions";

type SearchParams = Promise<{ error?: string }>;

export default async function SignupPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  return (
    <main className="flex min-h-screen w-full bg-white">
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/5 blur-[80px]" />

        <div className="relative mx-auto w-full max-w-sm">
          <div className="mb-10">
            <Logo href="/" size="md" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your workspace</h1>
            <p className="mt-2 text-slate-500">
              Launch a private AI workspace for documents, analytics, and trusted answers.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              "Enterprise-grade security",
              "14-day trial",
              "Automated data synthesis",
            ].map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
              >
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 shrink-0" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {badge}
              </span>
            ))}
          </div>

          {searchParams.error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500">
                <span className="text-[9px] font-bold text-white">!</span>
              </div>
              <p className="text-sm text-red-700">{searchParams.error}</p>
            </div>
          )}

          <form action={loginWithGoogle}>
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">or use email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form action={signup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full name</label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                type="text"
                name="full_name"
                placeholder="Alex Johnson"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Work email</label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                type="email"
                name="email"
                placeholder="name@company.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                type="password"
                name="password"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i <= 1 ? "bg-slate-200" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400">Use mixed case, numbers, and a symbol for a stronger password.</p>
            </div>
            <FormSubmitButton
              idleText="Create Workspace"
              pendingText="Creating workspace..."
              className="w-full"
              icon={<UserPlus className="h-4 w-4" />}
            />
            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              By creating a workspace, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-slate-600">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-slate-900 transition-colors hover:text-sky-700">
              Sign in
            </Link>
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-6">
            {[
              { icon: Shield, text: "Encrypted sessions" },
              { icon: Lock, text: "Private workspace" },
              { icon: Zap, text: "Instant access" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-slate-400">
                <Icon className="h-3.5 w-3.5" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2">
        <AuthVisual />
      </div>
    </main>
  );
}
