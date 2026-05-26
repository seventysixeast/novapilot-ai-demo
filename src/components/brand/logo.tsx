"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Brand tokens ────────────────────────────────────────────
export const BRAND_COLORS = {
  primary: "#38BDF8",      // sky-400
  secondary: "#818CF8",    // indigo-400
  accent: "#A78BFA",       // violet-400
  live: "#34D399",         // emerald-400
  dark: "#0F172A",         // slate-900
  darkMid: "#1E293B",      // slate-800
};

// ── Icon Mark (standalone SVG) ───────────────────────────────
export function LogoMark({
  size = 32,
  variant = "default",
  className,
}: {
  size?: number;
  variant?: "default" | "light" | "mono";
  className?: string;
}) {
  const id = `np-${size}-${variant}`;

  const markColor =
    variant === "mono"
      ? "currentColor"
      : `url(#${id}-mark)`;

  const bgColor =
    variant === "light"
      ? "rgba(255,255,255,0.12)"
      : `url(#${id}-bg)`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NovaPilot AI"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id={`${id}-mark`} x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`${id}-dot`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {/* Container */}
      <rect width="80" height="80" rx="18" fill={bgColor} />
      {variant !== "mono" && (
        <rect x="0.75" y="0.75" width="78.5" height="78.5" rx="17.25" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />
      )}

      {/* Signal arcs */}
      <path d="M54 17 C63 22 68 30 68 40" stroke={variant === "mono" ? "currentColor" : "#38BDF8"} strokeWidth="3" strokeLinecap="round" fill="none" opacity={variant === "mono" ? 0.35 : 0.4} />
      <path d="M54 25 C61 29 64 34 64 40" stroke={variant === "mono" ? "currentColor" : "#38BDF8"} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity={variant === "mono" ? 0.6 : 0.65} />

      {/* N mark */}
      <path d="M14 62V18H25L52 49V18H66V62H55L28 31V62H14Z" fill={markColor} />

      {/* Live dot */}
      {variant !== "mono" && (
        <>
          <circle cx="66" cy="40" r="4" fill={`url(#${id}-dot)`} />
          <circle cx="66" cy="40" r="7" fill={`url(#${id}-dot)`} opacity="0.2" />
        </>
      )}
    </svg>
  );
}

// ── Full Wordmark Logo ───────────────────────────────────────
export function Logo({
  size = "md",
  variant = "default",
  href,
  className,
  showIcon = true,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "light" | "mono";
  href?: string;
  className?: string;
  showIcon?: boolean;
}) {
  const sizes = {
    xs: { icon: 22, text: "text-sm", ai: "text-sm" },
    sm: { icon: 28, text: "text-base", ai: "text-base" },
    md: { icon: 34, text: "text-lg", ai: "text-lg" },
    lg: { icon: 44, text: "text-2xl", ai: "text-2xl" },
  };

  const s = sizes[size];

  const textColor = variant === "light" ? "text-white" : "text-slate-900";
  const aiColor = "text-sky-500";

  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      {showIcon && <LogoMark size={s.icon} variant={variant} />}
      <span className={cn("font-bold tracking-tight leading-none", textColor, s.text)}>
        NovaPilot
        <span className={cn(aiColor, s.ai)}> AI</span>
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

// ── Animated loading mark ────────────────────────────────────
export function LogoLoading({ size = 40 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <LogoMark size={size} />
      {/* Rotating ring */}
      <svg
        className="absolute inset-0 animate-spin"
        width={size}
        height={size}
        viewBox="0 0 80 80"
        style={{ animationDuration: "1.8s" }}
      >
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="url(#spin-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 170"
        />
        <defs>
          <linearGradient id="spin-grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Brand pill ───────────────────────────────────────────────
export function BrandPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
      NovaPilot AI
    </span>
  );
}
