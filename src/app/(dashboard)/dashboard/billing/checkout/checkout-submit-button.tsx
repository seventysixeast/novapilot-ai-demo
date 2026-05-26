"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type CheckoutSubmitButtonProps = {
  provider: string;
  helperText: string;
  disabled?: boolean;
};

export function CheckoutSubmitButton({
  provider,
  helperText,
  disabled = false,
}: CheckoutSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      disabled={isDisabled}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting to {provider}...
        </>
      ) : (
        <>
          Continue with {provider}
          <span className="text-xs font-medium text-slate-300">- {helperText}</span>
        </>
      )}
    </button>
  );
}
