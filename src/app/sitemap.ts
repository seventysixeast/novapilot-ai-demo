import type { MetadataRoute } from "next";

import { brand } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/login",
    "/signup",
    "/dashboard",
    "/dashboard/chat",
    "/dashboard/documents",
    "/dashboard/search",
    "/dashboard/analytics",
    "/dashboard/billing",
    "/dashboard/admin",
    "/dashboard/settings",
    "/privacy",
    "/terms",
    "/security",
    "/status",
    "/contact",
    "/changelog",
    "/docs",
  ];

  return routes.map((route) => ({
    url: `${brand.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith("/dashboard") ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
