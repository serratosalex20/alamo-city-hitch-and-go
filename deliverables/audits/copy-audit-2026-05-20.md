# Copy & SEO Audit — Phase 1 Findings Report

**Project:** Alamo City Hitch & Go Co
**Audit date:** 2026-05-21
**Audit ID in todo.md:** "Full Copy & SEO Audit (next session, 2026-05-20)" — Hybrid Option 3
**Status:** Phase 1 of 3 — **Strategic findings, no code yet**
**Auditor:** Claude (Opus 4.7, 1M context) with `marketing-skills:seo-audit` methodology
**Source inventory:** All pages, layouts, marketing components, brand guide v1.0, trailer seed data, sitemap/robots
**Reviewer:** Owner — mark each item **YES / NO / TWEAK** below

---

## How to read this document

1. Every finding has a **stable ID** (e.g. `SW-03`, `PG-HOME-04`, `KW-12`). When you respond, you can shorthand: *"kill PG-FLEET-02, ship SW-03, tweak KW-08 to lean harder on construction."*
2. Findings are scored:
   - 🟢 **WORKS** — keep as-is, included only for context
   - 🟡 **WEAK** — functional but leaving leverage on the table
   - 🔴 **WRONG** — actively hurting SEO, brand voice, or both — fix before launch
   - 🆕 **GAP** — something missing entirely
3. Phase 2 (next): you mark up the doc. Phase 3: I implement the YES'd changes in 5-10 commits with build verify after each.

## What this audit covers (and doesn't)

**Covers:** every user-visible string + every SEO config currently committed in `master` as of e9d2c17. Voice consistency vs. the v1.0 brand guide. Metadata, JSON-LD, sitemap, robots. Local-SEO surface. Conversion-copy moments. AI/LLM citability structure.

**Does NOT cover:** quantitative ranking data (no Search Console access yet — Phase 11 enables it), keyword volume estimates (no Ahrefs/Semrush — judgments below are based on observed competitor patterns + search-intent reasoning), or live Core Web Vitals (Lighthouse runs after photography swap).

---

## Executive Summary

### 🔴 Three launch-blockers

| # | Finding | Why it matters |
|---|---------|---------------|
| **SW-01** | LocalBusiness JSON-LD on homepage still describes "utility trailers, car haulers, and enclosed cargo trailers" | Google reads this as the authoritative business description. Advertising inventory you don't have is both an SEO miss and a customer-trust risk. |
| **SW-02** | `/fleet` and `/book` metadata descriptions also reference the old fleet | Same staleness as SW-01, but it shows up as the SERP snippet. |
| **PG-FLEET-02** | Fleet hero "OUR LOCATIONS" CTA links to `/locations`, which is a dead route | The single most prominent secondary CTA on the fleet page produces a 404. |

### 🟢 What's already excellent — keep doing this

- FAQ component (`src/components/marketing/FAQ.tsx`) uses **actual customer-search phrasing** as questions ("How much does a trailer rental cost in San Antonio?" not "Pricing information"). This is gold for People-Also-Ask placements and AI Overviews. Don't dilute this pattern.
- Comparison component reframes the "vs U-Haul" narrative as "The Big-Box Counter vs Our Yard" — sidesteps trademark/comparative-advertising risk while preserving the persuasion. The decision is explicitly defended in the file header — that's a strong reference pattern for future copy choices.
- TrustBlock owns the "we're new" honest-positioning play instead of fabricating reviews. The earlier audit fix (cafbd7d) removed a fake aggregateRating — the replacement here keeps the brand defensible.
- Sitemap, robots, FAQPage JSON-LD, LocalBusiness JSON-LD all present and correctly wired. The 2026-05-15 audit fixes did the technical-SEO heavy lifting; this audit is mostly copy + voice.
- Voice consistency is **high** in the homepage components — the brand guide's "foreman, not salesman" rule is followed across Hero, TrustBlock, Comparison, PricingCallout, FAQ.

### 🆕 The highest-ROI gaps

1. **Local SEO at zero.** Site says "San Antonio" but zero neighborhood-level signals (Alamo Heights, Stone Oak, Helotes, Schertz, New Braunfels). The local search query *"trailer rental near me"* is dominated by businesses that name their service area.
2. **No OG/Twitter image asset shipped.** Every social share + AI snippet renders without a card image. Brand guide says hero images are placeholders that must be swapped before launch — that swap also unlocks shippable OG art.
3. **Hero photography is still placeholder URLs** (Google `aida-public` CDN) per the brand guide's own admission. Counts against E-E-A-T (no original visual evidence of the business) and is a launch blocker per the guide.
4. **Title-tag pattern is verbose.** Every page appends `| Alamo City Hitch & Go Co.` — SERPs already show the brand name. The interior page titles burn ~25 chars on duplication.

---

## 1. SEO Keyword Map — Current vs. Recommended

### KW-01 — Current keyword targeting (extracted from `src/app/layout.tsx:45-54`)

```
trailer rental san antonio
trailer rental san antonio tx
enclosed trailer rental san antonio
dump trailer rental san antonio
moving trailer rental san antonio
construction trailer rental san antonio
san antonio trailer rentals near me
trailer rental near me same day
```

**Score: 🟡 WEAK** — Right intent, narrow surface area. All 8 keywords are head-term variants. Missing the long-tail intent layer where most clicks actually come from.

### KW-02 — Recommended primary cluster (head terms — keep these)

| Target keyword | Currently in copy? | Map to page |
|---|---|---|
| trailer rental san antonio | ✅ in metadata, ✅ in homepage H1 (implicit) | `/` |
| enclosed trailer rental san antonio | ✅ metadata only | `/fleet`, `/rates` |
| dump trailer rental san antonio | ✅ metadata only | `/fleet`, `/rates` |
| trailer rental near me (san antonio) | ✅ metadata only | `/` |

### KW-03 — Recommended secondary cluster (intent-rich, currently UNUSED)

These are the question-form and modifier queries that AI Overviews + People-Also-Ask answer. **Each should appear at least once in body copy or FAQ**:

