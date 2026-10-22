import { createHash } from "node:crypto";
import { getFirestoreAdmin } from "@/lib/firebase/admin";
import { bookingCollection, hasFirebase, isDemoEnvironment } from "@/lib/env";
import { buildProfile, type CustomerProfile, type ProfileInput } from "./profile";

const collection = `${bookingCollection}_customers`;
const root = globalThis as typeof globalThis & { __acgProfiles?: Map<string, CustomerProfile> };
function demo() {
  if (!isDemoEnvironment) throw new Error("Customer storage is unavailable.");
  return root.__acgProfiles ??= new Map<string, CustomerProfile>();
}
function key(email: string) { return createHash("sha256").update(email.trim().toLowerCase()).digest("hex"); }
function database() {
  const db = getFirestoreAdmin();
  if (!db) throw new Error("Customer storage is unavailable.");
  return db;
}
export async function getProfile(email: string): Promise<CustomerProfile | null> {
  if (!hasFirebase) return structuredClone(demo().get(key(email)) ?? null);
  const record = await database().collection(collection).doc(key(email)).get();
  return record.exists ? record.data() as CustomerProfile : null;
}
export async function saveProfile(email: string, input: ProfileInput): Promise<CustomerProfile> {
  const now = new Date().toISOString();
  if (!hasFirebase) {
    const next = buildProfile(email, input, await getProfile(email), now);
    demo().set(key(email), structuredClone(next));
    return next;
  }
  const db = database();
  const ref = db.collection(collection).doc(key(email));
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const previous = snapshot.exists ? snapshot.data() as CustomerProfile : null;
    const next = buildProfile(email, input, previous, now);
    transaction.set(ref, next);
    if (!previous || previous.emailMarketing !== next.emailMarketing) {
      transaction.set(ref.collection("consentHistory").doc(), {
        emailMarketing: next.emailMarketing, recordedAt: now, text: next.consentText, source: "customer_portal",
      });
    }
    return next;
  });
}
export async function listProfiles(): Promise<CustomerProfile[]> {
  if (!hasFirebase) return structuredClone([...demo().values()]);
  const snapshot = await database().collection(collection).orderBy("updatedAt", "desc").limit(500).get();
  return snapshot.docs.map((doc) => doc.data() as CustomerProfile);
}
