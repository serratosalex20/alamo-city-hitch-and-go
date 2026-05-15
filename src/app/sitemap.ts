/**
 * /sitemap.xml — Next 16 file convention.
 *
 * Audit 2026-05-15 fix: was 404 in production. Search engines had no
 * structured page-discovery aid, slowing initial indexing of every page
 * beyond the homepage.
 *
 * Priority hierarchy:
 *   - 1.0 - root (homepage, primary entry point)
 *   - 0.9 - /book (the conversion path; second-most important URL)
 *   - 0.8 - /fleet (browse to book funnel)
 *   - 0.6 - /rates (informational, supports /book)
 *   - 0.3 - /terms (informational, low organic intent)
 *
 * Skipped intentionally:
 *   - /account/* - auth-gated; no organic value
 *   - /api/*     - Vercel Functions, not pages
 *   - /sign-in/* - utility, low intent
 */

import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${appUrl}/`,      lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${appUrl}/book`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${appUrl}/fleet`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${appUrl}/rates`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/terms`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
