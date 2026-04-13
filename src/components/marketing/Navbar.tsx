"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const navLinks = [
  { label: "Fleet", href: "/fleet" },
  { label: "Rates", href: "/rates" },
  { label: "Locations", href: "/locations" },
  { label: "Terms", href: "/terms" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl bg-gradient-to-b from-surface-container-high to-transparent"
      role="banner"
    >
      <nav
        className="flex justify-between items-center px-8 py-4 max-w-none w-full"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 min-h-[44px]"
          aria-label="Alamo City Hitch & Go Co. — Home"
        >
          <Icon name="construction" className="text-primary text-3xl" />
          <span className="text-2xl font-bold tracking-widest text-primary font-headline uppercase">
            ALAMO CITY
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2 font-headline tracking-tighter uppercase text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center px-4 transition-colors ${
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* CTA */}
          <Link
            href="/book"
            className="bg-primary text-on-primary px-6 py-3 min-h-[44px] font-bold tracking-widest hover:bg-primary-action hover:text-white transition-all duration-300 active:scale-90 font-headline text-sm flex items-center"
          >
            RENT NOW
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden bg-surface-container/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 space-y-1"
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
                className={`block min-h-[44px] py-3 px-4 font-headline uppercase tracking-wider text-sm transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-on-surface-variant hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
