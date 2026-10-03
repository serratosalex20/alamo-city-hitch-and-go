# Outside-hours pickup request verification

Scope: approved optional request flow, based on booking Preview 9ee5d5c. Production is not promoted by this work.

## Automated evidence

- 88/88 tests passed after the final review fixes, including ordinary booking regression tests.
- TypeScript, changed-file ESLint, diff whitespace check, and `next build --webpack` passed.
- Request tests exercise actual validation, repository, notification orchestration, decisions, holds, and payment reconciliation with isolated in-memory persistence and injected email results. No real email, payment, or signature was initiated.
- Added a development-only DOM dependency (`happy-dom`) for real React component interactions. Verified first-open prefill from current date/duration, independent draft on reopen, unchanged normal selections, and Escape consumption only while a date/time popover is open.
- Firestore transaction code was inspected; these tests did not execute a live/emulated Firestore transaction.

## Independent review and fixes

One independent read-only review found no Critical issues and five Important issues. All five were addressed in one fix pass:

1. Approval now reads request and current inventory in the same transaction before saving the decision. Checkout still rechecks availability because approval does not reserve inventory.
2. The dialog initializes on first opening using current booking selections, then stays mounted to preserve its independent draft.
3. Authenticated approval continuation recovers the linked active checkout and saved details. A domain-separated server HMAC restores the same checkout proof after a lost response; a full matching-email session and exact request/booking binding remain mandatory. Competing holds still cannot claim one approval. Optional blank/missing vehicle plate is compared equivalently.
4. Closed picker triggers allow native dialog Escape cancellation; an open popover consumes the first Escape.
5. Owner detail labels the saved text Decision note, displays each persisted email status, and reports outstanding leased deliveries as pending rather than complete.

Regressions were observed failing before fixes, then passing. No Minor findings were deferred.

## Scope rulings and validation limits

- Existing ordinary-rental confirmation/document-review policy stays a separate launch task; this feature introduces review only for outside-hours requests.
- General ordinary-checkout recovery, cancellation races, and failed-card Back behavior are outside this change. Approved-request active-checkout recovery was in scope and fixed.
- CRM/SMS, marketing enrollment, extra charges, revising terminal decisions, and changing approved schedules through a note remain excluded. A new schedule requires a new request.
- Live provider behavior, production readiness/promotion, and live database concurrency are not claimed as tested.
- The isolated local app was started with external credentials removed, but Cloud Browser blocked its loopback URL. Therefore no end-to-end local browser submission was made. DOM interaction tests and server workflow tests cover those paths independently.
- The worktree stays isolated; email rendering is pure and provider sending is injected in tests. These choices preserve existing edits and avoid external test messages.
- Preview publication was already approved; the finishing workflow does not introduce another integration approval prompt.

## Preview observations

Pending deployment/UI observations. Baseline before update: ordinary schedule exposes five steps and Check Availability, with 21 half-hour slots from 8 AM through 6 PM Central.
