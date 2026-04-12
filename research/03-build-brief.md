# Build Brief — Alamo City Hitch & Go Co
**Phase 3: Master Strategy Document**  
**Date:** 2026-04-04  
**Based on:** Phase 2 Competitor Analysis (6 competitors scored, 5 deep-scraped)

---

## Executive Summary

Every local competitor in San Antonio's trailer rental market looks like a DIY
WordPress site from 2015. The opportunity is clear: build the first genuinely
premium, conversion-optimized trailer rental website in this market and own the
positioning *before* anyone else figures it out.

The brand name "Hitch & Go" is the strategy. Speed, simplicity, zero friction.
Own that positioning with design, copy, and UX that backs it up.

---

## 1. Design Direction

### Color Palette

Justified by competitive gaps: U-Haul owns orange (#EF6D23). Big Boy uses
navy + orange. No local competitor uses a premium, distinctive palette.

| Role | Color | Hex | Rationale |
|------|-------|-----|-----------|
| **Primary** | Deep Charcoal | `#111827` | Premium, trustworthy. Apple/Stripe register. Dramatically different from every local competitor. |
| **Brand Red** | Alamo Brick | `#C1341A` | References the Alamo's limestone-and-brick heritage. Bold, action-oriented. Distinctly NOT U-Haul orange. |
| **Gold** | Texas Amber | `#E8A020` | Texas premium feel. Used for CTAs, star ratings, highlight callouts. |
| **Background** | Warm Off-White | `#F6F2EC` | Avoids sterile pure white. Feels quality, tactile, local. |
| **Text Secondary** | Slate | `#6B7280` | Supporting body copy, captions. |
| **Surface** | Dark Section BG | `#1C2533` | Alternating dark sections. Gives cinematic rhythm. |

**Section rhythm:** Dark (#111827) → Light (#F6F2EC) → Dark (#1C2533) → Light → Dark
This alternation creates the Apple/Stripe visual depth no competitor is using.

### Typography

| Role | Font | Weight | Source |
|------|------|--------|--------|
| **Headlines** | Barlow Condensed | 700–900 | Google Fonts |
| **Body** | Inter | 400/500 | Google Fonts |
| **Stats / Prices** | Barlow Condensed | 800 | Google Fonts |
| **Eyebrow labels** | Inter | 600, tracked | Google Fonts |

**Rationale:** Barlow Condensed reads as utility + power — it feels like it
belongs on the side of a trailer. It's condensed so headlines can run long
without breaking layouts. Inter is the industry standard for legibility. Both
are free, fast-loading, and pair naturally.

**Never use:** Roboto (generic), Open Sans (dated), anything script (off-brand).

### Photography & Asset Style

- **Hero:** Wide-angle real trailer shot — dramatic angle, golden hour if possible.
  Deep shadow, cinematic. NOT stock photos of people smiling near trailers.
- **Fleet photos:** Clean white background OR on-location concrete. Each trailer
  from 3 angles: front-quarter, rear-quarter, interior/deck.
- **About/Process:** Real team photos. Real location. Authenticity over production.
- **Mood:** Industrial premium. Think RAM trucks ads, not enterprise SaaS.

### Animation Recommendations (GSAP + ScrollTrigger)

| Element | Animation |
|---------|-----------|
| Hero headline | Staggered word reveal, 0.8s, ease-out |
| Section headings | Fade-up on scroll entry (y: 40 → 0) |
| Trailer cards | Stagger in from bottom, 0.15s delay per card |
| Stats/numbers | Counter animation on scroll entry |
| CTA buttons | Subtle scale pulse on load, hover lift + shadow |
| Nav | Background opacity transition on scroll (transparent → solid) |
| Hero image / 3D asset | Parallax scroll (moves at 0.6x page scroll rate) |
| Section dividers | Horizontal line draw (SVG stroke-dashoffset) |
| Dark/light transitions | No jarring cuts — fade between section backgrounds |

**Performance rule:** All animations must respect `prefers-reduced-motion`.
Gate all GSAP animations behind: `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)`

### What to AVOID

These are patterns competitors do badly. Do not repeat them:

- ❌ Generic WordPress template look (Big Boy, SA Beast, Hookup all suffer from this)
- ❌ White-label booking platform as primary design (Alamo City TR)
- ❌ CTA that goes to a contact form instead of a booking flow (Hookup)
- ❌ Stock photography — customers know instantly
- ❌ Cluttered navigation (U-Haul's nav is a maze)
- ❌ Prices hidden behind a reservation flow (U-Haul)
- ❌ AI-sounding "About Us" copy
- ❌ Missing mobile optimization (SA Beast scored 4/10 on mobile)

---

## 2. Site Architecture

### Pages to Build

| Page | URL | Purpose |
|------|-----|---------|
| **Home** | `/` | Convert first-time visitors. Hero → Trust → Fleet preview → Process → Social proof → CTA |
| **Fleet** | `/fleet` | All trailers with full specs, pricing, photos. Primary booking entry point. |
| **How It Works** | `/how-it-works` | Reduce friction. Show exactly what to expect. Answer objections before they arise. |
| **About** | `/about` | Local story. Why us over U-Haul. Team photo. Location + hours. Google Maps embed. |
| **Contact / Book** | `/contact` | Phone + text + form. Map. Hours. Response time promise. |
| **404** | `/404` | Branded. Link back to fleet. |

### Navigation Structure

```
[LOGO]  Fleet  How It Works  About  Contact     [BOOK NOW - gold CTA]
```

- Sticky nav with transparent-to-solid scroll transition
- Mobile: hamburger → full-screen overlay menu
- CTA button always visible: "Book Now" (gold, #E8A020, prominent)

### Content Hierarchy Per Page

**Home:**
1. Hero — Headline + sub + dual CTA (Book Now / Call Now)
2. Trust bar — Quick stats (X trailers, X years, SA-based, 5-star)
3. Fleet preview — 3-4 featured trailers with price + "See All" link
4. "How It Works" — 3-step process (simplified)
5. Why Us — 3 differentiators vs. U-Haul (local, fast, transparent pricing)
6. Social proof — Google reviews (3–5 best, star ratings)
7. Service area — "Serving All of San Antonio & Bexar County"
8. CTA Section — "Ready to Hitch Up?" + both CTAs
9. Footer — Contact, hours, nav, legal

**Fleet:**
1. Page headline + filter/sort controls (by type, price, size)
2. Trailer grid — card per trailer: photo, name, capacity, price, "Request This Trailer"
3. Each card expands or links to trailer detail: full specs, GVWR, hitch size, what fits
4. FAQ accordion at bottom — "What hitch do I need?", "What's required?", "Can I tow it?"

**How It Works:**
1. 3-step visual: Choose → Confirm → Hitch Up
2. What to bring (license, insurance, tow-capable vehicle)
3. Hitch requirements guide (ball sizes by trailer)
4. Pickup process — "Here's exactly what to expect on the day"
5. FAQ accordion

**About:**
1. Story headline — "San Antonio's Trailer Rental, Built the Right Way"
2. Local story — why this business exists, who runs it
3. Team photo(s) placeholder
4. Location section — address, hours, Google Maps embed
5. "Why not U-Haul?" — direct but friendly comparison

**Contact:**
1. Phone number (large, tapable on mobile)
2. Text option (if applicable)
3. Booking request form — Name, phone, email, trailer type, date needed, notes
4. Business hours
5. Address + map
6. Response time promise ("We respond within X hours")

### CTA Strategy — Per Page

| Page | Primary CTA | Secondary CTA |
|------|-------------|---------------|
| Home | "Book Now" → contact form | "Call (210) XXX-XXXX" |
| Fleet | "Request This Trailer" → form | "Call to Check Availability" |
| How It Works | "See Available Trailers" → fleet | "Call with Questions" |
| About | "View Our Fleet" → fleet | Phone number |
| Contact | Form submit | Phone number |

---

## 3. Content Framework

### Homepage Headline — 3 Options

All three tested against the top competitor headline formula patterns:

**Option A — Speed Positioning (Recommended)**
> **San Antonio's Fastest Trailer Rental**
> Hitch up and head out — no runaround, no surprises.

*Rationale:* Owns the speed/ease positioning no competitor holds. Big Boy's
"15-minute in/out" is a feature — this makes it the brand identity. SEO-friendly,
local-geo rich.

**Option B — Brand Voice**
> **Hitch Up. Head Out. You're Done.**
> San Antonio's locally-owned trailer rental — transparent pricing, same-day pickup.

*Rationale:* Three punchy imperatives mirror the "Hitch & Go" name. Rhythm
creates memorability. Includes key trust words: locally-owned, transparent pricing.

**Option C — Differentiation from Corporate**
> **Skip U-Haul. Rent Local.**
> Real trailers, real prices, real San Antonians — ready when you are.

*Rationale:* Direct competitor comparison. Aggressive but honest. "Real" repeated
three times builds authenticity. Works well for customers who've had bad U-Haul
experiences (a known competitor weakness).

### Value Proposition Structure

Three-column trust block below the hero (inspired by Big Boy's operational
differentiators, elevated visually):

```
[Icon] Upfront Pricing       [Icon] Same-Day Pickup      [Icon] Local & Independent
No hidden fees.              Check availability today.    San Antonio owned & operated.
See exactly what             Our fleet is ready when      Real people, real trailers,
you'll pay before you call.  you are — no waiting.        right here in the Alamo City.
```

### Section-by-Section Copy Direction

**Hero sub-headline:** Must include: city name, primary service, 1 differentiator.
Example: *"San Antonio's locally-owned trailer rental — transparent pricing, same-day pickup, zero corporate runaround."*

**Fleet section intro:** Focus on capacity and use cases, not just specs.
Bad: "16ft Utility Trailer — 7,000 lb GVWR"
Good: "Haul a full ATV, furniture load, or landscaping debris — the utility trailer that handles it."

**Social proof section:** Lead with star rating count, then specific reviews.
Format: "[Name], San Antonio" — not just "John D." People trust locals about local businesses.

**"Why Us" section — 3 differentiators (justified by competitor gaps):**
1. **We Show You the Price** — "No 'start a reservation to see pricing.' Here's exactly what you'll pay."
2. **Local Means Accountable** — "When something's off, you're calling a San Antonio number, not a 1-800."
3. **Trailers, That's It** — "We only do trailer rentals. That means our fleet is dialed, our process is fast, and we know trailers."

### SEO Keyword Targets

Primary (high intent, local):
- `trailer rental san antonio`
- `trailer rental san antonio tx`
- `utility trailer rental san antonio`
- `car hauler rental san antonio`

Secondary (type-specific):
- `enclosed trailer rental san antonio`
- `dump trailer rental san antonio tx`
- `flatbed trailer rental san antonio`
- `gooseneck trailer rental san antonio`

Long-tail (low competition, high intent):
- `trailer rental near me san antonio`
- `how to rent a trailer in san antonio`
- `trailer rental bexar county`
- `same day trailer rental san antonio`

**Keyword placement:**
- H1: Primary keyword + city
- H2s on fleet page: Trailer type + city (e.g., "Car Hauler Rental in San Antonio, TX")
- Meta descriptions: Include primary keyword + differentiator
- Alt text: Descriptive + keyword-natural (not stuffed)
- Schema: LocalBusiness markup with ServiceArea = San Antonio / Bexar County

---

## 4. Conversion Playbook

### Primary Conversion Goal
**Phone call OR form submission requesting a trailer.** This is a local service
business — the sale closes over the phone or in-person. The website's job is to
get the visitor to initiate contact with intent to rent.

### Lead Capture Strategy

**Dual-path on every page:**
1. **Phone number** — Large, styled, always visible (mobile: tap-to-call)
2. **"Book Now" form** — Name, Phone, Email, Trailer type dropdown, Date needed, Notes

**Form design rules:**
- Maximum 5-6 fields. Never more.
- "Date needed" as a date picker — reduces friction vs. typing
- Submit button: "Request My Trailer →" (not just "Submit")
- Inline form validation — never make them guess what went wrong
- Confirmation message: "We'll call you back within [X] hours."

**No pricing calculator.** This adds complexity and can anchor low.
Show listed prices per trailer; close final price over the phone.

### Social Proof Plan

| Type | Source | Placement |
|------|--------|-----------|
| Google rating (aggregate) | Google My Business | Hero trust bar + footer |
| 3–5 individual reviews | Google GMB screenshots | Homepage section |
| Named testimonials | Written by real customers | Homepage + fleet page |
| Review count | Google/Yelp total | Trust bar ("X 5-star reviews") |
| Awards / recognition | Consumer Choice Award (if earned) | About page + footer |

**Social proof copy rule:** Always include first name + neighborhood/context.
"Marcus from Helotes — used the car hauler for a cross-city move. Perfect."
This outperforms generic "John D." reviews dramatically.

### Trust Signal Checklist

- [ ] Phone number in nav header (always visible)
- [ ] Google star rating shown on homepage
- [ ] "San Antonio, TX" in hero or trust bar
- [ ] Business hours shown (and consistent)
- [ ] Physical address shown (with map)
- [ ] "Locally owned" stated explicitly
- [ ] Insurance/license requirements explained upfront (reduces cancellations)
- [ ] What's included in rental price stated (e.g., straps, chains?)
- [ ] "No surprise fees" statement near pricing
- [ ] Response time commitment on contact page

---

## 5. Bilingual / Spanish-Language Consideration

SA Beast Trailers lists "Se Habla Español" but does nothing with it. San Antonio
is ~65% Hispanic. Recommendation:

**Minimum:** Add "Se Habla Español" to the contact page and phone CTA.  
**Better:** Translate key CTAs and the hero tagline into Spanish.  
**Best:** Full bilingual toggle (EN / ES) — this would be the *only* local
trailer rental with genuine bilingual UX and would dominate this demographic.

For Phase 4 build: Implement as a data attribute toggle on key sections with a
simple JS swap — no full i18n framework needed.

---

## 6. Build Priorities by Impact

| Priority | Feature | Estimated Impact |
|----------|---------|-----------------|
| 1 | Price transparency on fleet page | Eliminates biggest friction point vs. U-Haul |
| 2 | Tap-to-call phone in nav (mobile) | Converts mobile visitors immediately |
| 3 | Google reviews on homepage | Social proof converts fence-sitters |
| 4 | "How It Works" section | Reduces "I don't know what to expect" abandonment |
| 5 | Full specs per trailer | Answers "can my truck tow this?" before they call |
| 6 | SEO-optimized page titles | Captures local search traffic over time |
| 7 | Se Habla Español CTA | Taps underserved 65% Hispanic market |
| 8 | Booking form (vs. phone only) | Captures after-hours leads |

---

## Nano Banana Asset Placements

The following locations require 3D assets (generated separately):

1. **Hero section** — Main visual. Trailer or hitch-ball asset. Suggested dimensions: 1200×800px.  
   `<!-- NANO BANANA ASSET — HERO TRAILER — 1200x800 -->`

2. **How It Works step icons** — 3 small icons: Trailer silhouette, calendar/checkmark, road/motion.  
   `<!-- NANO BANANA ASSET — STEP ICON [1/2/3] — 200x200 -->`

3. **"Why Us" section** — 3 icon illustrations for pricing/local/speed.  
   `<!-- NANO BANANA ASSET — FEATURE ICON [1/2/3] — 160x160 -->`

---

*Build Brief complete. Proceed to Phase 4: Website Build.*
