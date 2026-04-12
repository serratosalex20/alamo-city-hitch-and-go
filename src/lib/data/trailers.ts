import type { Trailer } from "@/types/models";

/**
 * Static trailer data seeded from the Trailer Selection mockup.
 * This will be replaced by Firestore reads once Firebase is wired up.
 */
export const trailers: Trailer[] = [
  {
    id: "trailer-001",
    name: "10' Utility Trailer",
    type: "utility",
    slug: "10-utility",
    description:
      "Haul furniture, landscaping debris, or a full ATV load. The workhorse trailer that handles anything you throw on it.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiQKkmbChNoB93cacQlo6LlNM5BI8PztNYVovsDeDtr1d38rP0nUGJ9Jlz-cKGuTTBW6gfmt7wcYQWJ3KjiZjEXvquL5UqkYBkTxpH8Nk-bed8R3ZuiAStqOypLxVuJNUiDctSzd22sCF0aVKT1Bw5clnmZ6iQK95NkUtm2T9p7R2xPzMJYgMNKJYuf76oGoU_eSl9ttfxziU_juGwFi38DJe9TEcEa3C1dMJERDxLfgMfofAiDyM_HRb9MmwwnOae-ofvQERHlZk",
    images: [],
    specs: {
      gvwr: 2990,
      payload: 2200,
      hitchSize: '2" Ball Coupler',
      widthInches: 60,
      lengthFeet: 10,
    },
    pricing: { rate4h: 25, rate12h: 35, rate24h: 45, rate36h: 60 },
    deposit: 200,
    badge: "Ready For Pickup",
    inventoryCount: 3,
    virtualBoost: 0,
    status: "available",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-08T00:00:00Z",
  },
  {
    id: "trailer-002",
    name: "20' Car Hauler",
    type: "car_hauler",
    slug: "20-car-hauler",
    description:
      "Move vehicles across town or across state lines. Tandem axles, slide-out ramps, commercial-grade steel construction.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDfo9nhOaDaYsBp_abkf17qQgLzuRGTSVgPFx3xVGDtKKmdgYQBFSuFbjd4Pu3ij7sJd591YGbpxQxoAsDVQKJ1XPP6R--m69gM5_ntJSILh9kPcRWTlpq_DlJZMLh5OchpHDEee1MyXJzzSKQc6ckWRreXt_EUE16cxBQzZtmdTP9GwgvqHX0npaTi-S9ozgGGw-zq8vlJokPS88Cg_U7PYkioviWrZM6XZ_asvIGhgfcnhCyn8RY2gF-NOYQPuhvv11XbnHsxzM8",
    images: [],
    specs: {
      gvwr: 7000,
      payload: 5200,
      hitchSize: '2-5/16" Ball Coupler',
      widthInches: 82,
      lengthFeet: 20,
    },
    pricing: { rate4h: 45, rate12h: 65, rate24h: 85, rate36h: 115 },
    deposit: 350,
    badge: "Commercial Grade",
    inventoryCount: 2,
    virtualBoost: 0,
    status: "available",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-08T00:00:00Z",
  },
  {
    id: "trailer-003",
    name: "Enclosed Cargo",
    type: "enclosed",
    slug: "enclosed-cargo",
    description:
      "Weather-proof hauling for furniture, equipment, or trade show gear. Double rear doors, interior tie-down points, lockable.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDm0sEEnip9a-UKiJOqahzrG7fuZACtgE5LXp5qQwtTmQ_3xX5pj2zTbyjZifHhmEiZRyz7W1Zmk-LdlwkAX9J--QlQs5vsWiJ0hZo6Ng3x8T9SyUTOwtmMS5dynJst4CwY1pKMgOP8nTGgIT389a36BhhK7vVUuOKmq42zZ_EMdJ7Lo2URAylTX4TRuiFasIPlEbnDpkCDsGG2HXmEcrhNsMUM7HLn_awu-DUVBy4uKUp-Xo15d_v4bVjIF7Qe4T6H0GvlS1qu92I",
    images: [],
    specs: {
      gvwr: 3500,
      payload: 2500,
      hitchSize: '2" Ball Coupler',
      widthInches: 72,
      lengthFeet: 12,
      heightInches: 78,
    },
    pricing: { rate4h: 35, rate12h: 50, rate24h: 65, rate36h: 90 },
    deposit: 250,
    badge: "Weather Proof",
    inventoryCount: 2,
    virtualBoost: 0,
    status: "available",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-08T00:00:00Z",
  },
];
