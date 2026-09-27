"use client";

/**
 * /sign-in — magic-link request form.
 *
 * Client Component because it owns local form state and posts to the API
 * route. On success it navigates to /sign-in/sent and passes the dev link
 * (when present) so the confirmation page can display a clickable shortcut.
 *
 * Styling honors the Industrial Editorial system from src/app/globals.css.
 *
 * `useSearchParams()` requires a Suspense boundary in Next 15+ to avoid
 * a static-prerender bailout. The page export wraps the inner form in
 * <Suspense> so the build can prerender the shell and hydrate the form
 * with the search params on the client.
 */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-token": "Your sign-in link was missing its token. Request a new one below.",
  "invalid-or-expired":
    "That sign-in link is no longer valid (links expire after 10 minutes). Request a fresh one.",
};

function SignInInner() {
  const router = useRouter();
  const search = useSearchParams();
  const initialError = search.get("error");

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? ERROR_MESSAGES[initialError] ?? "Sign-in failed. Try again." : null,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string; devLink?: string };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not send sign-in link. Try again.");
        return;
      }

      const qs = new URLSearchParams({ email });
      if (data.devLink) qs.set("devLink", data.devLink);
      router.push(`/sign-in/sent?${qs.toString()}`);
    } catch (err) {
      console.error(err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
      <section
        className="w-full max-w-md bg-surface-container-low border border-outline-variant/15 p-8 md:p-12"
        aria-labelledby="sign-in-heading"
      >
        <div className="flex items-center gap-3 mb-6" aria-hidden="true">
          <div className="h-[2px] w-10 bg-primary" />
          <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
            Account Access
          </span>
        </div>

        <h1
          id="sign-in-heading"
          className="font-teko text-5xl md:text-6xl font-bold uppercase leading-[0.9] tracking-tight mb-4"
        >
          Sign In
        </h1>
        <p className="text-on-surface-variant text-base font-light mb-8 leading-relaxed">
          No password. Enter your email and we&apos;ll send you a one-time sign-in link
          that&apos;s good for ten minutes.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <label htmlFor="email" className="font-headline uppercase tracking-widest text-xs font-bold text-on-surface">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="ghost-border bg-surface-container px-4 py-3 text-on-surface text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={submitting}
          />

          {error && (
            <p role="alert" className="text-error text-sm font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || email.length === 0}
            className="mt-2 bg-primary-action text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-headline font-black tracking-widest uppercase px-8 py-4 text-base flex items-center justify-center min-h-[44px]"
          >
            {submitting ? "Sending…" : "Send Sign-In Link"}
          </button>
        </form>

        <p className="mt-8 text-xs text-on-surface-variant font-light leading-relaxed">
          New here?{" "}
          <Link href="/book" className="text-primary hover:underline font-medium">
            Book a trailer
          </Link>{" "}
          and we&apos;ll create your account automatically at checkout.
        </p>
      </section>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <SignInInner />
    </Suspense>
  );
}
