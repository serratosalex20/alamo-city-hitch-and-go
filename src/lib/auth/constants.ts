/**
 * Pure constants for the auth system — no Node-runtime imports.
 *
 * This file exists so the Edge runtime (middleware.ts) can import the
 * session cookie name without dragging `node:crypto` into its bundle.
 * Anything that lives here MUST stay free of Node-only modules.
 */

export const SESSION_COOKIE_NAME = "acg_session";
