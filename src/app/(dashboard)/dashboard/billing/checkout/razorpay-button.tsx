"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayButton({ planCode, planName, interval = "monthly" }: { planCode: string; planName: string; interval?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Create order on server
      const response = await fetch("/api/billing/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, interval }),
      });

      const order = await response.json();

      if (!response.ok || order.error) {
        throw new Error(order.error || order.details || "Order creation failed");
      }

      // 2. Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "NovaPilot AI",
          description: `${planName} Subscription`,
          order_id: order.id,
          handler: function (response: any) {
            // This is called after successful payment
            router.push(`/dashboard/billing?status=syncing&payment_id=${response.razorpay_payment_id}&plan=${planCode}`);
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          theme: {
            color: "#0f172a", // Slate 900
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [{ method: "upi" }],
                },
              },
              sequence: ["block.upi", "block.default"],
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      };
    } catch (error) {
      console.error("Razorpay error:", error);
      alert("Something went wrong with Razorpay. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Zap className="h-4 w-4 text-amber-400" />
      )}
      Pay with UPI / Cards
    </button>
  );
}
