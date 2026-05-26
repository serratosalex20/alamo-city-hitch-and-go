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

## ACTIVE — Full Copy & SEO Audit (Hybrid Option 3)

**Phase 1 — Strategic findings:** ✅ SHIPPED 2026-05-21
**Phase 2 — Owner review:** ⏳ awaiting owner YES/NO/TWEAK per finding ID
**Phase 3 — Implementation:** queued — 15 small commits planned, will start once Phase 2 markup is back

Hybrid Option 3 from the 2026-05-20 review: quick wins shipped in
commit 28f050a (Starting at $90, 4h extension clarity, fleet-aligned
keywords). Phase 1 audit shipped 2026-05-21.

**Deliverable:** `deliverables/audits/copy-audit-2026-05-20.md` covering:
- SEO keyword map (current targets vs. recommended targets, with reasoning per keyword + re-map for the new enclosed+dump fleet)
- Page-by-page copy inventory across `/`, `/fleet`, `/book`, `/rates`, `/terms`, `/sign-in`, FAQ, Comparison, TrustBlock, PricingCallout, Hero, FeatureGrid, Footer — current copy, score (works / weak / wrong), proposed rewrite, reasoning
- Voice consistency check against the brand guide ("Industrial Architect" north star, "Pull & Go" tagline system, word bank usage)
- Metadata audit — every `<title>`, `description`, OG, JSON-LD field cross-checked against current fleet + offerings
- Local SEO signals — neighborhoods to target (Alamo Heights, Stone Oak, Helotes, Schertz, New Braunfels)
- Conversion-copy wins — A/B-worthy rewrites in CTAs, microcopy, error states
- AI/LLM-citability — semantic structure, FAQPage already in place, LocalBusiness already in place; what else gets us into "People Also Ask" boxes and AI Overviews

**Approach:** 3 phases — (1) strategic findings report, no code; (2) owner reviews + marks "yes/no/tweak" per item; (3) implementation in 5-10 commits with build verify after each.

---

## ACTIVE SPRINT — Sprint 3.4: Pricing Refactor + About + Videos + Audit Phase 3 (2026-05-22)

> Goal: ship the owner-approved pricing/block restructure, scaffold per-trailer instructional videos, add the /about page, and fold in the launch-blocker findings from the Phase 1 audit — all in one coherent sprint so the live site lands in a launch-ready state.

**Status:** ⏳ awaiting owner sign-off on this plan. No code starts until approved.

### Owner-locked decisions (2026-05-22 AskUserQuestion answers)

1. **Pricing matrix (Sprint 3.4 new):**
   | Trailer | Half Day | Full Day | 1 Week | 2 Weeks (15-day calendar) |
   |---|---|---|---|---|
   | 24' Enclosed | $100 | $150 | $900 | $1,800 |
   | 20' Enclosed | $90 | $140 | $850 | $1,680 |
   | 14' Dump | $100 | $150 | $900 | $1,800 |
2. **Refundable deposit:** $200 across all three trailers (was $300/$300/$200).
3. **Block rename:** `3 Days` → `1 Week`. TypeScript field rename `threeDays` → `oneWeek` throughout.
4. **2-week incentive:** 15-day calendar duration (1 free day vs. 14-day rental) at the new sticker prices above. `availability.ts` honors a 15-day hold for 2-week bookings.
5. **Extension semantics:** extensions match block sizes — Half Day / Full Day / 1 Week / 2 Weeks — instead of the current 4-hour micro-blocks. Customer mental model: "extend by one more block."
6. **Instructional videos:** scaffold "coming soon" placeholders now. Real assets land later.
7. **About page assets (owner photos, story copy):** scaffold with placeholders. Real assets land later.
8. **Audit Phase 3 (15 commits) folds into this sprint.** Audit Phase 1 shipped as a snapshot (commit `d57ec55`); launch-blockers + auto-approved findings get implemented here. Judgment-call findings (CV-*, AI-*, voice tweaks) await Phase 2 owner markup separately.

### Sub-sprints (commit-level breakdown)

#### 3.4a — Data layer + type rename (~3 commits)
- [ ] `src/types/models.ts` — rename `pricing.threeDays` → `pricing.oneWeek` in `Trailer` type. Update `RentalDuration` union: `"halfDay" | "fullDay" | "oneWeek" | "twoWeeks"`.
- [ ] `src/lib/data/trailers.ts` — replace all three trailer pricing blocks with the matrix above. Drop deposit from $300/$300/$200 to $200 across the board. Add new optional field `instructionalVideoUrl?: string` (default unset).
- [ ] `src/lib/booking/pricing.ts` — `ALL_DURATIONS` constant: `["halfDay", "fullDay", "oneWeek", "twoWeeks"]`. `DURATION_LABELS` map. `calculatePrice` signature unchanged.
- [ ] Build verify after each commit (`npm run build`).

