/**
 * Typed environment variable reader.
 *
 * The Sprint 2 design runs in two modes:
 *   - REAL mode  — env vars are populated, real Firebase + Stripe calls fire.
 *   - STUB mode  — env vars are empty/missing, adapters return fakes.
 *
 * `hasFirebase` and `hasStripe` are the only gates the rest of the app
 * should branch on. Callers MUST NOT read process.env directly.
 */

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : undefined;
}

// ─── Firebase (server-side admin SDK) ────────────────────
export const firebaseAdminProjectId = read("FIREBASE_ADMIN_PROJECT_ID");
export const firebaseAdminClientEmail = read("FIREBASE_ADMIN_CLIENT_EMAIL");
// Newlines in the private key arrive as literal "\n" through env vars; restore them.
export const firebaseAdminPrivateKey = read("FIREBASE_ADMIN_PRIVATE_KEY")?.replace(
  /\\n/g,
  "\n",
);

// ─── Firebase (client-side SDK) ──────────────────────────
export const firebasePublicConfig = {
  apiKey: read("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: read("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: read("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: read("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: read("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: read("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

// ─── Stripe ──────────────────────────────────────────────
export const stripeSecretKey = read("STRIPE_SECRET_KEY");
export const stripePublishableKey = read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
export const stripeWebhookSecret = read("STRIPE_WEBHOOK_SECRET");

// ─── App ─────────────────────────────────────────────────
/**
 * Runtime origin of THIS deployment. Env-driven on purpose: auth
 * redirects and magic-link callbacks must resolve against whatever
 * host actually served the request, so preview deployments work.
 */
export const appUrl = read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";

/**
 * Canonical public origin of the business. Deliberately NOT env-driven.
 *
 * Every SEO surface — canonical tags, sitemap URLs, robots host, OG /
 * Twitter image URLs, LocalBusiness JSON-LD — must point at the one
 * branded domain, identically, from every deployment. Wiring these to
 * an env var is a footgun with two failure modes, one of which we hit:
 *
 *   1. Preview deployments emit canonicals pointing at themselves,
 *      inviting Google to index throwaway preview URLs.
 *   2. A stale NEXT_PUBLIC_APP_URL silently de-brands the whole site.
 *      Found 2026-07-26: production was serving
 *      <link rel="canonical" href="https://alamo-city-hitch-and-go.vercel.app">
 *      on every page, telling Google the vercel.app host was the real
 *      site and suppressing alamocityhitchandgo.com in search results.
 *
 * If the business ever changes domains, change it here — one line.
 */
export const siteUrl = "https://www.alamocityhitchandgo.com";

// ─── Auth ────────────────────────────────────────────────
/**
 * HMAC signing key for session + magic-link tokens.
 * Production deployments MUST set this. Dev falls back to a constant
 * so the build doesn't break before keys are configured — but every
 * stub-mode token is therefore predictable and must never be trusted
 * across machines.
 */
const DEV_FALLBACK_SECRET =
  "dev-only-fallback-secret-do-not-use-in-production-rotate-via-AUTH_SECRET";
export const authSecret = read("AUTH_SECRET") ?? DEV_FALLBACK_SECRET;
export const hasProductionAuthSecret = read("AUTH_SECRET") !== undefined;

// ─── Mode gates ──────────────────────────────────────────
/**
 * True when the Firebase Admin SDK has enough config to make real calls.
 * Magic-link sending + session cookie minting require all three.
 */
export const hasFirebase = Boolean(
  firebaseAdminProjectId && firebaseAdminClientEmail && firebaseAdminPrivateKey,
);

/**
 * True when the Firebase client SDK has enough config for browser auth.
 * Different gate from admin because public keys live in different env vars.
 */
export const hasFirebaseClient = Boolean(
  firebasePublicConfig.apiKey && firebasePublicConfig.authDomain && firebasePublicConfig.projectId,
);

/**
 * True when the Stripe server SDK has enough config to create real
 * PaymentIntents. Webhook secret is a separate gate (only needed for
 * the /api/webhooks/stripe route).
 */
export const hasStripe = Boolean(stripeSecretKey);
