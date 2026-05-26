"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast-system";

export function FeedbackToaster() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { addToast } = useToast();
  const lastSignature = useRef("");

  useEffect(() => {
    const message = searchParams.get("message");
    const error = searchParams.get("error");
    const warning = searchParams.get("warning");
    const signature = `${pathname}|${message ?? ""}|${error ?? ""}|${warning ?? ""}`;

    if (signature === lastSignature.current) {
      return;
    }
    lastSignature.current = signature;

    if (message) {
      addToast({ type: "success", title: "Action completed", description: message });
    }
    if (error) {
      addToast({ type: "error", title: "Action failed", description: error });
    }
    if (warning) {
      addToast({ type: "warning", title: "Attention needed", description: warning });
    }
  }, [addToast, pathname, searchParams]);

  return null;
}
