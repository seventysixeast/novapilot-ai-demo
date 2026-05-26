import type { MetadataRoute } from "next";

import { brand } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: "NovaPilot",
    description: brand.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#38BDF8",
    icons: [
      {
        src: "/logo-mark.svg",
        sizes: "256x256",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo-mark.svg",
        sizes: "256x256",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
