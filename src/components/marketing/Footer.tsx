import Link from "next/link";

const footerLinks = [
  { label: "Fleet", href: "/fleet" },
  { label: "Rates", href: "/rates" },
  { label: "Locations", href: "/locations" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer
      className="w-full py-12 bg-surface-container-high border-t border-white/10"
      role="contentinfo"
    >
      <div className="flex flex-col md:flex-row justify-between items-center px-12 gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-lg font-black text-white font-headline tracking-widest uppercase">
            ALAMO CITY HITCH &amp; GO CO.
          </span>
          <span className="font-body text-xs uppercase tracking-widest text-tertiary/60">
            &copy; {new Date().getFullYear()} ALAMO CITY HITCH &amp; GO CO.
            HEAVY-DUTY RELIABILITY.
          </span>
        </div>
        <nav aria-label="Footer navigation" className="flex gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-xs uppercase tracking-widest text-tertiary/60 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
