"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";

export function MouseGlow({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 140, damping: 30 });
  const smoothY = useSpring(y, { stiffness: 140, damping: 30 });
  const background = useMotionTemplate`radial-gradient(320px circle at ${smoothX}px ${smoothY}px, rgba(56,189,248,0.16), rgba(124,58,237,0.08) 40%, transparent 70%)`;

  return (
    <div
      className="relative"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background }}
      />
      {children}
    </div>
  );
}
