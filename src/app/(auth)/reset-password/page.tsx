import Link from "next/link";

import { updatePassword } from "@/features/auth/actions";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type SearchParams = Promise<{ error?: string }>;

export default async function ResetPasswordPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Use at least 8 characters. You will be redirected to login after updating.
        </p>

        {searchParams.error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {searchParams.error}
          </div>
        )}

        <form action={updatePassword} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">New password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm password</label>
            <input
              type="password"
              name="confirm_password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            />
          </div>

          <FormSubmitButton idleText="Update password" pendingText="Updating..." className="w-full" />
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Need another reset link?{" "}
          <Link href="/forgot-password" className="font-medium text-slate-900 hover:text-sky-700">
            Request again
          </Link>
        </p>
      </section>
    </main>
  );
}
