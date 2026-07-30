/**
 * /about — Owner story, mission, vision, who we serve.
 *
 * Sprint 3.4g. Built as a scaffold per owner direction 2026-05-22:
 * placeholders for owner photos + bios (graceful empty-state cards,
 * NOT broken <img> refs) and tasteful copy that owner can tighten
 * with real values without fighting the page structure.
 *
 * Founder names are LIVE (John Brandon Martinez, Kelby Pape — supplied
 * 2026-07-27). Only the group photo is still pending:
 *   - Save it as public/about/founders.png (single photo, both founders;
 *     John is on the left, Kelby on the right)
 *   - In <FoundersBlock>, swap the pending-state frame contents for the
 *     <Image> shown in that component's doc comment
 *
 * JSON-LD note: Organization schema is intentionally not duplicated here.
 * The homepage already publishes a LocalBusiness JSON-LD describing the
 * same legal entity (src/app/page.tsx). When real founder names land,
 * extend the homepage block with a founder[] Person array — the homepage
 * is the canonical entity surface.
 *
 * E-E-A-T positioning: real owner photos + named bios are the single
 * strongest trust signal on the site. Until they land this page still
 * earns its keep with story + mission + who-we-serve specificity, but
 * the photo drop is what moves the needle on conversion.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "About",
  description:
    "Family-owned trailer rental built in San Antonio. Our story, mission, vision, and who we serve — homeowners, contractors, movers, landscapers, and weekend warriors across the Alamo City metro.",
  alternates: { canonical: "/about" },
};

interface ServedAudience {
  title: string;
  detail: string;
}

const audiences: ServedAudience[] = [
  {
    title: "Homeowners",
    detail:
      "Moving across town, refreshing a yard, hauling a project's worth of debris to the dump. Half Day blocks were built for these jobs.",
  },
  {
    title: "Contractors & Trades",
    detail:
      "Hauling tools, materials, or jobsite leftovers. Trailers stay clean and the booking takes 60 seconds — fewer interruptions to your day.",
  },
  {
    title: "Landscapers & Yard Pros",
    detail:
      "Mulch, sod, brush, gravel, dump loads. The 14' dump trailer raises and lowers from the cab — no shoveling at the end of the run.",
  },
  {
    title: "DIY Movers & Weekend Warriors",
    detail:
      "Hunting trips, big-ticket pickups, projects that need a real trailer for a real day. Rent it for the job and give it back — way cheaper than owning.",
  },
];

/**
 * Founders — John Brandon Martinez and Kelby Pape (names supplied by the
 * founders 2026-07-27, ordered to match their group photo: John on the
 * left, Kelby on the right).
 *
 * The photo itself hasn't been delivered as a file yet, so the frame
 * renders a graceful pending state. When it lands, save it as
 * public/about/founders.png and replace the frame's contents with:
 *
 *   <Image src="/about/founders.png"
 *     alt="Founders John Brandon Martinez and Kelby Pape at the Alamo City Hitch & Go yard in San Antonio"
 *     fill sizes="(max-width: 768px) 100vw, 896px" className="object-cover" />
 */
const founders = [
  { name: "John Brandon Martinez", role: "Co-Founder" },
  { name: "Kelby Pape", role: "Co-Founder" },
];

