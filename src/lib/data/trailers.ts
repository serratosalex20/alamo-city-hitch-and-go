import type { Trailer } from "@/types/models";

/**
 * Static trailer fleet seeded for Sprint 3.3 — Pricing & Fleet Restructure.
 *
 * Previous seed (utility / car hauler / enclosed cargo) was a placeholder
 * scaffold. This is the real launch fleet:
 *
 *   - 24' Enclosed Trailer  — bookable
 *   - 20' Enclosed Trailer  — bookable
 *   - 14' Dump Trailer       — coming soon (status filter keeps it out
 *                              of the booking wizard, fleet page shows
 *                              it with the "Coming Soon" badge)
 *
 * Pricing is uniform-ish at launch ($140/day on all three) — owner can
 * widen the spread later if 24' demand outpaces 20'.
 *
 * Specs and images are flagged TODO(owner) — real specs + photography
 * arrive in the launch shoot. Replace the placeholder values + URLs
 * when assets land, then `git commit -m "data: real specs + photos"`.
 *
 * Replaced by Firestore reads once Sprint 4.0 ships persistence.
 */
export const trailers: Trailer[] = [
  // ─── 24' Enclosed Trailer ─────────────────────────────────
  {
    id: "trailer-001",
    name: "24' Enclosed Trailer",
    type: "enclosed",
    slug: "24-enclosed",
    description:
      "Maximum cargo protection for long hauls. Walls, ramp door, and full-length deck — move household goods, motorcycles, or equipment without exposure to weather.",
    // TODO(owner): replace with real photography from launch shoot
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9F4jtDJSPvB_viF6QVpEt1l9eCCFxSWf49RL3C9aD_SbOLgXimAwCR9I4tQGc80fENxPUXygJwz1Qu5Ssijps0Ii4rMwtXB8VWLKP1bPLhRSTLYqsHmDDj3tIDBv8iKHunWTsAxdiCObm1II7npg7y_HNJ2vu--OuvuhNfu3cDNtaKYejqYyjVN7mzIDCIkNJcWZVCtAUHG97Fl_lk_ez-LOqWZVADNB9t5i1vFF-R96C0MtWn1VtgrMh4ME9KVGlO1wqA2furYs",
    images: [],
    // TODO(owner): replace with verified specs from trailer paperwork
    specs: {
      gvwr: 7000,
      payload: 4500,
      hitchSize: '2-5/16" Ball Coupler',
      widthInches: 82,
      lengthFeet: 24,
      heightInches: 84,
    },
    pricing: {
      halfDay: 90,
      fullDay: 140,
      threeDays: 350,
      twoWeeks: 1200,
    },
    deposit: 300,
    badge: "Ready For Pickup",
    inventoryCount: 1,
    virtualBoost: 0,
    status: "available",
    createdAt: "2026-05-18T00:00:00Z",
    updatedAt: "2026-05-18T00:00:00Z",
  },

  // ─── 20' Enclosed Trailer ─────────────────────────────────
  {
    id: "trailer-002",
    name: "20' Enclosed Trailer",
    type: "enclosed",
    slug: "20-enclosed",
    description:
      "Right-sized enclosed hauler for studio moves, motorcycle transport, and equipment runs. Same all-weather protection as the 24', easier to maneuver in tight loading docks.",
    // TODO(owner): replace with real photography from launch shoot
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDfo9nhOaDaYsBp_abkf17qQgLzuRGTSVgPFx3xVGDtKKmdgYQBFSuFbjd4Pu3ij7sJd591YGbpxQxoAsDVQKJ1XPP6R--m69gM5_ntJSILh9kPcRWTlpq_DlJZMLh5OchpHDEee1MyXJzzSKQc6ckWRreXt_EUE16cxBQzZtmdTP9GwgvqHX0npaTi-S9ozgGGw-zq8vlJokPS88Cg_U7PYkioviWrZM6XZ_asvIGhgfcnhCyn8RY2gF-NOYQPuhvv11XbnHsxzM8",
    images: [],
    // TODO(owner): replace with verified specs from trailer paperwork
    specs: {
      gvwr: 6000,
      payload: 3800,
      hitchSize: '2-5/16" Ball Coupler',
      widthInches: 82,
      lengthFeet: 20,
      heightInches: 84,
    },
    pricing: {
      halfDay: 90,
      fullDay: 140,
      threeDays: 350,
      twoWeeks: 1200,
    },
    deposit: 300,
    badge: "Ready For Pickup",
    inventoryCount: 1,
    virtualBoost: 0,
    status: "available",
    createdAt: "2026-05-18T00:00:00Z",
    updatedAt: "2026-05-18T00:00:00Z",
  },

  // ─── 14' Dump Trailer (Coming Soon) ───────────────────────
  {
    id: "trailer-003",
    name: "14' Dump Trailer",
    type: "dump",
    slug: "14-dump",
    description:
      "Hydraulic-lift bed for landscaping debris, construction waste, dirt, gravel, or any load you'd rather tip than shovel. Coming soon to the yard.",
    // TODO(owner): replace with real dump-trailer photography from launch shoot
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiQKkmbChNoB93cacQlo6LlNM5BI8PztNYVovsDeDtr1d38rP0nUGJ9Jlz-cKGuTTBW6gfmt7wcYQWJ3KjiZjEXvquL5UqkYBkTxpH8Nk-bed8R3ZuiAStqOypLxVuJNUiDctSzd22sCF0aVKT1Bw5clnmZ6iQK95NkUtm2T9p7R2xPzMJYgMNKJYuf76oGoU_eSl9ttfxziU_juGwFi38DJe9TEcEa3C1dMJERDxLfgMfofAiDyM_HRb9MmwwnOae-ofvQERHlZk",
    images: [],
    // TODO(owner): confirm specs when the trailer is delivered
    specs: {
      gvwr: 9990,
      payload: 7000,
      hitchSize: '2-5/16" Ball Coupler',
      widthInches: 83,
      lengthFeet: 14,
    },
    pricing: {
      halfDay: 100,
      fullDay: 140,
      threeDays: 350,
      twoWeeks: 1200,
    },
    deposit: 200,
    badge: "Coming Soon",
    inventoryCount: 0,
    virtualBoost: 0,
    status: "coming_soon",
    createdAt: "2026-05-18T00:00:00Z",
    updatedAt: "2026-05-18T00:00:00Z",
  },
];

/**
 * Bookable subset of the fleet. The booking wizard's trailer-select step
 * should iterate this, not the full `trailers` array, so "coming_soon"
 * units don't appear as selectable options.
 */
export const bookableTrailers: Trailer[] = trailers.filter(
  (t) => t.status === "available" || t.status === "rented",
);
