# Deliverables — Owner-Facing Assets

These files are meant for the **Google Drive folder shared with the business owners**. Anything in this directory should be treated as a public-facing artifact, not a working note.

Date created: 2026-05-14

---

## Contents

### `brand-guide/brand-guide.html` (+ `brand-guide/logo.png`)
The **official brand system v1.0** for Alamo City Hitch & Go Co. Eleven pages:

1. Cover (with official badge)
2. Contents
3. The North Star — Industrial Architect
4. Logo System (badge + wordmark, four contexts)
5. Color Palette (with 60·30·10 usage ratio)
6. Typography (Teko / Space Grotesk / Inter / Oswald)
7. Voice & Tone (+ word bank, do/don't)
8. Taglines & Messaging
9. Photography Direction
10. UI System & Materials
11. File Library & Governance

Source of truth for all color, type, and logo values: [`src/app/globals.css`](../src/app/globals.css). When the guide and the code disagree, **the code wins** and the guide is re-exported.

`logo.png` (420×367 PNG) is the official badge, copied alongside so the folder is a self-contained drop-in for Drive.

**Status:** Ready for owner review.

### `rental-agreement/rental-agreement.html`
The **draft rental agreement** covering parties, equipment, rental term, fees, deposit (with three trailer-class slots), insurance (renter provides proof via photo upload), use restrictions, 4-hour extension blocks, flat late fee, damage, warranties, indemnification, Texas governing law in Bexar County, DTPA acknowledgment, and Texas UETA electronic-signature consent. DocuSign-ready merge fields (`{{customer_full_name}}`, `{{deposit_class_1_amount}}`, etc.) are highlighted in yellow throughout.

**Status: DRAFT — NOT FOR EXECUTION.** A diagonal "DRAFT" watermark prints on every page via `position: fixed`. The cover sheet and every running header repeat that warning.

> **Required before use:** a **licensed Texas business attorney** must review and approve the final text. The draft intentionally contains bracketed notes flagging items (e.g., the DTPA waiver language in §13.3) that require attorney-level decisions.

---

## How to produce a PDF (owner or developer)

Both files are self-contained HTML documents tuned for US Letter printing.

1. Open the `.html` file in **Google Chrome** (recommended) or any Chromium-based browser (Edge, Brave).
2. **File → Print** (or `Ctrl+P` / `⌘P`).
3. Destination: **Save as PDF**.
4. Settings:
   - **Paper size:** Letter
   - **Layout:** Portrait
   - **Margins:** Default (the documents use CSS `@page` rules for exact spacing)
   - **Scale:** Default (100%)
   - **Options:** **Disable** "Headers and footers" (the documents already have their own running headers/footers). Leave "Background graphics" **enabled** — this is required for the dark brand-guide pages and the DRAFT watermark to render.
5. Save with the following filenames for consistency:
   - `Alamo City Hitch & Go Co — Brand Guide v1.0.pdf`
   - `Rental Agreement — DRAFT v0.1 — Attorney Review.pdf`

---

## Drive upload plan

Target folder: `18e3a2pDVR9vcSLGtqhigpaPyeu9iyFRx` (shared with owners)

Suggested folder layout:

```
Alamo City Hitch & Go Co — Shared Drive/
├── 00 — Brand/
│   ├── Brand Guide v1.0.pdf
│   └── Logo/ (logo.png, business-cards.pdf, + future SVG)
├── 01 — Legal/
│   └── Rental Agreement — DRAFT v0.1 — Attorney Review.pdf
├── 02 — Photography/ (pending shoot)
└── 03 — Ops/ (inspection sheets, pickup checklists — later)
```

If the Drive MCP is configured against the user's Google account, the developer can upload both PDFs with file descriptions indicating their status (Live vs. Draft). Otherwise the user uploads manually after producing PDFs per the instructions above.

---

## Outstanding inputs needed from owners

These populate the merge fields in the rental agreement and unlock v0.2:

| Field | Notes |
|---|---|
| `{{business_legal_name}}` | Exact LLC name as filed with Texas Secretary of State |
| `{{business_address}}` | Registered principal place of business |
| `{{deposit_class_N_name}}` × 3 | E.g., "10ft Utility", "20ft Car Hauler", "Enclosed Cargo" |
| `{{deposit_class_N_amount}}` × 3 | Final deposit dollar amounts |
| `{{extension_block_fee}}` | Dollar fee per 4-hour extension block |
| `{{late_fee_amount}}` | Flat late fee per rental |
| `{{abandonment_threshold_hours}}` | After how many hours overdue is the trailer deemed abandoned? (Typical: 24) |

Once these are supplied, the agreement moves from v0.1 (fields-placeholder draft) to v0.2 (values-populated draft ready for attorney review).
