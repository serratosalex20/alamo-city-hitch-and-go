/**
 * Server-side Firebase initialization for booking persistence and document storage.
 * Authentication uses the application email-link/session implementation; Firebase
 * Auth must not be imported here because every booking route loads this module.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
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
