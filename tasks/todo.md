# Alamo City Hitch & Go Co — Build Plan

**Started:** 2026-04-08
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Firebase (Auth, Firestore, Storage) + Stripe (Auth/Capture) + DocuSign + Google Gemini Vision
**Design system:** Industrial Editorial (from Google Stitch mockups at `C:\Users\serra\Documents\WEB DESIGN\ALAMO CITY HITCH & GO CO\Page Design\`)

## Critical decisions (resolved in main thread)

- **Design system winner:** Industrial Editorial (from HTML mockups) beats the research brief's "Alamo Premium" palette. User explicitly said "use this exact styling as the baseline."
- **Scope:** Full SaaS-grade rental management app as specified in latest prompt — overrides the simpler "marketing site" recommendation in `research/03-build-brief.md`.
- **MVP cutline:** External integrations (Stripe live keys, DocuSign envelopes, Gemini Vision API) will be stubbed with clean adapter interfaces and env-gated mocks. Real keys can be swapped in without rewriting callers.

## Open decisions (need user input during build)

1. **Rental pricing algebra** — how do 4h / 12h / 24h / 36h blocks relate? Flat per-block rates, or prorated from a day rate? (Contribution point 1)
2. **Booking conflict window** — what's the buffer between returns and next pickup? 30 min? 2 hours? (Contribution point 2)
3. **Security deposit** — fixed ($300?) or variable by trailer class?
4. **ID verification tolerance** — how strict should the name-match between driver's license and Stripe card be? Exact match? Fuzzy (Levenshtein distance)?

---

## Phase 0 — Scaffolding & Foundation

- [ ] Verify Node.js + npm available on this machine
- [ ] Initialize Next.js 15 app (App Router, TypeScript, Tailwind, ESLint) — non-interactive
- [ ] Install dependencies: `firebase`, `firebase-admin`, `stripe`, `@stripe/stripe-js`, `docusign-esign`, `@google/generative-ai`, `date-fns`, `zod`, `lucide-react`
- [ ] Create `.env.local.example` with all required env keys (Firebase, Stripe, DocuSign, Gemini) — real `.env.local` gitignored
- [ ] Create folder structure: `src/app`, `src/components`, `src/lib`, `src/types`, `src/hooks`

## Phase 1 — Design System Extraction

- [ ] Extract color tokens from Landing Page `code.html` → `tailwind.config.ts`
- [ ] Wire Space Grotesk + Manrope via `next/font/google`
- [ ] Create `src/app/globals.css` with CSS custom properties + the "no-line rule" utilities
- [ ] Build shared primitives: `Button`, `Input`, `Card`, `Chip`, `Stepper`, `ProgressBar`, `GlassPanel`

## Phase 2 — Data Layer

- [ ] `src/lib/firebase/client.ts` — client-side Firebase init (browser)
- [ ] `src/lib/firebase/admin.ts` — server-side Firebase Admin init (API routes only)
- [ ] `src/types/models.ts` — `User`, `Trailer`, `Booking`, `Extension`, `Transaction`, `Document` interfaces with Stripe/DocuSign foreign keys
- [ ] `src/lib/firestore/schema.md` — collection layout + example documents
- [ ] Seed script `scripts/seed-trailers.ts` — writes 3 sample trailers from the Trailer Selection mockup (10' Utility / 20' Car Hauler / Enclosed Cargo)

## Phase 3 — Landing Page

- [ ] `src/app/page.tsx` — port the Landing Page mockup as a real React component tree
- [ ] `src/app/layout.tsx` — root layout with font loading + nav shell + footer
- [ ] `src/components/marketing/Hero.tsx`
- [ ] `src/components/marketing/FeatureGrid.tsx` (Rapid Pickup / Pro-Inspected / 24-7 Support)
- [ ] `src/components/marketing/TrailerPreview.tsx` — pulls top 3 trailers from Firestore

## Phase 4 — Trailer Selection + Booking Wizard

- [ ] `src/app/fleet/page.tsx` — grid of all trailers (reads Firestore)
- [ ] `src/app/book/page.tsx` — multi-step wizard container
- [ ] `src/components/booking/StepTrailer.tsx` — trailer select
- [ ] `src/components/booking/StepDateTime.tsx` — date/time picker for 4/12/24/36h blocks with conflict check
- [ ] `src/components/booking/StepCustomer.tsx` — name/email/phone/address + dynamic "How did you hear about us?" with conditional inputs
- [ ] `src/components/booking/StepReview.tsx` — summary + price
- [ ] `src/lib/booking/pricing.ts` — **USER CONTRIBUTION POINT #1: pricing function**
- [ ] `src/lib/booking/availability.ts` — conflict detection — **USER CONTRIBUTION POINT #2: buffer policy**
- [ ] `src/app/api/bookings/route.ts` — POST handler that creates a booking (server-side validation with Zod)

## Phase 5 — Authentication

- [ ] Firebase Auth with email link (magic link) — no passwords, lower friction
- [ ] `src/app/account/page.tsx` — protected route
- [ ] `src/lib/auth/session.ts` — server-side session cookie handling
- [ ] `middleware.ts` — redirect unauth'd requests on `/account/*` and `/admin/*`

## Phase 6 — Payments (Stripe Auth/Capture)

- [ ] `src/lib/stripe/client.ts` — server-side Stripe client
- [ ] `src/app/api/checkout/route.ts` — creates a PaymentIntent with `capture_method: 'manual'` for the deposit + immediate charge for rental fee
- [ ] `src/components/booking/StepPayment.tsx` — Stripe Elements card form
- [ ] `src/app/api/webhooks/stripe/route.ts` — webhook handler for `payment_intent.succeeded` etc.
- [ ] Stub mode: if `STRIPE_SECRET_KEY` is unset, return a fake PaymentIntent so the flow works end-to-end in dev

## Phase 7 — E-Signatures (DocuSign)

- [ ] `src/lib/docusign/client.ts` — JWT-authenticated DocuSign client
- [ ] `src/lib/docusign/templates.ts` — rental agreement template mapping (tabs → customer fields)
- [ ] `src/app/api/docusign/create-envelope/route.ts` — creates envelope from template with pre-filled data
- [ ] `src/app/booking/[id]/sign/page.tsx` — embedded signing ceremony page
- [ ] Stub mode: if DocuSign env is unset, simulate successful signing

## Phase 8 — AI Document Verification

- [ ] `src/app/booking/[id]/verify/page.tsx` — upload ID + proof of address
- [ ] `src/lib/ai/verify-id.ts` — Gemini Vision prompt: extract name, DOB, address from DL image
- [ ] `src/lib/ai/verify-address.ts` — Gemini Vision prompt: extract address from utility bill
- [ ] `src/lib/ai/match.ts` — fuzzy name-match between DL / Stripe card / booking
- [ ] `src/app/api/verify/route.ts` — runs all three checks, stores results
- [ ] Stub mode: if Gemini API key unset, auto-approve

## Phase 9 — Customer Dashboard

- [ ] `src/app/account/page.tsx` — port the Customer Dashboard mockup
- [ ] `src/components/dashboard/ActiveRental.tsx` — live progress bar from booking end time
- [ ] `src/components/dashboard/ExtendRental.tsx` — button → calls `/api/bookings/[id]/extend` → captures new Stripe charge
- [ ] `src/components/dashboard/Documents.tsx` — list of downloadable docs from Firebase Storage
- [ ] `src/components/dashboard/BottomNav.tsx` — fleet / rentals / support / account

## Phase 10 — Admin Dashboard

- [ ] `src/app/admin/layout.tsx` — admin-only layout, checks `user.role === 'admin'`
- [ ] `src/app/admin/page.tsx` — overview: active rentals, revenue today, pending verifications
- [ ] `src/app/admin/bookings/page.tsx` — all bookings table with filters
- [ ] `src/app/admin/bookings/[id]/page.tsx` — booking detail: customer info, documents, inspection photo upload, "Release Deposit" button
- [ ] `src/app/admin/trailers/page.tsx` — CRUD trailers, bump inventory count
- [ ] `src/app/admin/calendar/page.tsx` — calendar view to block maintenance dates
- [ ] `src/app/api/admin/release-deposit/route.ts` — calls `stripe.paymentIntents.cancel()` on the authorized-but-uncaptured deposit

## Phase 11 — Polish & Production

- [ ] SEO metadata on every page (`generateMetadata`)
- [ ] `sitemap.ts` + `robots.ts`
- [ ] Open Graph images
- [ ] LocalBusiness JSON-LD schema on homepage
- [ ] Accessibility pass (keyboard nav, aria labels, `prefers-reduced-motion`)
- [ ] Firestore security rules (`firestore.rules`)
- [ ] Firebase Storage security rules (`storage.rules`)
- [ ] Deployment config for Vercel (`vercel.json`) + env var checklist

---

## MVP Cutline (what to build first vs. defer)

**Must ship first (Sprint 1):**
- Phase 0, 1, 2, 3, 4 (landing + booking wizard with mocked payment)
- Phase 9 (customer dashboard read-only)

**Sprint 2:**
- Phase 5 (auth)
- Phase 6 (Stripe real)

**Sprint 3:**
- Phase 7 (DocuSign)
- Phase 8 (AI verify)
- Phase 10 (admin)
- Phase 11 (production polish)

This keeps Sprint 1 shippable as a lead-capture site with a booking form that just stores leads to Firestore — already beats every local competitor.