function FoundersBlock() {
  return (
    <div className="flex flex-col">
      {/* Group photo frame — pending state until founders.png lands */}
      <div
        className="relative aspect-[16/10] bg-surface-container border border-outline-variant/15 flex items-center justify-center overflow-hidden"
        role="img"
        aria-label="Founders John Brandon Martinez and Kelby Pape — photo pending"
      >
        <Icon
          name="group"
          className="text-[8rem] text-on-surface-variant/20"
          aria-hidden="true"
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" aria-hidden="true" />
          <span className="font-headline uppercase tracking-[0.25em] text-[10px] text-on-surface-variant/70 font-bold">
            Photo Coming Soon
          </span>
        </div>
      </div>

      {/* Names — order mirrors the photo (left to right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
        {founders.map((f) => (
          <div key={f.name} className="space-y-1">
            <h3 className="font-headline uppercase tracking-tight text-xl font-bold text-on-surface">
              {f.name}
            </h3>
            <p className="font-headline uppercase tracking-[0.25em] text-[10px] text-primary font-bold">
              {f.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="min-h-screen pt-28 pb-24 px-6 md:px-8 max-w-4xl mx-auto"
      >
        {/* ─── Hero ─────────────────────────────────────── */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6" aria-hidden="true">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
              About Us
            </span>
          </div>
          <h1 className="font-teko text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] mb-6">
            Family-Owned.
            <br />
            Built in San Antonio.
          </h1>
          <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl">
            We rent the trailers we&apos;d want to rent. Clean equipment,
            transparent prices, and a checkout that takes 60 seconds — not 60
            minutes of phone tag.
          </p>
        </header>

        {/* ─── The Owners ────────────────────────────────── */}
        <section aria-labelledby="owners-heading" className="mb-20">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              01
            </span>
            <h2
              id="owners-heading"
              className="font-headline uppercase tracking-tight text-3xl md:text-4xl font-bold text-on-surface"
            >
              The Owners
            </h2>
          </div>
          <FoundersBlock />
        </section>

        {/* ─── Our Story ─────────────────────────────────── */}
        <section
          aria-labelledby="story-heading"
          className="mb-20 border-t border-outline-variant/15 pt-12"
        >
          <div className="grid md:grid-cols-[3rem_1fr] gap-4 md:gap-8">
            <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              02
            </div>
            <div>
              <h2
                id="story-heading"
                className="font-headline uppercase tracking-tight text-3xl md:text-4xl font-bold text-on-surface mb-5"
              >
                Our Story
              </h2>
              <p className="text-on-surface-variant text-lg font-light leading-relaxed">
                We started Alamo City Hitch &amp; Go because every time we
                needed a trailer, the rental experience was a mess — surprise
                fees, paper-only checkout, dirty equipment, nobody answering
                the phone. We thought San Antonio deserved better. So we
                bought a fleet, set up shop, and built a booking flow that
                doesn&apos;t waste your time.
              </p>
              <p className="text-on-surface-variant text-lg font-light leading-relaxed mt-4">
                Same-day pickup. Honest block prices, posted on the page. No
                quote forms. Pull and go.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Mission ────────────────────────────────────── */}
        <section
          aria-labelledby="mission-heading"
          className="mb-20 border-t border-outline-variant/15 pt-12"
        >
          <div className="grid md:grid-cols-[3rem_1fr] gap-4 md:gap-8">
            <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              03
            </div>
            <div>
              <h2
                id="mission-heading"
                className="font-headline uppercase tracking-tight text-3xl md:text-4xl font-bold text-on-surface mb-5"
              >
                Mission
              </h2>
              <p className="text-on-surface-variant text-lg font-light leading-relaxed">
                Give San Antonio homeowners, contractors, movers, and weekend
                warriors transparent, fast, well-maintained trailer rentals —
                without the quote-form runaround, the surprise fees, or the
                apologetic &ldquo;we&apos;ll get back to you.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* ─── Vision ─────────────────────────────────────── */}
        <section
          aria-labelledby="vision-heading"
          className="mb-20 border-t border-outline-variant/15 pt-12"
        >
          <div className="grid md:grid-cols-[3rem_1fr] gap-4 md:gap-8">
            <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              04
            </div>
            <div>
              <h2
                id="vision-heading"
                className="font-headline uppercase tracking-tight text-3xl md:text-4xl font-bold text-on-surface mb-5"
              >
                Vision
              </h2>
              <p className="text-on-surface-variant text-lg font-light leading-relaxed">
                Become the trailer rental San Antonio trusts by default.
                Same-day pickup. Honest block prices, posted in public.
                Trailers that show up clean, ready, and rated for the load.
                No middleman, no franchise, no quote-form gauntlet.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Who We Serve ──────────────────────────────── */}
        <section
          aria-labelledby="who-heading"
          className="mb-20 border-t border-outline-variant/15 pt-12"
        >
          <div className="grid md:grid-cols-[3rem_1fr] gap-4 md:gap-8">
            <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              05
            </div>
            <div>
              <h2
                id="who-heading"
                className="font-headline uppercase tracking-tight text-3xl md:text-4xl font-bold text-on-surface mb-8"
              >
                Who We Serve
              </h2>
              <ul className="space-y-6">
                {audiences.map((a) => (
                  <li key={a.title} className="flex gap-4">
                    <Icon
                      name="check_circle"
                      className="text-primary text-2xl flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-headline uppercase tracking-tight text-xl font-bold text-on-surface mb-1">
                        {a.title}
                      </h3>
                      <p className="text-on-surface-variant text-base font-light leading-relaxed">
                        {a.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── CTA ────────────────────────────────────────── */}
        <section className="mt-16 bg-surface-container-low border border-outline-variant/15 p-8 md:p-12 text-center">
          <h2 className="font-teko text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none mb-3">
            Ready to Pull &amp; Go?
          </h2>
          <p className="text-on-surface-variant text-base font-light max-w-xl mx-auto mb-8 leading-relaxed">
            Book online in 60 seconds. Same-day pickup if it&apos;s in the yard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/fleet"
              className="inline-flex items-center justify-center gap-3 bg-primary-action text-white px-10 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:brightness-110 transition-all"
            >
              Browse The Fleet
              <Icon name="arrow_forward" className="text-base" />
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-white px-10 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:bg-white/10 transition-all"
            >
              Start a Booking
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
