import Link from "next/link";

import { requestPasswordReset } from "@/features/auth/actions";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type SearchParams = Promise<{ error?: string }>;

export default async function ForgotPasswordPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your account email and we will send a secure reset link.
        </p>

        {searchParams.error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {searchParams.error}
          </div>
        )}

        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@company.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            />
          </div>

          <FormSubmitButton idleText="Send reset link" pendingText="Sending..." className="w-full" />
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-slate-900 hover:text-sky-700">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
