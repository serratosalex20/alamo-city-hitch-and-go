import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const input = () => ({
  submissionKey: randomUUID(),
  firstName: "Lead",
  lastName: "Test",
  email: `${randomUUID()}@example.com`,
  phone: "210-555-0100",
  trailerId: "trailer-004",
  date: "2027-10-10",
  time: "07:30",
  duration: "fullDay" as const,
  message: "Early pickup please",
});
test("submitted leads persist idempotently before sign-in and cannot be claimed by another session", async () => {
  const repo = await import("../src/lib/pickup-requests/repository").catch(
    () => null,
  );
  assert.ok(repo, "request repository must exist");
  const { canAccessPickupRequest } = await import(
    "../src/lib/pickup-requests/access"
  );
  const data = input(),
    first = await repo.createPickupRequest(
      data,
      "network-one",
      Date.UTC(2026, 9, 1),
    );
  const retry = await repo.createPickupRequest(
    data,
    "network-one",
    Date.UTC(2026, 9, 1),
  );
  assert.equal(first.request.id, retry.request.id);
  assert.equal(retry.created, false);
  assert.equal(
    (await repo.getPickupRequest(first.request.id))?.phone,
    data.phone,
  );
  assert.equal(canAccessPickupRequest(null, first.request), false);
  assert.equal(
    canAccessPickupRequest({ email: "other@example.com" }, first.request),
    false,
  );
  assert.equal(
    canAccessPickupRequest(
      { email: data.email, bookingId: "scoped" },
      first.request,
    ),
    false,
  );
  assert.equal(
    canAccessPickupRequest({ email: data.email }, first.request),
    true,
  );
  await assert.rejects(
    repo.createPickupRequest(
      { ...data, message: "changed" },
      "network-one",
      Date.UTC(2026, 9, 1),
    ),
    /changed/,
  );
});
test("durable quotas block excess submissions but allow identical retries", async () => {
  const repo = await import("../src/lib/pickup-requests/repository").catch(
    () => null,
  );
  assert.ok(repo);
  const now = Date.UTC(2026, 9, 1),
    email = `${randomUUID()}@example.com`,
    data = input();
  data.email = email;
  for (let i = 0; i < 3; i++)
    await repo.createPickupRequest(
      { ...data, submissionKey: i ? randomUUID() : data.submissionKey },
      `email-net-${i}`,
      now,
    );
  await assert.rejects(
    repo.createPickupRequest(
      { ...data, submissionKey: randomUUID() },
      "email-net-4",
      now,
    ),
    /Too many/,
  );
  assert.equal(
    (await repo.createPickupRequest(data, "email-net-0", now)).created,
    false,
  );
  const net = randomUUID();
  const outcomes = await Promise.allSettled(
    Array.from({ length: 6 }, () =>
      repo.createPickupRequest(input(), net, now),
    ),
  );
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 5);
  assert.equal(
    (await repo.createPickupRequest(input(), net, now + 600001)).created,
    true,
  );
});
test("submission rejects cross-origin, oversized and honeypot posts without exposing lead data", async () => {
  const mod = await import("../src/lib/pickup-requests/submission").catch(
    () => null,
  );
  assert.ok(mod);
  const post = (body: unknown, origin = "http://localhost:3000") =>
    new Request("http://localhost:3000/api/pickup-requests", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  await assert.rejects(
    mod.submitPickupRequest(post(input(), "https://bad.example")),
    /origin/i,
  );
  await assert.rejects(
    mod.submitPickupRequest(post({ ...input(), website: "spam" })),
    /request/i,
  );
  await assert.rejects(
    mod.submitPickupRequest(post({ ...input(), message: "x".repeat(20000) })),
    /large/i,
  );
  const receipt = await mod.submitPickupRequest(post(input()));
  assert.deepEqual(Object.keys(receipt).sort(), ["created", "requestId"]);
  assert.equal(
    mod.pickupNetworkHash(new Headers({ "x-forwarded-for": "1.2.3.4" }), false),
    mod.pickupNetworkHash(new Headers({ "x-forwarded-for": "8.8.8.8" }), false),
  );
  assert.notEqual(
    mod.pickupNetworkHash(
      new Headers({ "x-vercel-forwarded-for": "1.2.3.4" }),
      true,
    ),
    mod.pickupNetworkHash(
      new Headers({ "x-vercel-forwarded-for": "8.8.8.8" }),
      true,
    ),
  );
});
test("production cannot silently save leads in memory and preview namespaces stay separate", async () => {
  const { spawnSync } = await import("node:child_process");
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      `import {createPickupRequest} from './src/lib/pickup-requests/repository.ts'; import {pickupRequestCollection,pickupRequestRateCollection} from './src/lib/env.ts'; try { await createPickupRequest(${JSON.stringify(input())},'net'); process.exit(3); } catch(e) { console.log(JSON.stringify({status:e.status,collection:pickupRequestCollection,rates:pickupRequestRateCollection})); }`,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        BOOKING_COLLECTION: "preview_leads_test",
        FIREBASE_ADMIN_PROJECT_ID: "",
        FIREBASE_ADMIN_CLIENT_EMAIL: "",
        FIREBASE_ADMIN_PRIVATE_KEY: "",
      },
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), {
    status: 503,
    collection: "preview_leads_test_pickup_requests",
    rates: "preview_leads_test_pickup_request_rates",
  });
});
