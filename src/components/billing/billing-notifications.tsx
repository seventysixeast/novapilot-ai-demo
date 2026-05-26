"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-system";

export function BillingNotifications() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const notified = useRef(false);

  useEffect(() => {
    const success = searchParams.get("success");
    
    if (success === "true" && !notified.current) {
      addToast({
        title: "Subscription active",
        description: "Your plan has been updated successfully. Welcome to the Growth plan!",
        type: "success",
      });
      notified.current = true;
    }
  }, [searchParams, addToast]);

  return null;
}
