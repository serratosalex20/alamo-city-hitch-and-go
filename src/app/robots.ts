/**
 * /robots.txt — Next 16 file convention.
 *
 * Audit 2026-05-15 fix: was 404 in production (no static robots.txt and no
 * file-based generator). Search engines couldn't discover the sitemap and
 * had no instructions on which paths to skip.
 *
 * Strategy: allow all crawlers by default, but explicitly exclude the auth
 * surfaces (`/api/*`, `/account/*`, `/sign-in/sent`) so they don't waste
 * crawl budget on URLs that either 401, redirect, or carry no organic value.
 */

import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // functions, not pages
          "/account/", // auth-gated, redirects unauth visitors
          "/sign-in/sent", // utility confirmation page, no organic value
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
