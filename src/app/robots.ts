import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/methodology"],
      disallow: ["/account", "/analysis", "/engine-map", "/input", "/login", "/forgot-password", "/reset-password", "/scenario", "/signup", "/workspace"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
