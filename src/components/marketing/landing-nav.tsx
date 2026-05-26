"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";

const links = [
  { label: "Product", href: "#product" },
  { label: "Trust", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo href="/" size="sm" />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={isAuthenticated ? "/dashboard" : "/signup"}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {isAuthenticated ? "Go to Dashboard" : "Start free"}
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-md border border-slate-300 p-2 md:hidden"
          onClick={() => setOpen((previous) => !previous)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="space-y-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="mt-2 block rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start free"}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
