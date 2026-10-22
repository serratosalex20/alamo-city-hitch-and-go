# Approved Rates and booking UX - 2026-10-22

Base: `a510f09af804bda3d8ebbb53f146c29769a7623f` (fresh independent clone of master).
Alex approved this bundle and its publication. The founders photo and all pricing,
tax, deposit, payment, availability and pickup-request business rules are preserved.

## Changes

- Rates uses each trailer's existing fleet photo, a mobile two-column / desktop
  four-column rate grid, larger supporting copy, explicit checkout totals, one
  deposit explanation per card and a full-width mobile CTA. Coming-soon dump
  retains its existing photo, badge and disabled booking control.
- Regular booking validates exact public slugs against `bookableTrailers` and
  initializes Schedule with that trailer once. Generic, invalid, duplicate and
  coming-soon queries start selection. Server entry keys reset a new URL entry;
  ordinary Back/change interactions preserve the current choice. Approved pickup
  requests and resumable checkouts retain priority.
- Manual selection renders SELECTED, then scrolls Continue only if needed. Smooth
  scrolling becomes instant with reduced motion. It retains focus and never
  advances or submits. Radio keyboard navigation supports arrows, Home and End.
- Booking progress fits 360px; Schedule identifies the chosen trailer and offers
  Change trailer. Date and inventory validation code is unchanged.

## Verification

- Seven new regression cases cover monetary display and image mapping, both valid
  trailer slugs, generic/invalid/unavailable/duplicate queries, returning customers,
  Back/change/rerenders, client URL navigation, pickup-request auth/prefill/resume,
  scroll timing, already-visible CTA, reduced motion and keyboard focus.
- Final affected suite: **21 passed, zero failures**, including existing pickup
  availability, request checkout and request UI tests. Providers are mocked or
  use credential-free in-memory fixtures; no real rentals or submissions.
- Full suite comparison before the final entry-key refinement: untouched base
  **110 tests / 101 passed / 9 failed**; candidate **116 / 107 / 9**. Identical
  failing test locations in automatic-confirmation, booking, checkout-deposit and
  in-person-workflow. These existing failures concern old paper-signing fixtures
  and missing private pickup-address configuration; no new full-suite failure.
  The subsequent entry-key refinement passes the final 21-test affected suite.
- `tsc --noEmit`, full repository ESLint, `git diff --check`, and final optimized
  `next build` pass. Node 25.9.0 locally; project declares Node 24.x for Vercel.
- Actual browser screenshots at **360x800, 390x844 and 1440x1000**. Rates has no
  horizontal overflow; all three correct photos load. Matching mobile cards,
  readable totals/deposit, full-width CTA and desktop split layout inspected.
- Browser verified Fleet enclosed CTA -> Schedule, manual utility selection ->
  Continue visible (bottom 783.5 in 800px viewport), focus remains on the selected
  card, no automatic advancement, Continue -> utility Schedule, and generic Rent
  Now client navigation -> empty selection. Local production build intentionally
  has no private provider configuration; production availability is checked only
  through read-only navigation after deployment.

Local screenshots are in `output/playwright/`, including `rates-360-card.jpg`,
`rates-390-card.jpg`, `rates-390-pricing.jpg`, `rates-desktop.jpg`,
`fleet-to-schedule-360.jpg`, `manual-selection-360.jpg`, and
`generic-selection-360.jpg`. They are not production assets.

## Release

Publish via GitHub's expected-head, nonforce ref update from the base above. Let
the existing Vercel Git integration build once; verify READY, production target,
exact commit and `www.alamocityhitchandgo.com` alias. No credential, grant,
environment-setting or payment-operation changes are part of this task.
