/**
 * Server-side Firebase Admin initialization.
 *
 * Used in API routes for:
 *   - Generating sign-in links (server-side magic-link generation)
 *   - Verifying ID tokens after magic-link callback
 *   - Minting and verifying session cookies
 *
 * In STUB mode, `getFirebaseAdmin()` returns null and the auth API
 * routes synthesize fake links + tokens for local dev.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  firebaseAdminProjectId,
  firebaseAdminClientEmail,
  firebaseAdminPrivateKey,
  firebaseStorageBucket,
  hasFirebase,
} from "@/lib/env";

let cachedApp: App | null = null;

function getApp(): App | null {
  if (!hasFirebase) return null;
  if (cachedApp) return cachedApp;

  // Admin SDK is single-instance per process; reuse if hot-reload already booted one.
  const existing = getApps()[0];
  cachedApp =
    existing ??
    initializeApp({
      credential: cert({
        projectId: firebaseAdminProjectId,
        clientEmail: firebaseAdminClientEmail,
        privateKey: firebaseAdminPrivateKey,
      }),
      storageBucket: firebaseStorageBucket,
    });
  return cachedApp;
}

/**
 * Returns the Firebase Admin Auth instance, or null in stub mode.
 * Server-only — never import this from a Client Component.
 */
export function getFirebaseAdmin(): Auth | null {
  const app = getApp();
  return app ? getAuth(app) : null;
}

/** Returns Firestore for server-side booking persistence. */
export function getFirestoreAdmin(): Firestore | null {
  const app = getApp();
  return app ? getFirestore(app) : null;
}

/** Returns the private Firebase Storage bucket used for customer documents. */
export function getStorageBucket() {
  const app = getApp();
  if (!app || !firebaseStorageBucket) return null;
  return getStorage(app).bucket(firebaseStorageBucket);
}

export { hasFirebase };