#### 3.4b — Booking wizard updates (~2 commits)
- [ ] `src/components/booking/StepDateTime.tsx` — block radio options use new labels. The 2-week option shows "(15 days)" subtitle to surface the calendar-extension perk.
- [ ] `src/components/booking/StepReview.tsx` — summary line uses new block label.
- [ ] `src/lib/booking/availability.ts` — `twoWeeks` book honors 15 calendar days, not 14. Document the 1-day buffer in code comment.
- [ ] `src/app/book/page.tsx` — `initialFormData.duration` stays `"fullDay"` default. `BookingFormData.duration` type tracks new union.

#### 3.4c — Marketing surface refactor (~4 commits)
- [ ] `src/components/marketing/FAQ.tsx`:
  - FAQ #1: rewrite extension language — "Extensions are billed in the same block sizes — Half Day, Full Day, 1 Week, or 2 Weeks — so you extend by one block at a time, not micro-billable hours."
  - FAQ #4: update price floor — "Block rates start at $90 for a Half Day on our 20' enclosed trailer; $100 for the 24' enclosed and 14' dump."
  - Add the 6 new FAQ entries from audit CO-FAQ-04 (one-way, same-day, vehicle question, hours, enclosed-vs-dump, advance booking) — these were YES'd implicitly by the launch-blocker bundle.
- [ ] `src/components/marketing/PricingCallout.tsx` — `minRate` derivation still works ($90 still the floor); only the block-name copy needs update ("Half Day, Full Day, 1 Week, or 2 Weeks").
- [ ] `src/app/rates/page.tsx`:
  - Block-grid columns use new labels.
  - 2-week column shows "(15 days · 1 free day)" subtitle.
  - Per-trailer rows reflect new prices + new $200 deposit.
  - Add `<RatesFAQ>` block (audit PG-RATES-06) — 4 questions: tax inclusion, deposit mechanics, extension billing, late-fee structure.
  - Fine-print section: replace "3-Day" reference with "1-Week", update extension language to match new block-size semantics.
- [ ] `src/app/terms/page.tsx`:
  - Section 3 (Payment): "$100 cleaning fee" unchanged.
  - Section 4 (Refundable Deposit): swap "$300 on enclosed, $200 on dump" → "$200 across all trailers."
  - Section 6 (Extensions): rewrite to match new block-size extension semantics.

#### 3.4d — Metadata + JSON-LD refresh (~2 commits)
- [ ] `src/app/layout.tsx` — metadata description: replace "Half Day, Full Day, 3-Day, or 2-Week" with "Half Day, Full Day, 1 Week, or 2 Weeks."
- [ ] `src/app/page.tsx` — LocalBusiness JSON-LD description (audit SW-01 + PG-HOME-07 fix): "San Antonio trailer rentals. Industrial-grade enclosed cargo trailers and dump trailers, available in Half Day, Full Day, 1 Week, and 2 Weeks blocks." Add `areaServed` array (audit SW-17): `["San Antonio, TX", "Alamo Heights", "Stone Oak", "Helotes", "Schertz", "New Braunfels", "Boerne", "Cibolo", "Bexar County, TX"]`.
- [ ] `src/app/fleet/page.tsx` metadata description (audit SW-02): "Browse our San Antonio trailer fleet — enclosed cargo trailers (20' and 24') and dump trailers. Transparent block pricing. Same-day pickup."
- [ ] `src/app/book/layout.tsx` metadata description: realign to new fleet/blocks.
- [ ] `src/app/rates/page.tsx` metadata description: "Half Day / Full Day / 1 Week / 2 Weeks blocks."

#### 3.4e — Audit Phase 3 launch-blockers + auto-approved fixes (~5 commits)
These were marked launch-blockers or no-debate fixes in the Phase 1 audit. Folded in here.
- [ ] **SW-13 + PG-FLEET-02** — fix `/fleet` "OUR LOCATIONS" → "SEE RATES" linking `/rates`.
- [ ] **SW-03 + CO-HERO-06** — Hero image alt text: replace "utility trailer" reference with "enclosed trailer."
- [ ] **SW-08 + PG-HOME-02** — title template: `"%s | Alamo City Hitch & Go Co."` → `"%s — Alamo City Hitch & Go"`. Drop "Co." across interior titles.
- [ ] **SW-09 + PG-SIGNIN-01 + PG-ACCT-01** — add noindex metadata to `/sign-in`, `/sign-in/sent`, `/account`.
- [ ] **PG-ACCT-03** — `/account` dashboard mock data: replace `"10' Utility Trailer"` with `"24' Enclosed Trailer"` and a realistic unit ID.
- [ ] **CO-FOOT-02 + CO-FOOT-05 + SW-19** — Footer `<address>` semantics fix + visible hours line "Daily 6 AM – 10 PM" + SW-04 neighborhood-naming sentence.

