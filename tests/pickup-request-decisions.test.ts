import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createPickupRequest,
  getPickupRequest,
  mutatePickupRequest,
} from "../src/lib/pickup-requests/repository";
const now = Date.UTC(2026, 9, 1),
  owner = "owner@alamocityhitchandgo.test";
async function lead() {
  return (
    await createPickupRequest(
      {
        submissionKey: randomUUID(),
        firstName: "Lead",
        lastName: "Test",
        email: `${randomUUID()}@example.com`,
        phone: "2105550100",
        trailerId: "trailer-004",
        date: "2027-10-10",
        time: "07:30",
        duration: "fullDay",
        message: "<script>bad</script>",
      },
      randomUUID(),
      now,
    )
  ).request;
}
test("owner decisions require a note and full admin access and cannot contradict a saved outcome", async () => {
  const service = await import("../src/lib/pickup-requests/service").catch(
    () => null,
  );
  assert.ok(service, "decision service must exist");
  const request = await lead();
  await assert.rejects(
    service.handlePickupRequestAction(
      request.id,
      { action: "approved", note: "yes" },
      null,
    ),
    /owner/i,
  );
  await assert.rejects(
    service.handlePickupRequestAction(
      request.id,
      { action: "approved", note: "yes" },
      { email: owner, bookingId: "scoped" },
    ),
    /owner/i,
  );
  await assert.rejects(
    service.decidePickupRequest(request.id, "approved", "", owner, now),
  );
  const outcomes = await Promise.allSettled([
    service.decidePickupRequest(
      request.id,
      "approved",
      "We can meet at 7:30 AM.",
      owner,
      now,
    ),
    service.decidePickupRequest(
      request.id,
      "declined",
      "Unavailable",
      owner,
      now,
    ),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  const saved = await getPickupRequest(request.id);
  assert.ok(saved?.decision);
  assert.equal(saved.audit.length, 2);
  await service.decidePickupRequest(
    request.id,
    saved.decision.kind,
    saved.decision.note,
    owner,
    now,
  );
  assert.equal((await getPickupRequest(request.id))?.audit.length, 2);
  const expired = await lead();
  await assert.rejects(
    service.decidePickupRequest(
      expired.id,
      "approved",
      "yes",
      owner,
      expired.startTimeMs,
    ),
    /passed/i,
  );
});
test("delivery failure preserves lead and decision; concurrent retries use stable delivery identities", async () => {
  const delivery = await import(
    "../src/lib/pickup-requests/notifications"
  ).catch(() => null);
  assert.ok(delivery, "delivery service must exist");
  const request = await lead();
  let count = 0;
  const keys: string[] = [];
  const send = async (
    record: typeof request,
    notification: (typeof request.notifications)[number],
  ) => {
    assert.ok(await getPickupRequest(record.id));
    keys.push(notification.key);
    count++;
    if (count === 1) throw new Error("timeout after acceptance");
    return { sent: true as const, providerId: "email-test" };
  };
  const first = await delivery.deliverPickupRequestNotifications(
    request.id,
    send,
  );
  assert.equal(first.failed, 1);
  assert.equal((await getPickupRequest(request.id))?.status, "pending");
  await Promise.all([
    delivery.deliverPickupRequestNotifications(request.id, send),
    delivery.deliverPickupRequestNotifications(request.id, send),
  ]);
  assert.equal(keys.length, 3);
  assert.equal(keys[0], keys[2]);
  assert.ok(
    (await getPickupRequest(request.id))?.notifications.every(
      (n) => n.status === "sent",
    ),
  );
  const { decidePickupRequest } = await import(
    "../src/lib/pickup-requests/service"
  );
  await decidePickupRequest(
    request.id,
    "declined",
    "<b>Try another day</b>",
    owner,
    now,
  );
  const failed = await delivery.deliverPickupRequestNotifications(
    request.id,
    async () => ({ sent: false as const }),
  );
  assert.equal(failed.failed, 1);
  assert.equal((await getPickupRequest(request.id))?.status, "declined");
  const { pickupRequestEmailContent } = await import(
    "../src/lib/pickup-requests/email-content"
  );
  const content = pickupRequestEmailContent(
    (await getPickupRequest(request.id))!,
    "decision",
  );
  assert.ok(content.html.includes("&lt;b&gt;Try another day&lt;/b&gt;"));
  assert.ok(!content.html.includes("<b>Try another"));
});
test("approval rejects unavailable full rental interval but retains the inquiry", async () => {
  const service = await import("../src/lib/pickup-requests/service").catch(
    () => null,
  );
  assert.ok(service);
  const request = await lead();
  await mutatePickupRequest(request.id, (r) => ({
    ...r,
    trailerId: "trailer-003",
  }));
  await assert.rejects(
    service.decidePickupRequest(request.id, "approved", "yes", owner, now),
    /available/i,
  );
  assert.equal((await getPickupRequest(request.id))?.status, "pending");
});
test("overlap late in the requested rental prevents approval without deleting the lead", async () => {
  const { bookingFixture } = await import("./fixtures/booking");
  const { createBookingHold } = await import("../src/lib/booking/repository");
  const { decidePickupRequest } = await import(
    "../src/lib/pickup-requests/service"
  );
  const request = await lead(),
    booking = bookingFixture(randomUUID());
  booking.trailerId = request.trailerId;
  booking.startTimeMs = request.endTimeMs - 3600000;
  booking.endTimeMs = request.endTimeMs + 86400000;
  booking.startTime = new Date(booking.startTimeMs).toISOString();
  booking.endTime = new Date(booking.endTimeMs).toISOString();
  await createBookingHold(booking, 1);
  await assert.rejects(
    decidePickupRequest(request.id, "approved", "yes", owner, now),
    /not available/,
  );
  assert.equal((await getPickupRequest(request.id))?.email, request.email);
});

test("leased notification delivery is reported as outstanding rather than up to date", async () => {
  const { deliverPickupRequestNotifications } = await import(
    "../src/lib/pickup-requests/notifications"
  );
  const r = await lead();
  await mutatePickupRequest(r.id, (record) => ({
    ...record,
    notifications: record.notifications.map((n) => ({
      ...n,
      status: "sending",
      leaseUntil: Date.now() + 120000,
      claimId: "another-worker",
    })),
  }));
  const result = await deliverPickupRequestNotifications(r.id, async () => {
    throw new Error("Must not send an active lease");
  });
  assert.equal(result.sent, 0);
  assert.equal(result.failed, 0);
  assert.equal(result.outstanding, 2);
});

test("approval mutation reads inventory at commit, including a checkout added after initial request lookup", async () => {
  const repo = await import("../src/lib/booking/repository");
  assert.equal(typeof repo.mutatePickupRequestWithInventory, "function");
  const r = await lead();
  await mutatePickupRequest(r.id, (x) => ({
    ...x,
    date: "2029-10-10",
    startTimeMs: x.startTimeMs + 63072000000,
    endTimeMs: x.endTimeMs + 63072000000,
  }));
  const before = (await getPickupRequest(r.id))!;
  const { bookingFixture } = await import("./fixtures/booking");
  const booking = bookingFixture(randomUUID());
  Object.assign(booking, {
    trailerId: before.trailerId,
    startTimeMs: before.startTimeMs,
    endTimeMs: before.endTimeMs,
  });
  await repo.createBookingHold(booking, 1);
  await repo.mutatePickupRequestWithInventory(r.id, (record, inventory) => {
    assert.ok(inventory.some((b) => b.id === booking.id));
    return record;
  });
  const { decidePickupRequest } = await import(
    "../src/lib/pickup-requests/service"
  );
  await assert.rejects(
    decidePickupRequest(r.id, "approved", "yes", owner),
    /not available/,
  );
  assert.equal((await getPickupRequest(r.id))?.status, "pending");
});
