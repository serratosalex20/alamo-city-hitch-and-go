# Paper-signing release recovery — 2026-10-22

## Candidate and preservation

- Source checkout: `C:\Users\serra\Documents\Codex\2026-10-21\task-3\release-request-only`.
- Source branch: `release/in-person-signing`; base `25d8c6a6dcf6888f8cad8a3f3f1b72ffbb5e4008`.
- Independent clone: `C:\Users\serra\Documents\Codex\2026-10-21\task-5\recovery-candidate`, branch `recovery/in-person-signing-20261022`.
- Captured a binary full-index patch, both untracked tests, and SHA-256 manifest in adjacent `recovery-snapshot/`. Source status, HEAD and all 12 file hashes matched before/after capture. Source hashes still matched after implementation. Original files were never edited.
- Clone used `--no-hardlinks`; it has its own Git metadata, dependency installation, npm cache and build output. No environment files, credentials, `.vercel`, node_modules links or shared caches were copied.

## Behavior

`AGREEMENT_SIGNING_MODE` defaults to `in_person` for this temporary release. `docusign` explicitly restores the existing electronic-signing path and its configuration gates. Invalid values fail closed. No deployed setting was changed.

- Checkout preserves rental + tax + the **charged $200 refundable deposit**. Existing payment reconciliation, refund/retention mechanics and DocuSign implementation remain.
- Paid paper bookings carry `awaiting_in_person` while ID and insurance progress. Current proof and policy details remain required. Existing paid bookings can select the paper arrangement through the agreement endpoint.
- Paper signing does not simulate DocuSign completion. Electronic callbacks cannot mark an awaiting paper agreement signed.
- Owner verification requires completed payment/ID/insurance, a decision note, owner identity, signature and verification timestamps, and an audit event. Confirmation still rechecks schedule, insurance, inventory, approved outside-hours pickup and deposit requirements.
- A verified paper signature can be confirmed at its scheduled pickup time, until the scheduled return; expired rentals remain blocked. Electronic signature timing policy stays unchanged.
- Pickup rechecks the verified agreement and pre-rental inspection inside the booking update. An unverified paper status cannot release a trailer.
- Changed insurance invalidates verification, clears old signature/owner fields and supersedes any previous electronic envelope. The replacement paper agreement requires a fresh owner verification.
- Owners can request corrected insurance or reject before paper signing. Customer/owner pages describe paper signing and retained-copy requests without promising an electronic signed PDF.
- Existing hero asset remains `/fleet/20-enclosed-side.png`, inspected in color. Marketing hero and trailer card images have no grayscale filter; both retain a subtle 1.05 hover zoom with reduced-motion support. No image was regenerated or replaced.

## Verification

- First affected regression selection: **42 tests passed**, zero failures. Includes payments/deposit lifecycle, confirmation, document ordering, electronic signing/race, document download, returning customers, notification retries, auth and paper flow.
- After insurance invalidation helper: **11 focused tests passed**; TypeScript, changed-file ESLint and whitespace checks passed.
- Initial isolated `next build --webpack` passed compilation, TypeScript and all 33 static pages.
- Final focused checks after owner correction controls and customer-copy adjustments: **12 tests passed**, zero failures. TypeScript (`--noEmit --incremental false`) and ESLint on every changed TS/TSX file passed. Whitespace check passed after removing an extra example-file trailing blank line.
- Final isolated `next build --webpack` after all source changes completed successfully: compilation, TypeScript, static generation (33 pages) and build tracing. No source changes followed this build.
- Runtime available here: Node **25.9.0**, npm **11.12.1**. Project declares Node 24.x; deployment-runtime verification on Node 24 remains outstanding. Dependencies installed from unchanged lockfile with lifecycle scripts disabled.
- Tests use synthetic data/mocked providers or credential-free in-memory adapters. Live credentials were excluded from test/build environments. No live charge, refund, email, request, signature, database mutation or owner financial action was performed.

## Holds and limitations

- All pushes and deployments are held. Parent must resolve ownership of the stale task before integration or promotion.
- This candidate starts from completed Preview `25d8c6a`, intentionally restoring paid booking instead of the temporary production request-only form at `ed87481`. No production data was changed. Historical request-only intake records remain in their separate collection; request-only UI/backend files are not included in this Preview-based candidate.
- Actual production configuration, webhook delivery, provider operation and production database contention remain unverified. Local build/tests are not a live end-to-end claim.
- Supplied founders asset `libfile_49559988f984819185996e58d74333f2` (`JB and Kelby founders.jpg`) and reference `libfile_3092ed6ab0e481918bd7eb7543d5d6fe` (`IMG_20260721_195448.jpg`) were resolved through Library preparation. The required current transfer helper failed on Windows: `AttributeError: module 'os' has no attribute 'setxattr'`. It could not finish metadata-preserving materialization. No fallback transfer, image editing or face alteration was attempted. Neither asset was used; founders placeholder remains. Actual local byte verification/pixel inspection and photo integration remain blocked.
