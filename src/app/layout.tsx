import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { FeedbackToaster } from "@/components/ui/feedback-toaster";
import { ToastProvider } from "@/components/ui/toast-system";
import { brand } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} | Precision Growth Intelligence for Teams`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  keywords: brand.keywords,
  openGraph: {
    title: `${brand.name} | Precision Growth Intelligence for Teams`,
    description: brand.description,
    type: "website",
    url: brand.url,
    siteName: brand.name,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${brand.name} Intelligence Deck` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} | Precision Growth Intelligence for Teams`,
    description: brand.description,
    images: ["/twitter-image"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-mark.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/logo-mark.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#eef2ff_30%,_#f8fafc_65%)] text-slate-900">
        <ToastProvider>
          <Suspense fallback={null}>
            <FeedbackToaster />
          </Suspense>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
