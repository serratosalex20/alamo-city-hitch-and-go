# Alamo City Hitch & Go Co — Build Plan

**Started:** 2026-04-08
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Firebase (Auth, Firestore, Storage) + Stripe (Auth/Capture) + DocuSign + Google Gemini Vision
**Design system:** Industrial Editorial — source of truth `src/app/globals.css`

## Critical decisions (resolved)

- **Design system winner:** Industrial Editorial (from HTML mockups).
- **Scope:** Full SaaS-grade rental management app — not a marketing site.
- **MVP cutline:** External integrations stub via env-gated adapter interfaces. Real keys swap in without rewriting callers.
- **Stub-mode policy (Sprint 2):** Build Phase 5 + Phase 6 in **stub mode by default**. If `STRIPE_SECRET_KEY` is unset, `/api/checkout` returns a fake `PaymentIntent` so the booking flow works end-to-end. If Firebase Admin env vars are unset, magic-link "sending" logs to console and the email link is exposed in the dev-mode response for testing.
- **Brand assets:** v1.0 brand guide + DRAFT rental agreement live in `deliverables/` (committed 2026-05-14).

## Open decisions (still owed by owner)

1. **Pricing algebra** — 4h / 12h / 24h / 36h block relationship. Placeholder values land in `src/lib/booking/pricing.ts` with `// TODO(owner)` markers; owner edits one file when prices set.
2. **Security deposits per class** — owner confirmed *per-class*, awaiting dollar amounts.
3. **Booking conflict buffer** — default 30 min, configurable in `src/lib/booking/availability.ts`.
4. **ID verification tolerance** (Phase 8) — exact match vs. fuzzy.

---

## ACTIVE SPRINT — Sprint 2: Auth + Stripe (2026-05-14)

> Goal: turn the visual booking wizard into a real transaction flow. Sprint 1 shipped a render-only site; Sprint 2 makes it accept money and create user accounts.

### A0 — Dependencies
- [ ] `npm install firebase firebase-admin stripe @stripe/stripe-js @stripe/react-stripe-js`

### A1 — Adapter scaffolding (env-gated stub/real switch)
- [ ] `src/lib/env.ts` — typed env reader, exports `hasFirebase`, `hasStripe`, `appUrl`
- [ ] `src/lib/firebase/client.ts` — client-side Firebase app init (returns null in stub mode)
- [ ] `src/lib/firebase/admin.ts` — server-side Firebase Admin init (singleton, stub-mode aware)
- [ ] `src/lib/stripe/server.ts` — server-side Stripe client (stub-mode aware)

### A2 — Phase 5: Magic-link auth
- [ ] `src/lib/auth/session.ts` — server cookie helpers (set/clear/verify session cookie)
- [ ] `src/app/api/auth/send-link/route.ts` — POST email → sends Firebase sign-in link (or logs in stub mode)
- [ ] `src/app/api/auth/callback/route.ts` — GET handles magic-link return, mints session cookie
- [ ] `src/app/api/auth/logout/route.ts` — POST clears session cookie
- [ ] `src/app/sign-in/page.tsx` — email input form (Industrial Editorial styled)
- [ ] `src/app/sign-in/sent/page.tsx` — "check your email" confirmation page
- [ ] `middleware.ts` — protect `/account/*` and `/admin/*`; redirect unauth'd to `/sign-in`
- [ ] Wire Navbar "Sign in" link in `src/components/marketing/Navbar.tsx`

### A3 — Phase 6: Stripe auth/capture
- [ ] `src/lib/booking/pricing.ts` — `calculatePrice(trailerId, block) → { rentalCents, depositCents, taxCents, totalCents }` with placeholder constants
- [ ] `src/app/api/checkout/route.ts` — POST creates 2 PaymentIntents: rental (immediate capture) + deposit (`capture_method: 'manual'`)
- [ ] `src/components/booking/StepPayment.tsx` — Stripe Elements card form, calls /api/checkout, confirms with stripe.js
- [ ] Insert StepPayment into wizard flow in `src/app/book/page.tsx` (between Customer and Review)
- [ ] `src/app/api/webhooks/stripe/route.ts` — verify signature, handle `payment_intent.succeeded`, `payment_intent.canceled`
- [ ] `src/lib/booking/availability.ts` — 30-min default buffer, exported `MIN_BUFFER_MIN` constant

### A4 — Verification
- [ ] `npm run build` passes cleanly
- [ ] Manually walk the booking flow end-to-end in stub mode (no real keys)
- [ ] Magic-link in stub mode logs the link to console; clicking it lands on /account with a session
- [ ] Stripe stub mode returns a fake PaymentIntent id; UI shows success
- [ ] Commit-on-write: each lib/component/route gets its own commit

### A5 — Deferred (Sprint 3+)
- DocuSign (Phase 7), Gemini ID verification (Phase 8), Admin dashboard (Phase 10), Production polish (Phase 11)

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
