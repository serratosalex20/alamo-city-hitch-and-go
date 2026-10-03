import { createHmac } from "node:crypto";
import { getFirestoreAdmin } from "@/lib/firebase/admin";
import {
  authSecret,
  hasFirebase,
  isDemoEnvironment,
  pickupRequestCollection,
  pickupRequestRateCollection,
} from "@/lib/env";
import { trailers } from "@/lib/data/trailers";
import { buildRequestedSchedule } from "./schedule";
import { requestInputSchema } from "./validation";
import type { PickupRequestInput, PickupRequestRecord } from "./types";
export class PickupRequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Store = {
  requests: Map<string, PickupRequestRecord>;
  rates: Map<string, number[]>;
};
type DemoGlobal = typeof globalThis & {
  __pickupRequestStores?: Map<string, Store>;
};
function demoStore(): Store {
  if (!isDemoEnvironment)
    throw new PickupRequestError(
      "Request storage is temporarily unavailable.",
      503,
    );
  const root = globalThis as DemoGlobal;
  root.__pickupRequestStores ??= new Map();
  if (!root.__pickupRequestStores.has(pickupRequestCollection))
    root.__pickupRequestStores.set(pickupRequestCollection, {
      requests: new Map(),
      rates: new Map(),
    });
  return root.__pickupRequestStores.get(pickupRequestCollection)!;
}
function db() {
  const value = getFirestoreAdmin();
  if (!value)
    throw new PickupRequestError(
      "Request storage is temporarily unavailable.",
      503,
    );
  return value;
}
export function requestRateHash(value: string) {
  return createHmac("sha256", authSecret)
    .update(`pickup-request-rate:${value}`)
    .digest("hex");
}
function sameInput(record: PickupRequestRecord, input: PickupRequestInput) {
  return Object.entries(input).every(
    ([key, value]) => record[key as keyof PickupRequestInput] === value,
  );
}
function existingResult(
  record: PickupRequestRecord,
  input: PickupRequestInput,
) {
  if (!sameInput(record, input))
    throw new PickupRequestError(
      "Request details changed. Please submit a new request.",
      409,
    );
  return { request: structuredClone(record), created: false };
}
function buildRecord(
  input: PickupRequestInput,
  now: number,
): PickupRequestRecord {
  if (!trailers.some((t) => t.id === input.trailerId))
    throw new PickupRequestError("Choose a valid trailer.");
  return {
    ...input,
    ...buildRequestedSchedule(input.date, input.time, input.duration, now),
    id: input.submissionKey,
    status: "pending",
    createdAtMs: now,
    updatedAtMs: now,
    notifications: ["received", "owner"].map((kind) => ({
      kind: kind as "received" | "owner",
      status: "pending",
      key: `pickup-${input.submissionKey}-${kind}`,
      attempts: 0,
    })),
    audit: [{ action: "submitted", actor: "renter", at: now }],
  };
}
function quota(stamps: number[], now: number, window: number, limit: number) {
  const active = stamps.filter((stamp) => stamp > now - window);
  if (active.length >= limit)
    throw new PickupRequestError(
      "Too many requests. Please wait and try again.",
      429,
    );
  return [...active, now];
}
export async function createPickupRequest(
  raw: PickupRequestInput,
  networkHash: string,
  nowMs = Date.now(),
): Promise<{ request: PickupRequestRecord; created: boolean }> {
  const input = requestInputSchema.parse(raw),
    networkKey = `network-${networkHash}`,
    emailKey = `email-${requestRateHash(input.email)}`;
  if (!hasFirebase) {
    const store = demoStore(),
      existing = store.requests.get(input.submissionKey);
    if (existing) return existingResult(existing, input);
    const record = buildRecord(input, nowMs),
      n = quota(store.rates.get(networkKey) ?? [], nowMs, 600000, 5),
      e = quota(store.rates.get(emailKey) ?? [], nowMs, 3600000, 3);
    store.rates.set(networkKey, n);
    store.rates.set(emailKey, e);
    store.requests.set(record.id, structuredClone(record));
    return { request: record, created: true };
  }
  const firestore = db(),
    ref = firestore
      .collection(pickupRequestCollection)
      .doc(input.submissionKey),
    nr = firestore.collection(pickupRequestRateCollection).doc(networkKey),
    er = firestore.collection(pickupRequestRateCollection).doc(emailKey);
  return firestore.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (old.exists)
      return existingResult(old.data() as PickupRequestRecord, input);
    const [ns, es] = await Promise.all([tx.get(nr), tx.get(er)]);
    const record = buildRecord(input, nowMs),
      n = quota(ns.data()?.stamps ?? [], nowMs, 600000, 5),
      e = quota(es.data()?.stamps ?? [], nowMs, 3600000, 3);
    tx.create(ref, record);
    tx.set(nr, { stamps: n });
    tx.set(er, { stamps: e });
    return { request: record, created: true };
  });
}
export async function getPickupRequest(
  id: string,
): Promise<PickupRequestRecord | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!hasFirebase)
    return structuredClone(demoStore().requests.get(id) ?? null);
  const record = await db().collection(pickupRequestCollection).doc(id).get();
  return record.exists ? (record.data() as PickupRequestRecord) : null;
}
export async function listPickupRequests(): Promise<PickupRequestRecord[]> {
  const records = !hasFirebase
    ? [...demoStore().requests.values()]
    : (await db().collection(pickupRequestCollection).get()).docs.map(
        (d) => d.data() as PickupRequestRecord,
      );
  return structuredClone(records).sort((a, b) => b.createdAtMs - a.createdAtMs);
}
/** Pure synchronous mutator: no email/provider side effects inside retried transactions. */
export async function mutatePickupRequest(
  id: string,
  change: (record: PickupRequestRecord) => PickupRequestRecord,
): Promise<PickupRequestRecord> {
  if (!hasFirebase) {
    const store = demoStore(),
      current = store.requests.get(id);
    if (!current) throw new PickupRequestError("Request not found.", 404);
    const next = change(structuredClone(current));
    store.requests.set(id, structuredClone(next));
    return next;
  }
  const firestore = db(),
    ref = firestore.collection(pickupRequestCollection).doc(id);
  return firestore.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (!old.exists) throw new PickupRequestError("Request not found.", 404);
    const next = change(old.data() as PickupRequestRecord);
    tx.set(ref, next);
    return next;
  });
}
