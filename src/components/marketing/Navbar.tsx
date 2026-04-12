import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const navLinks = [
  { label: "Fleet", href: "/fleet", active: true },
  { label: "Rates", href: "/rates" },
  { label: "Locations", href: "/locations" },
  { label: "Terms", href: "/terms" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl bg-gradient-to-b from-surface-container-high to-transparent">
      <nav className="flex justify-between items-center px-8 py-6 max-w-none w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Icon name="construction" className="text-primary text-3xl" />
          <span className="text-2xl font-bold tracking-widest text-primary font-headline uppercase">
            ALAMO CITY
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10 font-headline tracking-tighter uppercase text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.active
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-gray-400 hover:text-white transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/book"
          className="bg-primary text-on-primary px-6 py-2 font-bold tracking-widest hover:bg-primary-action hover:text-white transition-all duration-300 active:scale-90 font-headline text-sm"
        >
          RENT NOW
        </Link>
      </nav>
    </header>
  );
}
