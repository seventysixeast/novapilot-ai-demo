"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { PremiumButton } from "@/components/ui/premium-button";

type FormSubmitButtonProps = {
  idleText: string;
  pendingText?: string;
  className?: string;
  icon?: React.ReactNode;
};

export function FormSubmitButton({
  idleText,
  pendingText = "Processing...",
  className,
  icon,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <PremiumButton
      type="submit"
      disabled={pending}
      loading={pending}
      icon={pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      className={className}
    >
      {pending ? pendingText : idleText}
    </PremiumButton>
  );
}