#### 3.4f — Instructional video scaffolding (~2 commits)
- [ ] `src/types/models.ts` — `Trailer` interface gets `instructionalVideoUrl?: string` (already added in 3.4a) and `instructionalVideoPosterUrl?: string`.
- [ ] New component `src/components/marketing/TrailerVideoPanel.tsx` — renders either an embedded video player (if URLs set) or a "Video coming soon" placeholder with brand-styled icon + caption.
- [ ] Either embed in `TrailerCard` (compact thumbnail) OR scaffold per-trailer detail page `/fleet/[slug]` (closes audit PG-FLEET-07). **Decision: pick one based on owner preference — recommend the detail-page path since it also unlocks long-tail SEO. Default: detail-page if not specified.**
- [ ] Video provider: YouTube embed (simplest, free, owner uploads to their own YouTube), Vercel-hosted via Vercel Blob (control + branding), or self-host. **Default: YouTube embed** — zero infra cost, zero new env vars, owner controls the assets.

#### 3.4g — About page (~3 commits)
- [ ] New route `src/app/about/page.tsx`. Sections in order:
  1. Hero (Industrial Editorial style — Teko H1 + eyebrow + intro paragraph)
  2. The Owners — photo grid placeholder (2-up with "Photos coming soon" frames) + bio placeholders
  3. Our Story — short narrative ("San Antonio family business," origin paragraph)
  4. Mission — one paragraph
  5. Vision — one paragraph
  6. Who We Serve — 3-4 bullets (homeowners, contractors, movers, landscapers)
  7. CTA — "Book a trailer" → `/book`
- [ ] Metadata: `title: "About"`, page-specific description, canonical, OG.
- [ ] JSON-LD: `Organization` schema (logo, sameAs placeholders for social, founders array — actual Person schema slots in when bios are real).
- [ ] Add `/about` to Navbar nav links (Fleet / Rates / About / Terms or Fleet / Rates / Terms / About — owner pick).
- [ ] Add `/about` to Footer nav.
- [ ] Add `/about` to sitemap.ts at priority 0.5.

#### 3.4h — Legal doc + brand guide updates (~2 commits)
- [ ] `deliverables/rental-agreement/rental-agreement.html` — version bump v0.2 → v0.3:
  - §3.3 Rental Block: replace block list with "Half Day — 12h, Full Day — 24h, 1 Week — 7d, or 2 Weeks — 15d (includes 1 free day)."
  - §5 Deposit table: three rows now all $200.
  - §8 Extensions: rewrite to match new block-size extension semantics.
  - §9 Cleaning Fee: unchanged.
  - Title, header, cover-meta version + date.
- [ ] `deliverables/brand-guide/brand-guide.html` — version bump v1.0 → v1.1:
  - Page 6 (Typography sample) `"20ft Car Hauler — $85 / 4 hours"` → `"24' Enclosed Trailer — $150 / Full Day"`.
  - Page 9 (Photography) callout reworded so "must be swapped" reads as a hard launch-blocker, not a forward-looking note.
  - Page 11 (File Library) status check on `business-cards.pdf` and `rental-agreement.pdf` (now v0.3).

#### 3.4i — Audit doc reconciliation (~1 commit)
- [ ] `deliverables/audits/copy-audit-2026-05-20.md` — append a "Phase 3 Implementation Log" section noting which findings were shipped in Sprint 3.4 (with commit refs), which were superseded by the pricing refactor (PG-HOME-03 metadata description gets new text in 3.4d, etc.), and which are still pending owner markup. Audit doc itself stays the dated snapshot — the log is additive.

### Estimated total commits

**~24 commits.** Commit-on-write per project convention. Estimated 2-3 working sessions end-to-end.

### Pending owner markup (does NOT block Sprint 3.4)

These judgment-call audit findings still need YES/NO/TWEAK before Phase 3 closes 100%. Sprint 3.4 ships the launch-blockers; these ship in a follow-up if YES'd:

- **CO-HERO-02** — Hero H1 "TOP-RATED" wording (rewrite vs. wait for real reviews)
- **CO-HERO-05** — Hero 5-star trust-badge cleanup (drop until real reviews exist)
- **PG-FLEET-03** — `/fleet` H1 rewrite for SEO
- **CV-01..CV-08** — Conversion-copy A/B candidates
- **AI-02** — speakable / HowTo / Vehicle / Article / llms.txt schema adds
- **MD-02 / PG-HOME-05** — OG image (`opengraph-image.tsx`) — requires owner sign-off on visual direction
- **MD-03** — favicon / apple-icon — derives from `logo.png`, low-risk YES

### Open questions for owner sign-off

1. **Video placement** — Per-trailer detail page (`/fleet/24-enclosed`, etc.) OR compact thumbnail inside `TrailerCard`? Recommend detail page (unlocks long-tail SEO per audit PG-FLEET-07). **Default if no answer: detail page.**
2. **Video host** — YouTube embed (zero infra) vs. Vercel Blob (more control). Recommend YouTube. **Default if no answer: YouTube.**
3. **Navbar slot for /about** — replace "Terms" or add as 4th item? Recommend 4th item: Fleet / Rates / About / Terms.
4. **Sprint 3.4 commit-cadence** — ship sub-sprints 3.4a–3.4i in order with build verify after each (~24 commits), OR bundle into fewer larger commits (~8-10)? Recommend the granular cadence — easier rollback, clearer history.

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