| Target keyword | Why it matters | Suggested home |
|---|---|---|
| how much does it cost to rent a trailer in san antonio | High-intent commercial query — FAQ already has the answer (FAQ #4), but doesn't include "in san antonio" in the answer itself | FAQ.tsx Q4 rewrite |
| 24 foot enclosed trailer rental | Specific size queries convert higher than generic | `/fleet` H2 or trailer card alt text |
| 20 foot enclosed trailer rental | Same | Same |
| 14 foot dump trailer rental | Same | Same |
| trailer rental for moving san antonio | "Moving" use case is in metadata but never in copy | New FAQ entry + Hero microcopy |
| trailer rental for construction san antonio | Same gap | Same |
| half day trailer rental san antonio | Differentiator vs national chains (none offer half-day) | PricingCallout subhead |
| 2 week trailer rental san antonio | Same — long-block pricing is a USP | `/rates` headline strip |
| weekend trailer rental san antonio | Massive search volume; "Full Day + 3-Day" covers this but the word "weekend" doesn't appear anywhere | FAQ or `/rates` |
| same day trailer rental san antonio | In metadata only, never in copy | Hero secondary CTA or FeatureGrid |
| trailer rental open sundays san antonio | Hours are in JSON-LD (6am–10pm Sun) but never visible | Footer or FAQ |
| no deposit trailer rental | High-intent counter-claim — we DO take a hold, so frame as "refundable deposit" preemptively | Already done in PricingCallout ✅ |
| u-haul alternative san antonio | "Alternative" is the keyword pattern for this intent — Comparison component is positioned for this without saying the name | Comparison eyebrow or H2 microcopy |

### KW-04 — Recommended local/neighborhood cluster (CURRENTLY ZERO)

San Antonio is geographically large and queries like *"trailer rental stone oak"* or *"trailer rental new braunfels"* are uncontested if you're the only local result. Without a `/locations/[area]` programmatic-SEO page (Phase 11+), the lowest-cost play is to **name the service area inside body copy on the homepage and `/fleet`**:

| Neighborhood / suburb | Why this one | Suggested copy placement |
|---|---|---|
| Alamo Heights | Affluent, lots of remodel/landscaping rentals | "We serve customers from Alamo Heights to…" sentence in TrustBlock or Footer NAP |
| Stone Oak | High-growth area, high household-mover volume | Same |
| Helotes | Truck/towing-friendly demographic | Same |
| Schertz | Just outside city limits, big landscaping market | Same |
| New Braunfels | Outside metro but inside reasonable tow radius | Same |
| Boerne | Same | Same |
| Cibolo | Same | Same |
| Bexar County | Already in JSON-LD via tax mention — good ✅ | — |

**Recommendation: SW-04.** Add a single sentence to Footer or TrustBlock: *"Pickup and return at our San Antonio yard. We serve customers from Alamo Heights, Stone Oak, Helotes, Schertz, New Braunfels, Boerne, and across Bexar County."* This is the lowest-friction win for local SEO — zero new pages, immediate keyword surface.

### KW-05 — Keyword cannibalization risk

🟢 **None detected.** Pages have distinct intents — `/` (brand + funnel), `/fleet` (browse), `/rates` (pricing), `/terms` (legal), `/book` (transact). Nothing competing for the same head term.

### KW-06 — Question-form keywords already in FAQ (✅ DO NOT BREAK)

These FAQ questions are SEO assets — they match how people actually search. Preserve verbatim phrasing on any rewrite:

- "How long can I rent a trailer?"
- "Do I need insurance to rent a trailer?"
- "Is the security deposit charged to my card?"
- "How much does a trailer rental cost in San Antonio?" ← strongest one
- "What if I'm late returning the trailer?"
- "Is there a cleaning fee?"
- "Can I take the trailer outside of Texas?"
- "What do I need to bring to pick up the trailer?"
- "What kind of tow vehicle do I need?"
- "Do you deliver the trailer to me?"

### KW-07 — Recommended NEW FAQ entries (additive)

| New question | Search intent it captures |
|---|---|
| "What's the difference between an enclosed trailer and a dump trailer?" | Research-phase commercial intent (someone deciding what they need) |
| "Can I rent a trailer for a one-way move?" | Captures U-Haul-defector intent — answer is currently "no" (we're round-trip) — say so plainly |
| "Do you do same-day trailer rentals?" | High commercial intent, answer is yes if available |
| "How far in advance should I book a trailer?" | Anxiety-resolution; lowers booking friction |
| "Can I tow your 24' enclosed with a half-ton pickup?" | Specific-vehicle query, very high intent, currently answered only generically |
| "What hours can I pick up or return the trailer?" | Hours are in JSON-LD but never visible on the site |

---

## 2. Page-by-Page Copy Audit

Each finding has: **current quote → score → proposed rewrite → reasoning**.

---

### `/` — Homepage

#### Metadata (`src/app/layout.tsx:34-91`)

**PG-HOME-01 — Title default**
- **Current:** `"Alamo City Hitch & Go Co. | San Antonio's Top-Rated Trailer Rentals"`
- **Score:** 🟡 WEAK — 67 chars (Google truncates ~60). "Top-rated" with zero reviews is also an unsupported claim per the same E-E-A-T logic that killed the fake aggregateRating in the audit-2026-05-15 fix.
- **Proposed:** `"Trailer Rental San Antonio — Enclosed & Dump | Alamo City Hitch & Go"`
- **Reasoning:** Leads with the head keyword (search-aligned), names the actual fleet (enclosed + dump = our two real categories), drops the unsubstantiated "top-rated" claim, ends with brand. 58 chars — fits the SERP.

**PG-HOME-02 — Title template**
- **Current:** `"%s | Alamo City Hitch & Go Co."`
- **Score:** 🟡 WEAK — Every interior page burns ~25 chars on the brand suffix. Google already prepends the brand to the visible result.
- **Proposed:** `"%s — Alamo City Hitch & Go"` (drop "Co.", swap pipe for em-dash for readability)
- **Reasoning:** "Co." duplicates info. Em-dash reads as editorial, on-brand for the Industrial Editorial system. Saves 4 chars per interior title.

**PG-HOME-03 — Meta description**
- **Current:** `"Heavy-duty trailer rentals in San Antonio, TX. Industrial-grade enclosed and dump trailers in Half Day, Full Day, 3-Day, or 2-Week blocks. Same-day pickup. Pull & Go."`
- **Score:** 🟢 WORKS — 165 chars (right at the edge). Names the real fleet. Includes the tagline. Mentions block structure (USP). Same-day pickup hook.
- **Proposed:** Leave as-is, OR shorten to `"Heavy-duty enclosed and dump trailer rentals in San Antonio. Half Day, Full Day, 3-Day, or 2-Week blocks. Same-day pickup. Pull & Go."` (134 chars) for safety against truncation.
- **Reasoning:** Current works; trim is defensive.

**PG-HOME-04 — Keywords array**
- **Current:** 8 keywords, well-targeted.
- **Score:** 🟢 WORKS — Google ignores `meta keywords` but Bing + AI crawlers still parse it; harmless and correctly aligned post-Sprint 3.3.
- **Proposed:** Add `"trailer rental near me bexar county"`, `"weekend trailer rental san antonio"`, `"u-haul alternative san antonio"`.

**PG-HOME-05 — OG image**
- **Current:** 🆕 GAP — `openGraph.images` is not set anywhere.
- **Score:** 🔴 WRONG (launch-blocker) — every social share renders the default browser preview (random screenshot or nothing). Same for AI search snippets that pull OG images.
- **Proposed:** Create `src/app/opengraph-image.tsx` (Next 16 file convention) generating a 1200×630 image from the brand system: Ink background, Alamo Crimson rule, Teko 132pt headline `"PULL & GO."`, Oswald eyebrow `"SAN ANTONIO TRAILER RENTALS"`, logo bottom-left. Brand guide page 9 specifies the visual language — this is direct execution of that spec.
- **Reasoning:** OG images appear on Facebook, LinkedIn, Slack, iMessage, X, and increasingly in AI search results (Perplexity especially). Zero-cost, high-visibility brand surface.

**PG-HOME-06 — Robots tag**
- **Current:** `index: true, follow: true` with sane googleBot defaults.
- **Score:** 🟢 WORKS.

#### JSON-LD (`src/app/page.tsx:24-51`)

**PG-HOME-07 — LocalBusiness `description`**
- **Current:** `"San Antonio's top-rated trailer rentals. Industrial-grade utility trailers, car haulers, and enclosed cargo trailers."`
- **Score:** 🔴 WRONG (launch-blocker — same root cause as SW-01)
- **Proposed:** `"San Antonio trailer rentals. Industrial-grade enclosed cargo trailers and dump trailers, available in Half Day, Full Day, 3-Day, and 2-Week blocks."`
- **Reasoning:** Aligns with actual fleet (Sprint 3.3 ship). Drops unsupported "top-rated" claim. Adds the block-structure differentiator that Google reads as a service descriptor.

**PG-HOME-08 — Missing JSON-LD fields**
- 🆕 GAP — `priceRange: "$$"` is good but generic. Once GBP is live, add: `telephone`, `streetAddress`, `image`, `sameAs` (Google Business, Facebook, Instagram), `aggregateRating` (only when real reviews land), `areaServed: ["San Antonio, TX", "Bexar County, TX", "Stone Oak", "Alamo Heights", ...]`.
- **Score:** 🟡 WEAK now, 🔴 once GBP is live.
- **Proposed (immediate):** Add `"areaServed"` as a string array with the neighborhood list from KW-04. Add `"image": [appUrl + "/opengraph-image"]` once PG-HOME-05 ships.

#### Body copy (homepage component composition)

Each homepage component is audited in its own section below (Hero, PricingCallout, FeatureGrid, Comparison, TrustBlock, FAQ, Footer).

---

### `/fleet`

**PG-FLEET-01 — Metadata description**
- **Current:** `"Browse our fleet of industrial-grade utility trailers, car haulers, and enclosed cargo trailers. Transparent pricing. Same-day pickup in San Antonio."`
- **Score:** 🔴 WRONG (launch-blocker — same as SW-01)
- **Proposed:** `"Browse our San Antonio trailer fleet — enclosed cargo trailers (20' and 24') and dump trailers. Transparent block pricing. Same-day pickup."`
- **Reasoning:** Same fleet realignment + leads with the location.

**PG-FLEET-02 — Hero CTA broken link** 🔴
- **Current:** `<a href="/locations">OUR LOCATIONS</a>` at `src/app/fleet/page.tsx:65-71`
- **Score:** 🔴 WRONG (launch-blocker — produces 404)
- **Proposed (pick one):**
  - (a) Replace href with `/rates` and label `"SEE RATES"` (funnels to the conversion-adjacent page)
  - (b) Replace href with `/#faq` (anchor to homepage FAQ) and label `"GOT QUESTIONS?"`
  - (c) Remove the secondary CTA entirely — single CTA pages convert higher
- **Recommendation:** (a). The fleet page → rates page is the natural research-phase flow. The single-CTA argument is real but `/fleet` is already a browse page so two CTAs aren't redundant.

**PG-FLEET-03 — Hero H1**
- **Current:** `"HEAVY DUTY. HASSLE FREE."` (split across two lines, second line stroked outline)
- **Score:** 🟡 WEAK — Beautiful typography (Teko 9xl, stroked second line) but **zero keyword density**. No "trailer," no "rental," no "San Antonio." Brand-wise it lives the "Industrial Architect" voice; SEO-wise it's a missed primary-page H1.
- **Proposed:** `"HEAVY-DUTY TRAILERS." / "BUILT FOR SAN ANTONIO."` (same two-line stroked treatment; second line carries the location keyword)
- **Reasoning:** Preserves the visual rhythm. Adds the two missing intent words. Word bank check: "Heavy-Duty" is explicitly in the brand word bank.

**PG-FLEET-04 — Hero eyebrow**
- **Current:** `"Industrial Precision Hauling"`
- **Score:** 🟢 WORKS — Three preferred-bank words in a row.

**PG-FLEET-05 — Hero subhead**
- **Current:** `"Industrial-grade trailer rentals engineered for San Antonio's toughest jobs. Whether it's a cross-state haul or a local site move, we provide the steel."`
- **Score:** 🟢 WORKS — Voice is on-brand. Contains "trailer rentals" + "San Antonio" — good SEO surface. "We provide the steel" is on-tone Industrial Architect language.

**PG-FLEET-06 — "Select Your Trailer" section**
- **Current H2:** `"SELECT YOUR TRAILER"`
- **Current subhead:** `"Meticulously maintained equipment for commercial and residential transport. Choose the rig that fits your cargo requirements."`
- **Score:** 🟡 WEAK — H2 is a UI label, not a keyword opportunity. Subhead is good but doesn't anchor location.
- **Proposed H2:** `"SAN ANTONIO TRAILER FLEET"` or `"OUR HEAVY-DUTY FLEET"`
- **Reasoning:** "Select Your Trailer" is what a button says, not what a section header on an SEO page should say. Section headers are H2s — Google weights them.

**PG-FLEET-07 — Missing per-trailer detail pages**
- 🆕 GAP — Each trailer is currently a `<TrailerCard>` only, no detail page. Long-tail SEO (`24 foot enclosed trailer rental san antonio`, `dump trailer rental for landscaping san antonio`) lives on detail pages.
- **Score:** 🟡 WEAK — Phase 4 has the schema; need a /fleet/[slug] page eventually.
- **Proposed:** Out of scope for this audit. Flag for the Sprint 4 backlog: `/fleet/24-enclosed`, `/fleet/20-enclosed`, `/fleet/14-dump` — each with Vehicle (or Product) JSON-LD, long-form spec content, and 5+ original photos.

---

### `/book`

**PG-BOOK-01 — Metadata title (book/layout.tsx:5)**
- **Current:** `"Book a Trailer | Alamo City Hitch & Go Co. — San Antonio TX"`
- **Score:** 🟡 WEAK — 60 chars exactly. With the new template (PG-HOME-02) plus `"Book"` it becomes redundant; right now the layout `title` is a hard-set string, not template-aware.
- **Proposed:** `"Book a Trailer Online"` (lets the template prepend `"Book a Trailer Online — Alamo City Hitch & Go"`)
- **Reasoning:** Matches the new title pattern from PG-HOME-02.

**PG-BOOK-02 — Metadata description**
- **Current:** `"Reserve your trailer online in minutes. Choose from utility trailers, car haulers, and enclosed cargo trailers. Same-day pickup available in San Antonio."`
- **Score:** 🔴 WRONG (launch-blocker — same as SW-01)
- **Proposed:** `"Reserve your San Antonio trailer rental online in minutes. Enclosed cargo trailers and dump trailers. Half Day to 2-Week blocks. Same-day pickup."`

**PG-BOOK-03 — Step indicator labels**
- **Current:** Trailer / Schedule / Details / Review / Payment
- **Score:** 🟢 WORKS.

**PG-BOOK-04 — Confirmation H2**
- **Current:** `"Booking Confirmed"`
- **Score:** 🟢 WORKS.

**PG-BOOK-05 — Confirmation body**
- **Current:** `"Your trailer is reserved. We sent a sign-in link to {email} so you can access your dashboard, sign the rental agreement, and upload your documents."`
- **Score:** 🟢 WORKS — Action-oriented, sets expectations.

**PG-BOOK-06 — Missing noindex on confirmation step**
- 🆕 GAP — The post-payment confirmation view shares the `/book` URL but should not be indexed (transactional confirmations are noise in search results).
- **Score:** 🟡 WEAK — Low priority since the `/book` page itself is intentionally indexable.
- **Proposed:** No structural change needed; the confirmation view is hidden behind state, so Google never sees it. **No-op.**

---

### `/rates`

**PG-RATES-01 — Metadata title**
- **Current:** `"Rates"` (template appends brand)
- **Score:** 🟡 WEAK — Misses the head keyword.
- **Proposed:** `"Trailer Rental Rates San Antonio"`
- **Reasoning:** Page IS the canonical pricing page; the title should match the actual query intent. Becomes `"Trailer Rental Rates San Antonio — Alamo City Hitch & Go"` (62 chars).

**PG-RATES-02 — Metadata description**
- **Current:** `"Transparent trailer rental pricing in San Antonio. Enclosed and dump trailers in Half Day / Full Day / 3 Days / 2 Weeks blocks. No hidden fees."`
- **Score:** 🟢 WORKS — accurate, keyword-aligned, well-positioned against "hidden fees" objection.

**PG-RATES-03 — H1**
- **Current:** `"Rates"`
- **Score:** 🟡 WEAK — Same as PG-RATES-01. Single word H1 is fine for design but burns the strongest on-page SEO surface.
- **Proposed:** `"Trailer Rental Rates"` (subhead does the location work) OR `"San Antonio Trailer Rental Rates"` (max SEO).
- **Recommendation:** Go with `"Trailer Rental Rates"` H1, keep current subhead. Visual rhythm of the page preserved (Teko 8xl), SEO improved.

**PG-RATES-04 — Subhead**
- **Current:** `"Pick a trailer, pick a block, see the total. No quote forms. No mileage surprises. The price you see is the price you pay, plus Texas sales tax on the rental fee and a refundable deposit hold."`
- **Score:** 🟢 WORKS — Punchy, sets the rules, addresses two of the biggest competitor objections (quote forms, mileage surprises).

**PG-RATES-05 — "What's Included" H2**
- **Current:** `"What's Included"`
- **Score:** 🟢 WORKS.

**PG-RATES-06 — Missing FAQ on /rates**
- 🆕 GAP — Pricing pages benefit from page-specific FAQs ("What does the deposit cover?", "How are extensions billed?", "Is tax included in the block price?"). Each is an AI-Overview citation opportunity.
- **Score:** 🟡 WEAK.
- **Proposed:** Add 4-5 FAQ entries to `/rates`, OR move the existing FAQ component there (it's currently homepage-only). Option B is cheaper.
- **Recommendation:** Keep FAQ on homepage; add a *pricing-specific* 4-question FAQ to `/rates` covering: tax, deposit mechanics, extension billing, late fee structure. Each question is an SEO surface.

---

### `/terms`

**PG-TERMS-01 — Metadata title**
- **Current:** `"Terms"` → `"Terms — Alamo City Hitch & Go"`
- **Score:** 🟡 WEAK — generic.
- **Proposed:** `"Trailer Rental Terms"` → `"Trailer Rental Terms — Alamo City Hitch & Go"`. Or skip — `/terms` is not a high-priority SEO page so it can stay generic without harm.
- **Recommendation:** Leave as-is. Low-priority page.

**PG-TERMS-02 — Metadata description**
- **Current:** `"Plain-language summary of Alamo City Hitch & Go Co's trailer rental terms — deposits, insurance, late returns, extensions, and governing law. Bexar County, Texas."`
- **Score:** 🟢 WORKS.

**PG-TERMS-03 — DRAFT notice**
- **Current:** `"Working Draft — Pending Texas Attorney Review"` aside
- **Score:** 🟢 WORKS — honest, on-brand, legally protective.

**PG-TERMS-04 — H1**
- **Current:** `"Terms"`
- **Score:** 🟡 WEAK but acceptable given low SEO priority.

**PG-TERMS-05 — Section copy**
- **Score:** 🟢 WORKS across all 11 sections — voice is plain-language professional, matches the "foreman not salesman" rule. The numbering convention (01, 02, …) is on-brand Industrial Editorial.

---

### `/sign-in` and `/sign-in/sent`

**PG-SIGNIN-01 — Metadata**
- 🆕 GAP — No `metadata` export on either page. Inherits root layout title `"Alamo City Hitch & Go Co. | San Antonio's Top-Rated Trailer Rentals"` — wildly wrong for a sign-in page.
- **Score:** 🟡 WEAK — Sign-in pages should not be indexed at all.
- **Proposed:** Add `export const metadata = { title: "Sign In", robots: { index: false, follow: true } }` to `/sign-in/page.tsx`, and `{ title: "Check your email", robots: { index: false, follow: false } }` to `/sign-in/sent/page.tsx`.
- **Reasoning:** robots.ts already excludes `/sign-in/sent` from crawl, but per-page `noindex` is belt-and-suspenders and covers the `/sign-in` root which is currently indexable. `/sign-in` indexed = brand SERP gets cluttered with a low-intent login page.

**PG-SIGNIN-02 — H1 + copy**
- **Current:** `"Sign In"` / `"No password. Enter your email and we'll send you a one-time sign-in link that's good for ten minutes."`
- **Score:** 🟢 WORKS — passwordless UX, brand voice intact.

**PG-SENT-01 — Body**
- **Current:** `"We sent a sign-in link to {email}. Click the link in that email within the next ten minutes to finish signing in."`
- **Score:** 🟢 WORKS.

---

### `/account` (signed-in only)

**PG-ACCT-01 — Metadata title**
- **Current:** `"Fleet Command | Alamo City Hitch & Go Co."`
- **Score:** 🟡 WEAK — should be noindex. Internal product name "Fleet Command" appearing in a SERP is a brand-coherence hit.
- **Proposed:** `{ title: "Account", robots: { index: false, follow: false } }`.

**PG-ACCT-02 — H1**
- **Current:** `"FLEET COMMAND"` / `"HAULER_COMMAND"` (top bar) / `"ALAMO CITY HITCH & GO CO."` (welcome eyebrow)
- **Score:** 🟢 WORKS for signed-in UX (internal product naming is allowed inside auth wall). The "HAULER_COMMAND" all-caps monospaced treatment is on-brand for the "Industrial Architect" voice — feels like a control surface.

**PG-ACCT-03 — Hardcoded mock data**
- **Current:** `<ActiveRental trailerName="10' Utility Trailer" unitId="#TX-48092-B" hoursRemaining={18} totalHours={24} />`
- **Score:** 🔴 WRONG — Sprint 3.3 removed utility trailers. The dashboard is showing fleet that doesn't exist. (Also: hardcoded mock data in a deployed page.)
- **Proposed:** Pre-Sprint 4 (when Firestore reads land), update the mock to `"24' Enclosed Trailer"` and a realistic unit ID. Post-Sprint 4, drive from real data.
- **Reasoning:** Not strictly an SEO finding but it's a brand-trust finding — a signed-in customer would notice the inconsistency.

---

## 3. Component-by-Component Copy Audit

---

### Navbar (`src/components/marketing/Navbar.tsx`)

**CO-NAV-01 — Wordmark**
- **Current:** `"Alamo City Hitch & Go"` (no "Co.", crimson `&`)
- **Score:** 🟢 WORKS — matches the brand guide wordmark spec, "Co." correctly dropped per the 2026-05-20 owner Q&A.

**CO-NAV-02 — Nav links**
- **Current:** Fleet / Rates / Terms / [Sign In | Account] / Rent Now (CTA)
- **Score:** 🟢 WORKS — Clear IA, Rent Now CTA in Alamo Crimson.

**CO-NAV-03 — Mobile menu accessibility**
- **Score:** 🟢 WORKS — Skip-to-content link in root layout, aria-expanded/controls/label on toggle, role=menu on the drawer.

---

### Hero (`src/components/marketing/Hero.tsx`)

**CO-HERO-01 — Eyebrow**
- **Current:** `"Industrial Grade Reliability"`
- **Score:** 🟢 WORKS — exactly the brand-guide secondary tagline (page 8 of the guide).

**CO-HERO-02 — H1**
- **Current:** `"SAN ANTONIO'S TOP-RATED TRAILER RENTALS"` (with crimson gradient on "TOP-RATED")
- **Score:** 🟡 WEAK — same "top-rated" unsupported-claim problem as PG-HOME-01 + PG-HOME-07. Brand-guide-permitted (page 7 lists it as a Do line) but until real reviews exist it's a brittle claim. The crimson-gradient word lives the brand spec.
- **Proposed (two options):**
  - **A — Conservative rewrite:** `"SAN ANTONIO'S / HEAVY-DUTY / TRAILER RENTALS"` (crimson gradient on "HEAVY-DUTY") — preserves the keyword density, swaps unsubstantiated word for a brand-word-bank word, keeps the three-line typography.
  - **B — Keep current but add visible review proof:** wait until 5-10 real reviews land, then re-enable "TOP-RATED" with a `<aside>` linking to the reviews.
- **Recommendation:** A for now. B once GBP is live.

**CO-HERO-03 — Subhead**
- **Current:** `"Hassle-Free Trailer Rentals. Built for heavy duty, designed for simplicity. Pull & Go."`
- **Score:** 🟢 WORKS — three brand-word-bank words ("Hassle-Free", "heavy duty", "Pull & Go"), tight rhythm.

**CO-HERO-04 — CTA labels**
- **Current:** `"Book Your Trailer"` (primary) / `"View Fleet"` (secondary)
- **Score:** 🟢 WORKS.

**CO-HERO-05 — Trust badge text**
- **Current:** `"Local & Reliable"` / `"Heavy-Duty Reliability & Convenience"` + 5-star icons (with `aria-label="5 out of 5 stars"`)
- **Score:** 🔴 WRONG — **The 5-star icon visual + "5 out of 5" aria-label creates a fake-review impression even though no reviews exist.** This is the same family of issue the earlier audit fix (removed fabricated aggregateRating) was addressing. A screen-reader user is told "5 out of 5 stars" with no underlying data.
- **Proposed:** Replace stars with a single brand mark (e.g., the badge icon) or the eyebrow rule. Body: `"LOCAL & RELIABLE"` + `"Heavy-Duty Reliability & Convenience"`. Drop the stars + the aria-label entirely until real reviews exist.
- **Reasoning:** Internal consistency with the 2026-05-15 fix that pulled fake JSON-LD ratings. Visual review-stars + a fake-precision label is the same problem in a different surface.

**CO-HERO-06 — Hero image alt text**
- **Current:** `"Professional trailer fleet — modern heavy-duty utility trailer parked on dark asphalt with San Antonio industrial skyline during dramatic dusk lighting"`
- **Score:** 🔴 WRONG — references "utility trailer" (no longer in fleet).
- **Proposed:** `"Heavy-duty enclosed trailer parked on dark asphalt with San Antonio industrial skyline during dusk — Alamo City Hitch & Go fleet"`
- **Reasoning:** Fleet alignment + brand mention at the end (image alt is a small SEO surface that compounds).

**CO-HERO-07 — Hero image is a placeholder**
- **Current:** URL is `https://lh3.googleusercontent.com/aida-public/...` — Google AIDA placeholder CDN, flagged in the brand guide page 9 as "must be swapped before public launch."
- **Score:** 🔴 WRONG (launch-blocker per brand guide governance).
- **Proposed:** Brand-photography shoot is on the brand-guide pending list. Out of scope for this audit; flag for the launch-readiness checklist.

---

### PricingCallout (`src/components/marketing/PricingCallout.tsx`)

**CO-PRICE-01 — Eyebrow**
- **Current:** `"Transparent Pricing"`
- **Score:** 🟢 WORKS — directly competes with hidden-pricing competitors.

**CO-PRICE-02 — H2**
- **Current:** `"Starting at ${minRate} · Every rate published."` (minRate computed from trailers data; currently $90)
- **Score:** 🟢 WORKS — derived price stays in sync with the trailer data. Middle-dot separator is on-brand for the Industrial Editorial type system.

**CO-PRICE-03 — Body**
- **Current:** `"No quote forms, no \"call for a price\" runaround, no mileage surprises. Pick a trailer, pick a Half Day, Full Day, 3-Day, or 2-Week block, see the total before you book. Texas sales tax called out. Refundable deposit is a hold, not a charge."`
- **Score:** 🟢 WORKS — addresses three top objections in three clauses.

**CO-PRICE-04 — CTA**
- **Current:** `"See Every Rate"`
- **Score:** 🟢 WORKS.

---

### FeatureGrid (`src/components/marketing/FeatureGrid.tsx`)

**CO-FEAT-01 — sr-only H2**
- **Current:** `"Why Choose Alamo City Hitch & Go"`
- **Score:** 🟢 WORKS — screen-reader accessible.

**CO-FEAT-02 — Three feature cards**
- **Current titles:** "Rapid Pickup" / "Pro-Inspected" / "24/7 Support" (matches brand-guide "Three Promises")
- **Current bodies:** Short, active-verb, on-brand.
- **Score:** 🟢 WORKS — exact tagline-system execution from brand guide page 3.

---

### Comparison (`src/components/marketing/Comparison.tsx`)

**CO-COMP-01 — Eyebrow**
- **Current:** `"Counter vs Yard"`
- **Score:** 🟡 WEAK — Clever but unfamiliar phrasing. Doesn't telegraph the section's purpose at a glance.
- **Proposed:** `"How We Compare"` or `"vs the Big-Box Counter"`
- **Recommendation:** `"vs the Big-Box Counter"` — matches the H2 framing, sets up the comparison.

**CO-COMP-02 — H2**
- **Current:** `"The Big-Box Counter / isn't the only option."`
- **Score:** 🟢 WORKS — the trademark-safe reframing is documented in the file header; preserve.

**CO-COMP-03 — Subhead**
- **Current:** `"If you've ever rented from a national chain you already know the pattern. Here's the same five touchpoints, side by side."`
- **Score:** 🟢 WORKS.

**CO-COMP-04 — Comparison rows**
- **Score:** 🟢 WORKS across all 5 rows — each "yard" claim maps to a real commitment in the rental agreement per the file header. Strong, defensible, on-brand.

**CO-COMP-05 — Disclaimer footer**
- **Current:** `"Pattern descriptions reflect recurring customer complaints about national trailer-rental counters captured in public reviews and independent reporting. Our practices are the specific commitments in our rental agreement."`
- **Score:** 🟢 WORKS — legally protective without breaking the voice.

---

### TrustBlock (`src/components/marketing/TrustBlock.tsx`)

**CO-TRUST-01 — Eyebrow**
- **Current:** `"What You Get"`
- **Score:** 🟢 WORKS.

**CO-TRUST-02 — H2**
- **Current:** `"A New Local Beats / The Chain"` (crimson gradient on "The Chain")
- **Score:** 🟢 WORKS — preserves visual rhythm, on-brand crimson-gradient word.

**CO-TRUST-03 — Subhead**
- **Current:** `"We're new — and that's the point. Every rental gets the kind of attention a national counter can't deliver. Here's what that looks like in practice."`
- **Score:** 🟢 WORKS — owns the "new" honestly.

**CO-TRUST-04 — Four promises**
- **Score:** 🟢 WORKS — each is a brand-guide "Three Promises" tier-2 expansion. "What You See Is What You Pay" is a near-perfect anti-objection line.

**CO-TRUST-05 — "Brand-new business" honest footer**
- **Current:** `"Brand-new business. Reviews and testimonials populate here as real customers leave them. In the meantime: you're reading transparent pricing on the same page that holds the rental agreement — not a sales letter."`
- **Score:** 🟢 WORKS — reframes a perceived weakness as positioning. On-brand "foreman not salesman."

**CO-TRUST-06 — Footer CTA**
- **Current:** `"Be Our Next Booking"`
- **Score:** 🟡 WEAK — Friendly but mild. Conversion-copy candidate.
- **Proposed:** `"Reserve a Trailer"` or `"Book My Trailer"` or `"Start Booking"`
- **Recommendation:** A/B candidate (CV-04 below). My pick for now: `"Reserve a Trailer"` — more decisive, keyword-bearing, on-brand.

---

### FAQ (`src/components/marketing/FAQ.tsx`)

**CO-FAQ-01 — Eyebrow + H2**
- **Current:** `"FAQ"` / `"Common Questions"`
- **Score:** 🟢 WORKS.

**CO-FAQ-02 — Subhead**
- **Current:** `"The things people ask before their first booking. Anything missing, shoot us a note from the booking flow and we'll add it here."`
- **Score:** 🟢 WORKS — invites feedback, sets expectation.

**CO-FAQ-03 — Q&A pairs (all 10)**
- **Score:** 🟢 WORKS — see KW-06 for the SEO value of the question phrasing. Bodies are factual, plain-language, and consistent with the rental agreement (cross-checked with `/terms`).
- **Sub-finding:** FAQ #4 ("How much does a trailer rental cost in San Antonio?") is the strongest single SEO surface on the entire site — high commercial intent + exact-match question phrasing + city anchor. Preserve verbatim.

**CO-FAQ-04 — Missing FAQ entries (additive)**
- See KW-07. **Recommend adding these 6 in priority order:**
  1. `"What's the difference between an enclosed trailer and a dump trailer?"` (research-phase intent)
  2. `"Can I rent a trailer for a one-way move?"` (U-Haul-defector intent — answer is no, we're round-trip — say so)
  3. `"Do you do same-day trailer rentals?"` (commercial intent — answer is yes if available)
  4. `"How far in advance should I book?"` (friction-reduction)
  5. `"Can I tow your 24' enclosed with a half-ton pickup?"` (high-intent specific vehicle query)
  6. `"What are your pickup and return hours?"` (currently invisible despite being in JSON-LD)

**CO-FAQ-05 — JSON-LD `FAQPage`**
- **Score:** 🟢 WORKS — built from the same array as the rendered UI, no drift possible.

---

### Footer (`src/components/marketing/Footer.tsx`)

**CO-FOOT-01 — Brand line**
- **Current:** `"ALAMO CITY HITCH & GO"` (crimson `&`)
- **Score:** 🟢 WORKS.

**CO-FOOT-02 — `<address>` content**
- **Current:** `"San Antonio, Texas · Heavy-Duty Reliability"`
- **Score:** 🟡 WEAK — `<address>` is a semantic HTML element. Mixing the tagline "Heavy-Duty Reliability" inside it is semantically incorrect (the element is for contact info, not marketing copy).
- **Proposed:** Split into two lines. `<address>` should hold ONLY: `"San Antonio, Texas"`. Move the tagline to a separate `<span>` adjacent. Once GBP is live and a real street address exists, populate the full NAP block inside `<address>`.

**CO-FOOT-03 — Footer nav**
- **Current:** Fleet / Rates / Terms / Book
- **Score:** 🟢 WORKS.

**CO-FOOT-04 — Agency credit**
- **Current:** `"Built by Digital AI Ads"` (link to digitalaiads.com)
- **Score:** 🟢 WORKS — committed in e9d2c17, on-brand low-contrast styling, opens in new tab with `rel="noopener noreferrer"`.

**CO-FOOT-05 — Missing footer fields (recommended)**
- 🆕 GAP — No phone, no street address, no hours visible, no social links. Each is a local-SEO trust signal.
- **Score:** 🟡 WEAK until GBP + business phone exist.
- **Proposed:** Once owner has a real published business line and yard address, add a 3-line NAP block in `<address>`. Add hours line ("Daily 6 AM – 10 PM"). Add social-link icons when GBP, Facebook, Instagram are set up.

---

### TrailerCard (`src/components/marketing/TrailerCard.tsx`)

**CO-CARD-01 — Image alt text**
- **Current:** `"{trailer.name} — heavy-duty trailer available for rental in San Antonio"`
- **Score:** 🟢 WORKS — keyword-bearing, name-specific, location-anchored.

**CO-CARD-02 — Card price label**
- **Current:** `"${trailer.pricing.fullDay}/DAY"`
- **Score:** 🟡 WEAK — "DAY" is technically the full-day block (24h), not 1 calendar day. Customer could misread.
- **Proposed:** `"$140 / FULL DAY"` or `"FROM $90 / HALF DAY"`
- **Recommendation:** `"FROM $${trailer.pricing.halfDay}"` — anchors on the lowest commitment, drives discovery into the rate matrix.

**CO-CARD-03 — Aria-label on CTA**
- **Current:** `"Rent the {trailer.name} — ${trailer.pricing.fullDay} per day"`
- **Score:** 🟡 WEAK — same "per day" ambiguity as CO-CARD-02.
- **Proposed:** `"Book the {trailer.name} — see rates"` (drop the price from aria, let the card body show it).

---

## 4. Voice Consistency Check (vs Brand Guide v1.0)

Brand guide voice rule (page 7): *"Foreman on the job, not salesman in the lobby. Short sentences. Active verbs. No exclamation points. No emoji. No 'y'all come back now.'"*

Word bank (preferred): Hassle-Free, Heavy-Duty, Pro-Inspected, Machined, Precision, Rugged, Reliable, Rapid, Industrial, Ready, Pull & Go.

### VO-01 — Voice compliance score by surface

| Surface | Score | Notes |
|---|---|---|
| Navbar | 🟢 | Wordmark + nav labels are brand-bank compliant |
| Hero | 🟡 | Mostly compliant; "Top-Rated" is a brand-guide Do but is currently unsupported (see CO-HERO-02) |
| PricingCallout | 🟢 | Three preferred-bank words in body |
| FeatureGrid | 🟢 | Exact brand-guide "Three Promises" execution |
| Comparison | 🟢 | "Foreman" voice throughout |
| TrustBlock | 🟢 | Strongest single execution of the brand voice |
| FAQ | 🟢 | Plain-language, factual, voice is intact |
| Footer | 🟢 | Minimal, on-brand |
| /fleet | 🟢 | Hero subhead uses "industrial-grade" and "the steel" — voice perfect |
| /rates | 🟢 | Subhead matches brand voice exactly |
| /terms | 🟢 | Plain-language professional, no salesman-ese |
| /sign-in | 🟢 | "No password. Enter your email." — short, mechanical, confident |
| /account | 🟢 | "HAULER_COMMAND" all-caps treatment is on-brand for the Industrial Architect voice |
| /book confirmation | 🟢 | Action-oriented, sets next steps |

### VO-02 — Voice violations (rare, but here)

None of the **don't** lines from the brand guide appear anywhere in the site copy. No exclamation points. No emoji. No "awesome" / "super excited" / "best in Texas" / "y'all". Strong compliance.

### VO-03 — Brand guide itself is stale

**The brand guide v1.0 needs a v1.1.** Specifically:
- Page 6 (Typography sample) shows `"20ft Car Hauler — $85 / 4 hours"` — references the OLD fleet and the OLD 4-hour pricing model.
- Page 9 (Photography) flags hero images as placeholders that "must be swapped before public launch" — still true, but the section reads as forward-looking when in fact the placeholders are now blocking launch.
- Page 11 (File Library) lists `business-cards.pdf` as "In Drive" and `rental-agreement.pdf` as "Draft" — verify these statuses are still current.

**Recommended action:** After this audit's Phase 3 ships, regenerate brand-guide pages 6 + 9 to reflect Sprint 3.3 reality. Add a "Tagline Examples" page with refreshed copy from this audit's wins. Bump to v1.1.

---

## 5. Metadata Audit Table

| Page | Title (current) | Title (proposed) | Description (current head) | Score |
|---|---|---|---|---|
| `/` | Alamo City Hitch & Go Co. \| San Antonio's Top-Rated Trailer Rentals (67ch) | Trailer Rental San Antonio — Enclosed & Dump \| Alamo City Hitch & Go (58ch) | Heavy-duty trailer rentals in San Antonio… (165ch) | 🟡→🟢 |
| `/fleet` | Fleet \| Alamo City Hitch & Go Co. — Trailer Rental San Antonio TX | Fleet — Enclosed & Dump Trailers in San Antonio | Browse our fleet of industrial-grade utility trailers, car haulers, and enclosed cargo trailers… | 🔴→🟢 |
| `/book` | Book a Trailer \| Alamo City Hitch & Go Co. — San Antonio TX | Book a Trailer Online | Reserve your trailer online in minutes. Choose from utility trailers, car haulers, and enclosed cargo trailers… | 🔴→🟢 |
| `/rates` | Rates | Trailer Rental Rates San Antonio | Transparent trailer rental pricing in San Antonio. Enclosed and dump trailers in Half Day / Full Day / 3 Days / 2 Weeks blocks. No hidden fees. | 🟡→🟢 |
| `/terms` | Terms | (keep) | Plain-language summary of Alamo City Hitch & Go Co's trailer rental terms — deposits, insurance, late returns, extensions, and governing law. Bexar County, Texas. | 🟢 |
| `/sign-in` | (inherits root) | Sign In (with noindex) | (inherits root — wrong) | 🟡→🟢 |
| `/sign-in/sent` | (inherits root) | Check your email (noindex, nofollow) | (inherits root — wrong) | 🟡→🟢 |
| `/account` | Fleet Command \| Alamo City Hitch & Go Co. | Account (with noindex, nofollow) | Manage your active trailer rental… | 🟡→🟢 |

### MD-01 — Missing per-page OG configs
- 🆕 GAP — Only the root layout has `openGraph`. Interior pages inherit; no page-specific OG title/description.
- **Score:** 🟡 WEAK.
- **Proposed:** Add per-page OG overrides on `/fleet`, `/rates`, `/book` so social shares of those URLs render page-specific cards.

### MD-02 — Missing OG image (`opengraph-image.tsx`)
- 🆕 GAP — see PG-HOME-05. Single biggest single-file SEO improvement available.

### MD-03 — Missing favicon/apple-icon
- Status: only `/public/logo.png` exists. No Next 16 file-convention `icon.tsx` / `apple-icon.tsx`.
- **Score:** 🟡 WEAK — Browser tab + iOS home-screen experience is generic.
- **Proposed:** Add `src/app/icon.tsx` and `apple-icon.tsx` deriving from `logo.png`. Out-of-the-box Next handles the sizing.

### MD-04 — Missing `manifest.json` (PWA basics)
- **Score:** 🟡 WEAK — not critical for launch, but adds "Add to Home Screen" support and feeds Lighthouse PWA score.
- **Proposed:** Defer to Phase 11 polish.

---

## 6. Local SEO Map

### LO-01 — Current local signals

| Signal | Status |
|---|---|
| `<html lang="en">` | 🟢 set |
| LocalBusiness JSON-LD | 🟢 present, with `geo`, `openingHoursSpecification`, `addressLocality`, `addressRegion` |
| Mentions of "San Antonio" in body copy | 🟢 ~12 occurrences across the site |
| Mentions of "Texas" / "TX" | 🟢 ~8 occurrences |
| Mentions of "Bexar County" | 🟢 3 (FAQ, rates fine print, terms) |
| Mentions of any neighborhood/suburb | 🔴 ZERO |
| Mentions of "near me" intent language | 🟡 1 (in metadata only) |
| Google Business Profile link / verification | 🔴 not yet live (per project state) |
| NAP block in Footer | 🟡 partial — city only, no street/phone |
| Hours visible on the site | 🔴 in JSON-LD only, never rendered |
| Map embed | 🟡 dashboard only (auth-gated, not visible to crawlers) |
| Reviews | 🔴 zero |
| Service area schema | 🆕 GAP — no `areaServed` array |

### LO-02 — Recommended local additions

1. **Footer NAP expansion** (CO-FOOT-05): once GBP + business line exist, full NAP visible site-wide.
2. **Service-area sentence** (KW-04): add one neighborhood-naming sentence to TrustBlock or Footer.
3. **`areaServed` JSON-LD** (PG-HOME-08): add `areaServed` array to LocalBusiness with the neighborhood list.
4. **Hours strip** (low priority): add `"Open daily 6 AM – 10 PM"` as a small visible line in Footer.
5. **GBP first** (out of audit scope but blocks LO-01 reviews row): set up Google Business Profile, verify, request first 5 reviews from friends/family who've done trial rentals. Once 5+ live, re-enable visible review surface.
6. **Future: location pages** — `/locations/alamo-heights`, `/locations/stone-oak`, etc. Programmatic-SEO play for Phase 11+.

---

## 7. Conversion-Copy A/B Candidates

These are A/B-test-worthy moments where the current copy is fine but could be sharper. Phase 3 doesn't need to ship A/B logic — these are change-and-measure candidates.

| # | Surface | Current | Variant A | Variant B | My pick |
|---|---|---|---|---|---|
| **CV-01** | Hero primary CTA | `"Book Your Trailer"` | `"Reserve a Trailer"` | `"Start My Booking"` | A |
| **CV-02** | Hero secondary CTA | `"View Fleet"` | `"See the Fleet"` | `"Browse Trailers"` | A |
| **CV-03** | PricingCallout CTA | `"See Every Rate"` | `"View All Rates"` | `"See Pricing"` | keep current |
| **CV-04** | TrustBlock footer CTA | `"Be Our Next Booking"` | `"Reserve a Trailer"` | `"Book My Trailer"` | A |
| **CV-05** | TrailerCard CTA | `"RENT THIS TRAILER"` | `"BOOK THIS TRAILER"` | `"RESERVE THIS RIG"` | B (consistent verb across funnel) |
| **CV-06** | Fleet primary CTA | `"VIEW THE FLEET"` | (anchor scroll only) | (drop entirely) | drop — page IS the fleet |
| **CV-07** | Rates per-trailer CTA | `"Book This Trailer"` | `"Reserve This Trailer"` | `"Start Booking"` | keep current |
| **CV-08** | Terms CTA | `"Start a Booking"` | `"Reserve a Trailer"` | `"Begin Booking"` | A (consistency with CV-01) |

**CV-priority recommendation:** Standardize on the verb **"Book"** as the primary action word across the funnel. Currently the site uses **Book** / **Rent** / **Reserve** / **Start** interchangeably. Pick one — recommend **Book** for primary CTAs and **Reserve** for confirmation-step copy ("Your trailer is reserved").

---

## 8. AI/LLM Citability Recommendations

Goal: get pulled into Google AI Overviews, ChatGPT search, Perplexity, Bing Copilot when someone asks *"What's the best place to rent a trailer in San Antonio?"* or *"How much does a trailer rental cost in San Antonio?"*

### AI-01 — Already excellent

- **FAQPage JSON-LD** — see `src/components/marketing/FAQ.tsx`. FAQPage is one of the few schemas AI engines reliably crawl + cite.
- **Plain-language Q&A phrasing** matches LLM training data patterns. AI engines weight passage clarity heavily.
- **LocalBusiness JSON-LD** — basic but present.

### AI-02 — High-leverage adds

1. **`speakable` property on key FAQ answers** — Google Assistant + voice search picks these up. Add `speakable: { "@type": "SpeakableSpecification", "cssSelector": [".faq-answer"] }` to the FAQPage JSON-LD.
2. **`HowTo` schema on the booking flow** — `/book` is currently a Client Component multi-step wizard. Adding a `HowTo` JSON-LD ("How to rent a trailer from Alamo City Hitch & Go") describing the 5 steps would surface in AI Overviews for "how to rent a trailer" queries.
3. **`Vehicle` or `Product` JSON-LD per trailer** — once `/fleet/[slug]` detail pages exist (PG-FLEET-07), each trailer should have structured data with `image`, `description`, `brand`, `manufacturer`, `offers` (with price). AI search engines cite product pages with full schema more often than thin pages.
4. **`Article` markup on `/terms`** — turns the plain-language summary into a citable resource on rental terms in Texas, useful for SEO on legal-adjacent queries.
5. **`llms.txt`** (the proposed AI-crawler equivalent of `robots.txt`) — define preferred AI engagement here. Even though no engines enforce it yet, early adoption is signaling.

### AI-03 — Citability "voice"

LLMs prefer passages that are:
- **Concise** (single-paragraph answers, not multi-paragraph)
- **Self-contained** (don't depend on reading prior context)
- **Source-attributable** (clear who is making the claim)

The FAQ already nails (a) and (b). To nail (c), consider adding **author attribution metadata**: `"author": { "@type": "Organization", "name": "Alamo City Hitch & Go Co." }` on the FAQPage JSON-LD.

### AI-04 — Specific passages worth optimizing

These specific paragraphs are the most-likely-to-be-cited:
- FAQ #4 (cost): "Block rates start at $90 for a Half Day…" — strong, leave verbatim.
- Comparison row "Pricing": "Block price + Texas sales tax. Refundable deposit hold, not a charge. That's it." — extremely citable; very specific.
- TrustBlock "What You See Is What You Pay" body — strong claim, strong structure.
- PricingCallout body — three-objection-in-one-paragraph structure is LLM-friendly.

---

## 9. Site-Wide Findings (Cross-Cutting)

| # | Finding | Severity | Effort |
|---|---|---|---|
| **SW-01** | LocalBusiness JSON-LD describes old fleet (utility / car hauler) | 🔴 Launch-block | XS — one string change |
| **SW-02** | `/fleet` + `/book` metadata descriptions describe old fleet | 🔴 Launch-block | XS — two string changes |
| **SW-03** | Hero image alt text references "utility trailer" | 🔴 Wrong | XS |
| **SW-04** | Zero neighborhood signals in body copy | 🟡 High-leverage | XS — one sentence in Footer/TrustBlock |
| **SW-05** | No `opengraph-image.tsx` (every share renders blank) | 🟡 High-leverage | M — design + ship one file |
| **SW-06** | Hero "Top-Rated" claim + 5-star icon + 5/5 aria-label without real reviews | 🟡 Wrong (consistency w/ aggregateRating fix) | S |
| **SW-07** | Hero photography is `lh3.googleusercontent.com/aida-public/…` placeholders | 🔴 Launch-block (brand guide flag) | XL — actual photography shoot |
| **SW-08** | Title pattern `\| Alamo City Hitch & Go Co.` is verbose; "Co." duplicates info | 🟡 Easy | XS — change template |
| **SW-09** | `/sign-in`, `/sign-in/sent`, `/account` lack noindex | 🟡 Easy | XS — three metadata exports |
| **SW-10** | Brand guide v1.0 page 6 + page 9 are stale | 🟡 Easy | S — regenerate two HTML sections |
| **SW-11** | Verb inconsistency (Book / Rent / Reserve / Start) across CTAs | 🟡 Polish | XS — standardize |
| **SW-12** | `/account` hardcoded `"10' Utility Trailer"` mock | 🟡 Brand trust | XS |
| **SW-13** | `/fleet` "OUR LOCATIONS" CTA links to `/locations` (404) | 🔴 Launch-block | XS |
| **SW-14** | `<address>` in Footer mixes locality with tagline (semantic violation) | 🟡 Easy | XS |
| **SW-15** | Missing favicon / apple-icon | 🟡 Polish | XS |
| **SW-16** | No `manifest.json` (PWA) | 🟢 Defer | Deferred to Phase 11 |
| **SW-17** | No `areaServed` array in JSON-LD | 🟡 Local-SEO | XS |
| **SW-18** | No per-page OG overrides on /fleet, /rates, /book | 🟡 Easy | S |
| **SW-19** | Hours invisible on the site (only in JSON-LD) | 🟡 Local-SEO | XS |
| **SW-20** | FAQ missing 6 high-intent question entries | 🟡 High-leverage | S |

---

## 10. Phase 3 — Implementation Plan (preview, no commitment)

Assuming the owner approves most of the above, this is how I'd structure the commits for Phase 3. Each commit verifies with `npm run build` and (where UI-visible) a browser preview pass.

| Commit | Scope | Files touched | Effort |
|---|---|---|---|
| 1 | **Launch-blockers: fleet language alignment** | `src/app/page.tsx` (jsonLd description), `src/app/fleet/page.tsx` (metadata), `src/app/book/layout.tsx` (metadata), `src/components/marketing/Hero.tsx` (image alt) | S |
| 2 | **Fix `/fleet` broken CTA** | `src/app/fleet/page.tsx` (replace `/locations` CTA) | XS |
| 3 | **Title pattern + interior page titles** | `src/app/layout.tsx` (template), `src/app/page.tsx` (title), `src/app/rates/page.tsx`, `src/app/terms/page.tsx`, `src/app/book/layout.tsx`, `src/app/fleet/page.tsx` | S |
| 4 | **Auth-surface noindex** | `src/app/sign-in/page.tsx`, `src/app/sign-in/sent/page.tsx`, `src/app/account/page.tsx` | S |
| 5 | **Hero star/top-rated cleanup** | `src/components/marketing/Hero.tsx` (replace star block, H1 wording) | S |
| 6 | **Local SEO: neighborhoods + areaServed + hours** | `src/components/marketing/TrustBlock.tsx` OR `src/components/marketing/Footer.tsx`, `src/app/page.tsx` (jsonLd), Footer | S |
| 7 | **Footer `<address>` semantics + hours line** | `src/components/marketing/Footer.tsx` | XS |
| 8 | **FAQ additions (6 new entries)** | `src/components/marketing/FAQ.tsx` | S |
| 9 | **`/rates` FAQ section** | new `<RatesFAQ>` component OR inline into `/rates/page.tsx` | S |
| 10 | **`opengraph-image.tsx` (homepage card)** | new `src/app/opengraph-image.tsx`, optional per-page overrides | M |
| 11 | **`icon.tsx` + `apple-icon.tsx`** | new files in `src/app/` | XS |
| 12 | **TrailerCard "FROM $90" copy** | `src/components/marketing/TrailerCard.tsx` | XS |
| 13 | **CTA verb standardization** | Hero / TrailerCard / TrustBlock / Terms / Comparison disclaimer | XS |
| 14 | **Account dashboard mock fleet swap** | `src/app/account/page.tsx` (mock data) | XS |
| 15 | **Brand guide v1.1 regen (typography sample + photography note)** | `deliverables/brand-guide/brand-guide.html` | S |

Total: ~15 small commits. Estimated end-to-end (assuming approvals come fast): 1.5–2 working sessions.

---

## 11. Out of Scope (Flagged for Future Work)

- Per-trailer detail pages (`/fleet/[slug]`) — Phase 4+
- Programmatic neighborhood pages (`/locations/[area]`) — Phase 11+
- Real customer photography shoot — owner-blocked, brand-guide tracked
- Google Business Profile setup + first 5 real reviews — owner action
- Search Console verification + first 90 days of organic-traffic baseline — Phase 11
- Lighthouse Core Web Vitals pass — runs after photography swap
- `llms.txt` adoption + AI engine submission — speculative, low ROI today
- Migrating placeholder Google AIDA image URLs to Vercel Blob or original photography
- A/B test infrastructure for the CV-* candidates — Phase 11+

---

## Phase 2 — Owner Review

**Your job:** for each numbered finding above (SW-*, KW-*, PG-*, CO-*, MD-*, LO-*, CV-*, AI-*), mark one of:

- **YES** — ship in Phase 3
- **NO** — skip (note why if non-obvious, so I can avoid re-recommending later)
- **TWEAK** — describe the change and I'll re-propose

Easiest format: reply with a list. Example:

```
SW-01: YES
SW-02: YES
SW-03: YES
SW-04: TWEAK — only the 4 neighborhoods, drop Boerne and Cibolo
SW-05: YES
SW-06: TWEAK — keep the 5 stars, just rephrase aria-label to "Pull & Go branding"
SW-07: NO — handling separately with the photo shoot
...
```

Once I have your markup, I open Phase 3 and start shipping commits.

---

*End of Phase 1 audit. Generated 2026-05-21 against branch `master` at commit e9d2c17.*
