import type { Trailer } from "@/types/models";

/**
 * Static trailer fleet — Sprint 3.5 Fleet Reality Sync (2026-07-25).
 *
 * This file now reflects the REAL yard, per owner-supplied specs,
 * VIN decode, and photos:
 *
 *   - 8.5' × 20' Enclosed — 2026 Giddy Up (GUUM), VIN 7TKBE2021TN016423.
 *     NHTSA-decoded: 20 ft box, tandem axle, ball-pull, Giddy Up USA Mfg
 *     LLC (Nicholls, GA). Charcoal blackout package, rear ramp door,
 *     side man-door. BOOKABLE.
 *   - 6.5' × 12' Utility — Big Tex 60PI-12 (spec match: 6,000 GVWR /
 *     4,735 lb payload / 4' spring-assist ramp gate / 2" ball). BOOKABLE.
 *   - 14' Dump — NOT OWNED YET. status "coming_soon" keeps it out of
 *     `bookableTrailers` (and therefore out of the booking wizard) while
 *     the fleet page shows it with the "Coming Soon" badge.
 *
 * The former "24' Enclosed" listing was removed 2026-07-25 per owner:
 * "remove the 24' that we do not own." (The May "24 foot" reference was
 * this same GUUM trailer measured bumper-to-coupler; the box is 20 ft.)
 *
 * Block pricing:
 *
 *   |                 | Half Day | Full Day | 1 Week | 2 Weeks (15 days) |
 *   | 8.5×20 Enclosed | $90      | $140     | $850   | $1,680            |
 *   | 6.5×12 Utility  | $50*     | $75*     | $450*  | $900*             |
 *   | 14' Dump        | $100     | $150     | $900   | $1,800            |
 *
 *   *TODO(owner): utility pricing is a market-fair PLACEHOLDER (San
 *    Antonio utility class runs $50–$100/day). Owner deferred the
 *    decision 2026-07-25 ("we can worry about pricing later") — edit
 *    the four numbers on the utility entry below when decided.
 *
 * Refundable deposit: $200 across the fleet. 2-week block is calendar-
 * extended to 15 days via DURATION_HOURS.twoWeeks = 360 in pricing.ts.
 *
 * Photos: local files under public/fleet/ (owner-supplied, ChatGPT-
 * cleaned). Expected filenames:
 *   /fleet/20-enclosed-side.png   (charcoal side profile)
 *   /fleet/20-enclosed-ramp.png   (rear ramp door open)
 *   /fleet/12-utility-front.png   (Big Tex front quarter)
 *   /fleet/12-utility-rear.png    (Big Tex rear quarter, ramp up)
 *
 * TODO(owner) — verify from the data plates next time at the yard:
 *   - GUUM GVWR: 7,000 (2×3.5K axles) vs 9,990 (2×5.2K). 7,000 is the
 *     conservative base-config assumption used below.
 *   - Big Tex model: stated specs match the 60PI-12 exactly, but the
 *     ChatGPT-sourced photo shows a 70PI badge (7,000 GVWR series).
 *     If the plate says 70PI, update gvwr to 7000 / payload to ~5,545.
 *
 * Replaced by Firestore reads once Sprint 4.0 ships persistence.
 */
export const trailers: Trailer[] = [
  // ─── 8.5' × 20' Enclosed — 2026 Giddy Up (GUUM) ───────────
  {
    id: "trailer-002",
    name: "8.5' × 20' Enclosed Trailer",
    type: "enclosed",
    slug: "20-enclosed",
    description:
      "2026 Giddy Up 8.5×20 enclosed cargo trailer in charcoal blackout. Full weather protection for household moves, motorcycles, tools, and equipment — rear ramp door with spring assist, side entry door, interior LED lighting, and plywood-lined walls ready for tie-downs.",
    imageUrl: "/fleet/20-enclosed-side.png",
    images: ["/fleet/20-enclosed-ramp.png"],
    // TODO(owner): confirm GVWR + interior height from the data plate by
    // the side door. 7,000 (2×3,500 axles) is the conservative base
    // config for this model; if the plate says 9,990 (2×5,200), update
    // gvwr + payload accordingly.
    specs: {
      gvwr: 7000,
      payload: 4000,
      hitchSize: '2-5/16" Ball Coupler',
      widthInches: 102,
      lengthFeet: 20,
      heightInches: 84,
    },
    pricing: {
      halfDay: 90,
      fullDay: 140,
      oneWeek: 850,
      twoWeeks: 1680,
    },
    deposit: 200,
    badge: "Ready For Pickup",
    inventoryCount: 1,
    virtualBoost: 0,
    status: "available",
    createdAt: "2026-05-18T00:00:00Z",
    updatedAt: "2026-07-25T00:00:00Z",
  },

  // ─── 6.5' × 12' Utility — Big Tex 60PI-12 ─────────────────
  {
    id: "trailer-004",
    name: "6.5' × 12' Utility Trailer",
    type: "utility",
    slug: "12-utility",
    description:
      "Big Tex pipe-top tandem-axle utility trailer. Open deck with treated pine floor, 4-foot spring-assisted mesh ramp gate, and self-adjusting brakes — built for mulch and gravel runs, appliance pickups, ATV hauls, and dump-site trips.",
    imageUrl: "/fleet/12-utility-front.png",
    images: ["/fleet/12-utility-rear.png"],
    // Specs verified against Big Tex 60PI-12 dealer listings 2026-07-25.
    // TODO(owner): confirm the model plate (60PI vs 70PI) — if 70PI,
    // gvwr is 7,000 and payload ~5,545.
    specs: {
      gvwr: 6000,
      payload: 4735,
      hitchSize: '2" Ball Coupler',
      widthInches: 77,
      lengthFeet: 12,
    },
    // TODO(owner): PLACEHOLDER pricing — owner deferred 2026-07-25
    // ("we can worry about pricing later"). Market-fair for the class
    // (SA utility runs $50–$100/day). Edit these four numbers when set.
    pricing: {
      halfDay: 50,
      fullDay: 75,
      oneWeek: 450,
      twoWeeks: 900,
    },
    deposit: 200,
    badge: "Ready For Pickup",
    inventoryCount: 1,
    virtualBoost: 0,
    status: "available",
    createdAt: "2026-07-25T00:00:00Z",
    updatedAt: "2026-07-25T00:00:00Z",
  },

  // ─── 14' Dump Trailer (Coming Soon — not owned yet) ───────
  {
    id: "trailer-003",
    name: "14' Dump Trailer",
    type: "dump",
    slug: "14-dump",
    description:
      "Hydraulic-lift bed for landscaping debris, construction waste, dirt, gravel, or any load you'd rather tip than shovel. Coming soon to the yard.",
    // TODO(owner): replace with real dump-trailer photography when the
    // trailer is delivered
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
      fullDay: 150,
      oneWeek: 900,
      twoWeeks: 1800,
    },
    deposit: 200,
    badge: "Coming Soon",
    inventoryCount: 0,
    virtualBoost: 0,
    status: "coming_soon",
    createdAt: "2026-05-18T00:00:00Z",
    updatedAt: "2026-07-25T00:00:00Z",
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
