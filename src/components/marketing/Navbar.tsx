"use client";

/**
 * Navbar — primary site chrome.
 *
 * Direction A: "Glued Glass-on-Ink" (per the comparison mockup at
 * deliverables/mockups/navbar-comparison.html).
 *
 * Design choices:
 *   - Sticky at the top edge with a glass-blur background. Ink at 70%
 *     opacity reads as neutral graphite — no longer competes with the
 *     navy interior of the brand badge for attention.
 *   - Hairline bottom border at ~5% white defines the navbar edge
 *     without adding visual weight.
 *   - Logo-only on mobile (the badge IS the identity at small sizes).
 *     Logo + "Alamo City Hitch & Go" wordmark on >=md (no "Co." —
 *     dropped per audit 2026-05-20 owner Q&A).
 *   - Rounded-full crimson pill for the Rent Now CTA — feels more
 *     premium than a square button and matches current Awwwards /
 *     Dribbble navbar patterns.
 *   - Tightened vertical padding (py-3) so the bar sits at ~56-60px,
 *     leaving more room for hero content below.
 *
 * Preserved from prior versions:
 *   - Session-aware Sign In / Account link via /api/auth/me (Sprint 2)
 *   - usePathname() driven aria-current on the active nav link
 *   - Mobile hamburger menu with the same nav links + session link
 *   - Three-state sessionEmail (undefined = loading, null = signed out,
 *     string = signed in) to avoid the "Sign In -> Account" flash
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const navLinks = [
  { label: "Fleet", href: "/fleet" },
  { label: "Rates", href: "/rates" },
  { label: "Terms", href: "/terms" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { email: string | null }) => {
        if (!cancelled) setSessionEmail(data.email);
      })
      .catch(() => {
        if (!cancelled) setSessionEmail(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header
      className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-2xl border-b border-white/5"
      role="banner"
    >
      <nav
        className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 max-w-7xl mx-auto"
        aria-label="Main navigation"
      >
        {/* Brand: logo + wordmark (wordmark hidden on mobile) */}
        <Link
          href="/"
          className="flex items-center gap-2.5 min-h-[44px] -ml-1 pl-1 pr-2 hover:opacity-90 transition-opacity"
          aria-label="Alamo City Hitch & Go — Home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={1500}
            height={1312}
            className="w-10 md:w-11 h-auto"
            priority
          />
          <span className="hidden md:inline-block font-teko font-bold text-2xl tracking-[0.02em] uppercase text-white leading-none whitespace-nowrap">
            Alamo City Hitch <span className="text-primary">&amp;</span> Go
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 font-headline tracking-[0.15em] uppercase text-xs font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`min-h-[44px] flex items-center px-3.5 transition-colors ${
                  isActive ? "text-white" : "text-on-surface-variant hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right cluster: session link, CTA, mobile hamburger */}
        <div className="flex items-center gap-2">
          {/* Session-aware Sign In / Account (desktop only). Hidden while
              loading to avoid a "Sign In" -> "Account" flash. */}
          {sessionEmail === null && (
            <Link
              href="/sign-in"
              className="hidden md:flex min-h-[44px] items-center px-3 font-headline tracking-[0.15em] uppercase text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}
          {typeof sessionEmail === "string" && (
            <Link
              href="/account"
              className="hidden md:flex min-h-[44px] items-center gap-1.5 px-3 font-headline tracking-[0.15em] uppercase text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
              aria-label={`Account — signed in as ${sessionEmail}`}
            >
              <Icon name="person" className="text-base" />
              Account
            </Link>
          )}

          {/* Primary CTA — rounded-full pill in Alamo Crimson */}
          <Link
            href="/book"
            className="bg-primary-action text-white px-5 py-2.5 rounded-full font-headline font-bold tracking-[0.15em] uppercase text-xs hover:brightness-110 active:scale-[0.97] transition-all min-h-[40px] inline-flex items-center whitespace-nowrap"
          >
            Rent Now
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-primary transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer — opens beneath the navbar */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden bg-background/95 backdrop-blur-2xl border-t border-white/5 px-4 py-3 space-y-1"
          role="menu"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`block min-h-[44px] py-3 px-4 font-headline uppercase tracking-[0.15em] text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-white/5"
                    : "text-on-surface-variant hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {sessionEmail === null && (
            <Link
              href="/sign-in"
              role="menuitem"
              onClick={() => setMobileMenuOpen(false)}
              className="block min-h-[44px] py-3 px-4 font-headline uppercase tracking-[0.15em] text-sm font-medium text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 mt-2 pt-4"
            >
              Sign In
            </Link>
          )}
          {typeof sessionEmail === "string" && (
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setMobileMenuOpen(false)}
              className="block min-h-[44px] py-3 px-4 font-headline uppercase tracking-[0.15em] text-sm font-medium text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 mt-2 pt-4"
            >
              Account
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
