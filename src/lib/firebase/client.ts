/**
 * Client-side Firebase initialization (browser only).
 *
 * In STUB mode (no public config), `getFirebaseAuth()` returns null
 * and the auth UI falls back to the stub flow: the magic link sent
 * by /api/auth/send-link is logged to the dev console with a clickable
 * URL pointing at /api/auth/callback?stub=1&email=<email>.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { firebasePublicConfig, hasFirebaseClient } from "@/lib/env";

let cachedApp: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!hasFirebaseClient) return null;
  if (cachedApp) return cachedApp;

  // initializeApp throws on hot-reload if called twice — reuse the
  // existing instance when one is present in getApps().
  const existing = getApps()[0];
  cachedApp =
    existing ??
    initializeApp({
      apiKey: firebasePublicConfig.apiKey,
      authDomain: firebasePublicConfig.authDomain,
      projectId: firebasePublicConfig.projectId,
      storageBucket: firebasePublicConfig.storageBucket,
      messagingSenderId: firebasePublicConfig.messagingSenderId,
      appId: firebasePublicConfig.appId,
    });
  return cachedApp;
}

/**
 * Returns the browser Firebase Auth instance, or null in stub mode.
 * Callers must handle the null case — typically by branching to the
 * stub flow that just calls /api/auth/send-link with the email.
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export { hasFirebaseClient };
