# Automatic confirmation — verification (2026-10-03)

## Authorized scope

Finish self-service booking confirmation in Preview. Qualified renters no longer need an owner to approve a normal booking. Outside-hours requests still need the owner's decision for the exact renter, trailer, dates, time, and duration before checkout/confirmation.

## Behavior

- The final document/payment update rechecks fresh booking state, the pickup request (if any), and inventory in a Firestore transaction.
- A qualifying booking becomes `ready_for_pickup`, records a single automatic-confirmation audit event, and sends the existing pickup email with a stable provider idempotency key.
- Requirements: successful recorded payment, deposit in place, verified identity, a signed current agreement, complete insurance fields and stored proof, matching renter/policyholder name, insurance valid through return, a future valid schedule, and available trailer capacity. Any stored ID expiration must cover the return date too.
- New insurance status `accepted` means the supplied proof and entered details passed these checks. The application does not read the uploaded document or verify coverage with an insurer. `approved` remains the existing owner-reviewed status. Either can supply reusable insurance details when person, tow vehicle and expiration still match; every new rental still needs a new agreement.
- Incomplete or inconsistent records remain pending with an explanatory message. Existing exception review and legacy separate-deposit operations remain available; this does not automatically release a trailer with an unresolved deposit.
- Cancelled, rejected, active, returned, and completed rentals cannot be reopened by a stale document callback. Replaced envelopes cannot mark the replacement agreement signed. Concurrent ID/signature completion uses fresh state.
- Email failures preserve the confirmation and payment. Retrying the document/payment callback or refreshing the documents page retries delivery. No new charge or refund is created by confirmation.
- DocuSign status polls continue while an agreement is sent, covering completion that arrives after the immediate signing-return checks.
- Physical pickup/return inspections and deposit settlement remain existing owner operations.

## Local evidence

- `npm test`: 101 passing tests, zero failures, including payment, return/deposit, outside-hours request, account navigation, and the new confirmation cases.
- New regression coverage: final signature confirms; duplicate callbacks confirm once; missing/expired/mismatched documents and failed deposits block; terminal states remain terminal; stale/replaced-envelope callbacks are ignored; ID arriving last confirms; older ID failure cannot undo verification; outside-hours decisions bind to the exact rental; conflicting inventory blocks; simultaneous ID/signature completion; reuse of accepted current insurance; email failure/retry without charging/refunding.
- `tsc --noEmit`: passed.
- ESLint of changed TypeScript/TSX files: passed.
- `next build --webpack`: passed.
- `git diff --check`: passed.

## Review findings resolved

- Manual approval now uses the same transactional hard requirements, including expiry, matching policyholder, availability and exact outside-hours binding. Legacy separate-deposit bookings may become `confirmed`, never `ready_for_pickup` until their deposit is in place.
- The first DocuSign envelope write and the final route write are guarded against current document/envelope state. A reproduced delayed-envelope overwrite now passes its regression test.
- Insurance upload rejects a policyholder typo before saving. Pending renters also have an Update insurance action; changing policy details invalidates an in-progress or signed old agreement and requires a new signature. The correction UI was exercised in a DOM test.
- The separate reviewer did not evaluate real provider delivery, Firestore contention, or Preview configuration. Those limits remain below.

## Verification boundaries

Provider requests in tests are mocked; no real payment, ID check, signature, lead submission, email delivery, pickup, or refund was performed. Production has not been promoted. Live DocuSign setup and an authenticated real-provider smoke test remain separate launch work. Mobile browser verification is not claimed.

## Preview deployment

- Verified application commit: `6e487a2e0948f189fd9b7be325d1e47042a1af51`.
- Vercel reported READY for Preview deployment `dpl_Hty9q5L8XyDQe3AaNj8EmZ78c8WL`.
- Immutable application Preview: https://alamo-city-hitch-and-psf83v020-serratosalex20-5972s-projects.vercel.app
- Stable booking Preview: https://alamo-city-hitch-and-g-git-40519c-serratosalex20-5972s-projects.vercel.app/book
- Reloaded the stable Preview in the browser and verified the booking wizard loads. No authenticated booking or provider submission was performed in that browser check.
- Production `master` remained `b23b5bc2a5bc180f9f3abc3fe133dfe12401db6c` at publication.
