# Outside-hours Pickup Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Recommended here: native execution with executing-plans, because request persistence and checkout share transaction boundaries. Implementation has not started; this plan is for review.

**Goal:** Capture an outside-hours inquiry as a lead before sign-in or payment, let an owner approve or decline with a note, and safely resume an approved rental through the existing booking flow.

**Architecture:** A secondary link opens an optional request dialog. A separate Firestore request record owns the lead, approval, and notification history. Existing admin authentication, verified-email sessions, checkout holds, and payment completion enforce access and connect an approved request to one booking.

**Tech Stack:** Existing Next.js App Router, React, TypeScript, Zod, Firebase Admin/Firestore, Resend, Stripe, and node:test with tsx. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-03-outside-hours-pickup-design.md`

## Global Constraints

- Regular pickup hours are 8:00 AM–6:00 PM daily, Central Time, including a 6:00 PM pickup. Preserve 30-minute slots, the full rental interval, and the existing turnaround buffer.
- Entry copy is **Need a different pickup time?**, a small underlined control below the hours note. Keep the five-step wizard and **Check Availability** primary action intact. Never open the dialog automatically.
- Persist a submitted lead before approval, sign-in, payment, or email delivery. Preserve declined, expired, and unconverted leads. Do not collect unsubmitted keystrokes remotely.
- Approval changes pickup-time eligibility only; it does not create a reservation, waive documents, or charge the customer. Approval expires at pickup time.
- Preview and production stay isolated. Derive request and rate-limit collection names from the existing `bookingCollection` namespace. Never overwrite a verified profile from an unauthenticated submission or enroll leads in marketing.
- Tests use mocked providers or isolated local persistence. No customer email, payment, signature, production deployment, or unrelated launch change is part of executing this plan.

## Review Focus

- A response lost after a successful save: retry returns the same receipt, even if a rate limit is subsequently reached (Task 2).
- The repeated 1:30 AM during a daylight-saving fall transition: reject ambiguity instead of approving the wrong instant (Task 1).
- Two tabs completing different checkouts against one request: only one checkout link can win (Task 5).
- An email timeout after provider acceptance: retry uses the same delivery identity and cannot contradict the saved decision (Task 3).
- Closing the request dialog on mobile or with Escape: the normal booking selections and trigger focus survive (Task 4).

## Task 1: Request contract and schedule validation

**Files:** Create `src/lib/pickup-requests/types.ts`, `validation.ts`, `schedule.ts`, `tests/pickup-request-schedule.test.ts`; modify `src/lib/booking/schedule.ts` only to share a pure wall-clock conversion if useful.

**Interfaces:** `PickupRequestInput` contains `submissionKey`, `firstName`, `lastName`, `email`, `phone`, `trailerId`, `date`, `time`, `duration`, and `message`. `PickupRequestRecord` adds `id`, `status: pending | approved | declined | booked`, UTC schedule fields, creation/update timestamps, optional `decision: {kind, note, actor, at}`, optional `bookingId`, and notification records. Expired is derived from an approved request's pickup time, not a destructive status change. `buildRequestedSchedule(date: string, time: string, duration: RentalDuration, nowMs: number): RentalSchedule` returns `RentalSchedule = ReturnType<typeof buildRentalSchedule>`, exported from the request types module. `requestInputSchema` exports the Zod validator.

- [ ] Write tests asserting summer/winter UTC conversion, rejection of `2026-11-01 01:30` and `2027-03-14 02:30`, invalid dates, past pickups, non-30-minute times, and ordinary 08:00/18:00 slots as outside-hours requests. Verify 07:30 and 18:30 are allowed only by the request schedule function; normal booking validation still rejects both.
- [ ] Run `node --import tsx --test tests/pickup-request-schedule.test.ts`; expect failures for missing request validation. Representative exact assertions:

```ts
assert.throws(() => buildRequestedSchedule("2026-11-01", "01:30", "fullDay", Date.UTC(2026, 9, 1)));
assert.equal(buildRequestedSchedule("2026-10-10", "07:30", "fullDay", Date.UTC(2026, 9, 1)).startTime, "2026-10-10T12:30:00.000Z");
assert.throws(() => localPickupToUtc("2026-10-10", "07:30"));
```
- [ ] Implement the types and validation. Reuse existing name/email/phone and duration constraints; require UUID submission keys and cap message at 1,000 characters. Require a known trailer, but do not reject lead capture solely for unavailable inventory. Identify all valid UTC candidates for the requested Central wall-clock time and accept exactly one; do not add a client-controlled bypass to the normal schedule function.
- [ ] Run the new test plus `tests/booking.test.ts` and `tests/pickup-availability.test.ts`; expect all to pass. Commit as `feat: validate outside-hours pickup requests`.

## Task 2: Durable submission and request access

**Files:** Create `src/lib/pickup-requests/repository.ts`, `access.ts`, `submission.ts`, `src/app/api/pickup-requests/route.ts`, `tests/pickup-request-submission.test.ts`; modify `src/lib/env.ts` for namespaced collection exports.

**Interfaces:** `createPickupRequest(input: PickupRequestInput, networkHash: string, nowMs: number): Promise<{request: PickupRequestRecord; created: boolean}>`; `getPickupRequest(id: string): Promise<PickupRequestRecord | null>`; `listPickupRequests(): Promise<PickupRequestRecord[]>`; `canAccessPickupRequest(session: {email: string; bookingId?: string} | null, request: PickupRequestRecord): boolean`. Full verified-email sessions must match; booking-scoped sessions cannot claim a request. Public POST returns only `{ok: true, requestId: string, status: "received"}`.

- [ ] Write tests: signed-out submission saves one lead; identical retry returns the same reference; changed content under the same submission key fails; an unavailable trailer interval still saves the inquiry; database failure returns an error without sending email. Assert no other lead details are returned, no profile is modified, and unauthorized request reads fail.
- [ ] Run `node --import tsx --test tests/pickup-request-submission.test.ts`; expect failure before implementation. After calling `createPickupRequest` twice with the same valid input, assert:

```ts
assert.equal(first.request.id, retry.request.id);
assert.equal(retry.created, false);
assert.equal(canAccessPickupRequest(null, first.request), false);
assert.equal((await listPickupRequests()).length, 1);
```
- [ ] Implement transactional request creation with pending notification entries. Check idempotent retries before quotas. Use an HMAC of the platform-trusted client IP with the existing `authSecret` export, with a `pickup-request-rate:` HMAC domain prefix; never use arbitrary client-supplied forwarding headers. Limit new submissions to five per ten minutes per network hash and three per hour per normalized email with Firestore transactions. Require same-origin browser submission, a honeypot, bounded body/input, and no production in-memory fallback. Return 429 with retry guidance for quotas; preserve form data on all errors.
- [ ] Add tests for exact quota boundaries, concurrency, trusted/untrusted network headers, cross-origin rejection, honeypot rejection, missing production persistence, lost-response retry, and separate preview namespaces. Run the test; expect all to pass. Commit as `feat: persist pickup inquiries before booking`.

## Task 3: Owner decisions, delivery, and lead visibility

**Files:** Create `src/lib/pickup-requests/service.ts`, `notifications.ts`, `src/app/admin/pickup-requests/page.tsx`, `src/app/admin/pickup-requests/[id]/page.tsx`, `src/components/admin/PickupRequestActions.tsx`, `src/app/api/admin/pickup-requests/[id]/route.ts`, `tests/pickup-request-decisions.test.ts`; modify `src/lib/email/server.ts`, `src/app/admin/page.tsx`, `src/app/admin/contacts/page.tsx`, and the public submission route.

**Interfaces:** `decidePickupRequest(id: string, decision: "approved" | "declined", note: string, actor: string, nowMs: number): Promise<PickupRequestRecord>`; `deliverPickupRequestNotifications(id: string): Promise<{sent: number; failed: number}>`. Admin POST accepts a decision with a required trimmed 1–1,000-character note, or `retry_notifications`. Every admin read/write requires `getAdminSession()`.

- [ ] Write tests for missing/scoped admin sessions, required notes, double-click idempotency, competing opposite decisions, past-time approval, full-interval inventory conflicts, escaped HTML in customer/owner notes, and retained declined leads.
- [ ] Run `node --import tsx --test tests/pickup-request-decisions.test.ts`; expect failures before implementation. In the approval-with-failed-email fixture, assert:

```ts
assert.equal((await getPickupRequest(id))?.status, "approved");
assert.equal((await getPickupRequest(id))?.decision?.note, "We can meet at 7:30 AM.");
assert.equal(delivery.failed, 1);
assert.equal(delivery.sent, 0);
```
- [ ] Implement a transactional terminal decision from pending. Approval checks current inventory and requested time. Save the decision, audit entry, and notification before sending. Public submission calls delivery only after save. Send acknowledgement plus owner alert for a new request, then the decision note to the renter; approval links to the authenticated continuation page. Reuse existing Resend configuration. Persist delivery states and provider IDs with per-request/per-decision keys; missing email configuration is a failure, never a sent state. Retry only failed/pending deliveries; a saved decision is never rolled back for email failure.
- [ ] Build owner list/detail views with pending/approved/declined/booked filters, derived Expired labels, customer note, contact details, and delivery retry. Add request-only contacts after verified profile/booking contacts without overwriting them; label their source and no marketing opt-in.
- [ ] Test provider acceptance followed by timeout, simultaneous retries, missing provider, and persistence-before-send ordering. Run the new test and `tests/auth-security.test.ts`, `tests/customer-profile.test.ts`; expect pass. Commit as `feat: review pickup requests and notify renters`.

## Task 4: Quiet request link and optional dialog

**Files:** Create `src/components/booking/PickupRequestDialog.tsx`; modify `src/components/booking/StepDateTime.tsx` and reuse the existing branded date/time picker components with request-specific options.

**Interfaces:** `PickupRequestDialog({open, initialDetails, onClose}: {open: boolean; initialDetails: Partial<BookingFormData>; onClose: () => void})`. The schedule component owns visibility and keeps the dialog component mounted while the step is mounted; the dialog owns its unsent draft state. Request-specific date options do not claim inventory availability.

- [ ] Reproduce the current schedule in the browser and record its primary action and five-step navigation. Define acceptance observations: no request form before click; link below hours; open/close leaves trailer/date/time/duration unchanged; unavailable normal dates do not hide the link.
- [ ] Implement a `type="button"` control styled as a small underlined text link with 44px touch height, clear focus style, and dialog ARIA attributes. It opens a labelled native dialog with a visible close control, focus trapping/restoration, Escape support, and constrained mobile scrolling. Do not add banners, primary styling, auto-open behavior, or a new wizard step.
- [ ] Implement form validation, existing-details prefill, separate request draft state, submission idempotency key, pending state, and persistent success receipt. Preserve input after failed saves. Explain no reservation or charge; never display email-sent success from a save-only response.
- [ ] Verify keyboard and mobile-width behavior in the browser using test-only local persistence and email stubs: close/Escape focus restoration, form errors, double submit, saved receipt, and main booking preservation. No live notification or real lead is created during this check. Commit as `feat: add optional outside-hours request dialog`.

## Task 5: Approved continuation and single-booking enforcement

**Files:** Create `src/app/pickup-requests/[id]/page.tsx`, `src/lib/pickup-requests/checkout.ts`, `tests/pickup-request-checkout.test.ts`; modify `src/app/book/page.tsx`, `src/components/booking/BookingWizard.tsx`, `StepDateTime.tsx`, `StepPayment.tsx`, `src/lib/booking/validation.ts`, `repository.ts`, `src/app/api/checkout/route.ts`, and `src/types/models.ts`.

**Interfaces:** Add optional `pickupRequestId: string` to `BookingFormData`, checkout input, and Booking. `getApprovedPickupRequest(id: string, session: TokenPayload | null, nowMs: number): Promise<PickupRequestRecord>` rejects unauthorized, unapproved, booked, or expired records. `assertRequestMatchesCheckout(request: PickupRequestRecord, input: CheckoutInput): void` compares normalized email, trailer, date, time, and duration exactly. The existing `createBookingHold(booking, capacity)` transaction is extended to read and bind the request together with the inventory hold; it is the final authority, not an earlier read.

- [ ] Write tests: anonymous/wrong email/scoped sessions cannot read or claim; a request ID or client bypass flag alone fails; contact details prefill after sign-in; schedule changes invalidate approval; expiry rejects checkout; two checkout keys cannot claim one request; retrying the same hold succeeds; expired or canceled unpaid holds can be retried after another inventory check.
- [ ] Run `node --import tsx --test tests/pickup-request-checkout.test.ts`; expect failure before implementation. With two simultaneous `createBookingHold` calls for different booking IDs and one approved request, assert:

```ts
assert.equal(outcomes.filter(result => result.status === "fulfilled").length, 1);
assert.equal(outcomes.filter(result => result.status === "rejected").length, 1);
assert.ok([firstBooking.id, secondBooking.id].includes((await getPickupRequest(requestId))!.bookingId!));
```
- [ ] Implement authenticated continuation through existing `/sign-in?next=...` and its safe return handling. Approved requests enter the normal wizard at Details with the exact approved schedule. Going back to normal schedule explicitly clears the exception; periodic normal availability refresh must not silently erase the approved outside-hours time. Pending/declined/expired pages explain status and link to normal booking without exposing data to another session.
- [ ] Validate ordinary checkout exactly as today when no request is attached. With a request, independently authenticate and match it, build the approved schedule server-side, then transactionally re-read approval, existing linkage, and inventory while creating the hold. Preserve pricing, documents, deposit handling, checkout proof, and all Stripe behavior.
- [ ] Run the new test plus `tests/checkout-deposit.test.ts`, `tests/returning-customer.test.ts`, and `tests/portal-navigation.test.ts`; expect pass. Commit as `feat: resume approved pickup requests safely`.

## Task 6: Payment linkage and Preview verification

**Files:** Modify `src/lib/booking/repository.ts`, `src/lib/booking/workflow.ts`, and `tests/pickup-request-checkout.test.ts`; add `docs/verification/outside-hours-pickup.md` with observed results only.

**Interfaces:** Preserve `completeRentalPaymentRecord`'s public signature. Its transaction updates the linked request to booked together with successful payment. An already-successful booking still reconciles a missing request update on retry after validating the payment intent and booking linkage. Change the early-success return in `markRentalPaymentSucceeded` to call this reconciliation outside the automatic-refund catch; a linkage repair must never re-charge, refund, or rewrite the paid booking lifecycle.

- [ ] Write tests asserting successful payment permanently links the correct request; a different booking/payment cannot consume it; repeated success is idempotent; declined/canceled payments retain the lead; replay repairs missing linkage without creating another charge or booking.
- [ ] Run `node --import tsx --test tests/pickup-request-checkout.test.ts`; observe the new failures. After invoking the real workflow with a mocked successful payment twice, assert:

```ts
assert.equal((await getPickupRequest(requestId))?.status, "booked");
assert.equal((await getPickupRequest(requestId))?.bookingId, bookingId);
assert.equal(refundCalls.length, 0);
assert.equal(newPaymentCalls.length, 0);
```

- [ ] Then implement transactional linkage, then rerun for pass. Commit as `feat: retain request history through rental payment`.
- [ ] Run `npm test`, `tsc --noEmit --incremental false`, ESLint on changed files, `git diff --check`, and `next build --webpack`. Resolve actual regressions; do not expand unrelated scope. Review auth, exception binding, transaction retries, and notification delivery once across the complete change.
- [ ] Publish only to the complete booking Preview after required review. Verify the unobtrusive link, hours, calendar behavior, keyboard/mobile dialog, preserved normal selections, and successful build. Record which backend paths were tested with mocks versus real configuration. No production promotion or live end-to-end purchase is implied.

## Self-review outcome

All spec requirements map to Tasks 1–6: lead persistence (2), owner decisions and notes (3), restrained optional UI (4), safe continuation and inventory (5), payment linkage (6), Central-time validation (1), and retained leads across failures (2–3, 5–6). The five Review Focus cases have explicit owning tests/checks. No new SDK, CRM, payment model, marketing subscription, or ordinary-booking approval requirement is introduced.
