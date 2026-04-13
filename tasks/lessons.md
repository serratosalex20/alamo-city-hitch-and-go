# Lessons Learned

Per `CLAUDE.md` Learning Rules: after any correction, append a lesson here. Review at the start of every session.

---

## Format

Each entry:
- **Date:** YYYY-MM-DD
- **Context:** what I was doing
- **Mistake:** what went wrong
- **Correction:** what the user said / what fixed it
- **Rule:** the durable takeaway

---

## Entries

### 2026-04-12 — UI/UX Audit Findings
- **Context:** Building initial components (Navbar, forms, dashboard)
- **Mistake:** Shipped without a11y fundamentals — no skip-link, no focus-visible, no htmlFor/id on form labels, no aria-hidden on decorative icons, no prefers-reduced-motion, download buttons at 32x32 (below 44px touch minimum), no mobile nav, progress bar missing role="progressbar"
- **Correction:** Full 10-category audit caught all issues
- **Rule:** Before marking any page "done", run through: (1) skip-link present, (2) all icons aria-hidden, (3) form labels have htmlFor+id, (4) all buttons/links min 44x44, (5) prefers-reduced-motion in globals.css, (6) focus-visible styles, (7) heading hierarchy h1→h2→h3, (8) aria-current on active nav, (9) role="progressbar" on progress bars, (10) sizes attr on all fill images
