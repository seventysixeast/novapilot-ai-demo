"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "gradient" | "soft" | "ghost";

const variants: Record<Variant, string> = {
  gradient:
    "bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)]",
  soft: "border border-slate-300 bg-white text-slate-700 shadow-sm",
  ghost: "bg-transparent text-slate-700",
};

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  loading?: boolean;
  variant?: Variant;
}

export function PremiumButton({
  children,
  className,
  icon,
  loading,
  variant = "gradient",
  disabled,
  ...props
}: PremiumButtonProps) {
  return (
    <motion.div
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="inline-flex"
    >
      <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        className,
      )}
      disabled={loading || disabled}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span className="relative">{children}</span>
      </button>
    </motion.div>
  );
}
