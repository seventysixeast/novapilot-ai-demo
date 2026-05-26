"use client";

import { useEffect } from "react";

import { PremiumButton } from "@/components/ui/premium-button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="card max-w-lg p-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Unexpected error</h1>
          <p className="mt-2 text-sm text-slate-600">
            Something failed unexpectedly. The issue has been logged for investigation.
          </p>
          <PremiumButton className="mt-5" onClick={reset}>
            Try again
          </PremiumButton>
        </div>
      </body>
    </html>
  );
}
