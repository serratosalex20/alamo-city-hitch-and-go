import Link from "next/link";

/**
 * Footer — minimal site chrome.
 *
 * Audit 2026-05-15 fix: removed the /locations link (route was 404 and the
 * business operates from a single yard for now). Aligned with the Navbar's
 * three primary destinations.
 *
 * NAP block deliberately omits phone + street address until the business
 * has both a published business line and a real customer-facing address.
 * Showing "Pending" placeholders to customers reads worse than just stating
 * the city — when the owner is ready, add a real <address> block here and
 * mirror the values into the LocalBusiness JSON-LD in src/app/page.tsx.
 */

const footerLinks = [
  { label: "Fleet", href: "/fleet" },
  { label: "Rates", href: "/rates" },
  { label: "Terms", href: "/terms" },
  { label: "Book", href: "/book" },
];

export function Footer() {
  return (
    <footer
      className="w-full pt-12 pb-6 bg-surface-container-high border-t border-white/10"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Brand + locality */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <span className="text-lg font-black text-white font-headline tracking-widest uppercase">
            ALAMO CITY HITCH <span className="text-primary">&amp;</span> GO
          </span>
          <address className="not-italic font-body text-xs uppercase tracking-widest text-tertiary/80">
            San Antonio, Texas &nbsp;&middot;&nbsp; Heavy-Duty Reliability
          </address>
          <span className="font-body text-[10px] uppercase tracking-widest text-tertiary/50 mt-1">
            &copy; {new Date().getFullYear()} Alamo City Hitch &amp; Go Co LLC
          </span>
        </div>

        {/* Nav */}
        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-6 md:gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-xs uppercase tracking-widest text-tertiary/70 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Agency attribution — hairline divider + low-contrast credit */}
      <div className="max-w-7xl mx-auto px-8 md:px-12 mt-10 pt-5 border-t border-white/5">
        <p className="text-center font-body text-[10px] uppercase tracking-[0.25em] text-tertiary/50">
          Built by{" "}
          <a
            href="https://digitalaiads.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tertiary/80 hover:text-primary transition-colors"
          >
            Digital AI Ads
          </a>
        </p>
      </div>
    </footer>
  );
}
