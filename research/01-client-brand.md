# Client Brand Extraction — Alamo City Hitch & Go Co.
**Date:** 2026-04-08
**Source:** Google Stitch mockups (Landing Page, Customer Dashboard, Trailer Selection) + business card assets

---

## Brand Snapshot
- **Company:** Alamo City Hitch & Go Co.
- **Primary Color:** #ffb4ac (Soft Chrome Red) / #B22222 (Alamo Crimson for actions)
- **Secondary Color:** #bfc2ff (Trust Navy/Periwinkle)
- **Accent Color:** #c6c6c7 (Polished Chrome)
- **Surface:** #101418 (Gunmetal Charcoal)
- **Fonts:** Space Grotesk (headlines) / Manrope (body)
- **Tone:** Industrial-Premium
- **Core Message:** "Hassle-Free Trailer Rentals. Pull & Go."

---

## 1. Logo & Visual Mark

- **Primary mark:** Chrome bull silhouette with Texas star — metallic gradient treatment
- **Wordmark:** "ALAMO CITY" in Space Grotesk, bold, tracked wide, uppercase
- **Submark:** "HITCH & GO" in smaller tracked uppercase beneath
- **Icon fallback:** Material Symbols "construction" icon in primary color
- **Business card style:** Split-panel — brushed steel left, leather texture right, QR code for booking

## 2. Color Palette (Industrial Editorial System)

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Primary | `--color-primary` | #ffb4ac | Headlines, star ratings, active states |
| Primary Action | `--color-primary-action` | #b91c1c | CTA buttons, booking actions |
| Primary Container | `--color-primary-container` | #520004 | Deep red accents, gradients |
| Secondary | `--color-secondary` | #bfc2ff | Trust elements, secondary brand, nav borders |
| Tertiary | `--color-tertiary` | #c6c6c7 | Chrome accents, neutral icons |
| Surface | `--color-surface` | #101418 | Page backgrounds |
| Surface Container | `--color-surface-container` | #1c2024 | Card backgrounds, sections |
| On Surface | `--color-on-surface` | #e0e3e8 | Body text |
| On Surface Variant | `--color-on-surface-variant` | #c5c6ca | Secondary text |
| Outline Variant | `--color-outline-variant` | #44474a | Ghost borders (15% opacity) |

### Design Rules
- **No 1px borders** for sections/cards — use background shifts and tonal depth
- **No pill-shaped buttons** — sharp or 4px radius max ("machined metal")
- **No pure black** — always use Gunmetal Charcoal (#101418)
- **Glass panels** for floating nav/action panels: `backdrop-blur(20px)` + `rgba(28,32,36,0.7)`

## 3. Typography

| Role | Font | Weight Range | Usage |
|------|------|-------------|-------|
| Display/Headlines | Space Grotesk | 300–700 | H1 hero, section headers, nav, buttons |
| Body/Labels | Manrope | 200–800 | Paragraphs, forms, specs, captions |

- **Scale contrast:** 3.5rem display vs 0.875rem body — magazine-style editorial hierarchy
- **Tracking:** Headlines use `tracking-tighter`, labels use `tracking-widest`
- **Transform:** Headlines always `uppercase`

## 4. Tone of Voice

- **Industrial-premium.** Not corporate SaaS, not playful startup.
- **Direct & benefit-driven:** "Hassle-Free Rentals. Pull & Go." — no fluff
- **Authoritative around security:** "Secure Deposit Authorization" not "Pay Here"
- **Local pride:** "San Antonio's Top-Rated" — hyper-local, not generic national

### Key Phrases
- "Hassle-Free Trailer Rentals. Pull & Go."
- "Industrial Grade Reliability"
- "Precision Hauling Since 2018"
- "Local & Reliable"
- "Heavy Duty. Hassle Free."

## 5. Content Inventory

### Pages Designed (Google Stitch)
1. **Landing Page** — Hero + trust badge + CTA + fleet image + 3-feature grid + footer
2. **Trailer Selection** — Hero + 3-card fleet grid (10' Utility / 20' Car Hauler / Enclosed Cargo)
3. **Customer Dashboard** — "HAULER_COMMAND" / "FLEET COMMAND" — active rental card, progress bar, extend button, documents, security status, map

### Planned Pages (from build brief)
4. How It Works
5. About
6. Contact / Book
7. Admin Dashboard
8. 404

## 6. Photography Style

- **Moody, dramatic lighting** — golden hour, deep shadows, cinematic
- **Real trailers** on dark asphalt, industrial environments
- **Grayscale default → full color on hover** — signature interaction pattern
- **No stock photos** of people smiling
- **Think:** RAM truck ads, not enterprise SaaS

## 7. Interaction Patterns

- **Hover:** Grayscale → full color transition (700ms)
- **Buttons:** `active:scale-95` press effect
- **Cards:** `hover:border-primary/30` subtle glow
- **Images:** `group-hover:scale-110` zoom on trailer cards
- **Progress bars:** Gradient `from-red-800 to-red-500`
- **Nav:** Transparent → solid on scroll via `backdrop-blur-xl`

---

*Brand extraction complete. All tokens extracted and implemented in `src/app/globals.css` via Tailwind v4 `@theme` blocks.*
