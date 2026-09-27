"use client";

/**
 * /sign-in/sent — confirmation page after a sign-in link is dispatched.
 *
 * Client Component because we need to read URL search params (`useSearchParams`
 * only works in Client Components). In development, the API route returns
 * the magic link in the JSON body so we can render it here as a one-click
 * shortcut for testing — that branch never fires in production.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SentInner() {
  const search = useSearchParams();
  const email = search.get("email") ?? "your email";
  const devLink = search.get("devLink");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
      <section
        className="w-full max-w-md bg-surface-container-low border border-outline-variant/15 p-8 md:p-12"
        aria-labelledby="sent-heading"
      >
        <div className="flex items-center gap-3 mb-6" aria-hidden="true">
          <div className="h-[2px] w-10 bg-primary" />
          <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
            Check Your Inbox
          </span>
        </div>

        <h1
          id="sent-heading"
          className="font-teko text-5xl md:text-6xl font-bold uppercase leading-[0.9] tracking-tight mb-4"
        >
          Link Sent
        </h1>
        <p className="text-on-surface-variant text-base font-light leading-relaxed mb-2">
          We sent a sign-in link to <strong className="text-on-surface">{email}</strong>.
          Click the link in that email within the next ten minutes to finish signing in.
        </p>
        <p className="text-on-surface-variant text-xs font-light leading-relaxed">
          Didn&apos;t get it? Check your spam folder or{" "}
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            request a new link
          </Link>
          .
        </p>

        {devLink && (
          <div className="mt-6 border-t border-outline-variant/15 pt-6">
            <p className="font-headline uppercase tracking-widest text-xs font-bold text-on-surface-variant mb-3">
              Dev Shortcut
            </p>
            <p className="text-xs text-on-surface-variant font-light leading-relaxed mb-3">
              Local dev build — the magic link is also exposed here so you can sign in
              without checking email. This block does not render in production.
            </p>
            <Link
              href={devLink}
              className="inline-block bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-headline font-bold tracking-widest uppercase border-b-2 border-primary px-6 py-3 text-sm"
            >
              Open Sign-In Link
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default function SentPage() {
  // useSearchParams requires a Suspense boundary in Next 15+.
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <SentInner />
    </Suspense>
  );
}
