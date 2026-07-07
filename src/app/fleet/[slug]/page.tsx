/**
 * /fleet/[slug] — per-trailer detail page.
 *
 * Sprint 3.4f. Closes audit finding PG-FLEET-07 (long-tail SEO gap on
 * fleet grid — every trailer needs its own indexable page). Also the
 * primary home for the per-trailer instructional video the owner is
 * filming (towing, set-up, safety, rules, dump-trailer bed operation).
 *
 * Pre-rendered at build time via generateStaticParams — every trailer
 * in the static fleet gets a fully-rendered HTML page in the build
 * output, so Google can crawl them without JS execution.
 *
 * The 14' Dump ships as "Coming Soon" in the fleet grid but still gets
 * its own detail page (indexable, bookable-when-live). Its page renders
 * the same way as bookable trailers, just without the Book CTA active.
 */

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { TrailerVideoPanel } from "@/components/marketing/TrailerVideoPanel";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import {
  ALL_DURATIONS,
  DURATION_LABELS,
  DURATION_SHORT,
  formatUsd,
} from "@/lib/booking/pricing";
import type { TrailerType } from "@/types/models";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─── Static params ──────────────────────────────────────────
// Every trailer in the fleet becomes a pre-rendered HTML page at build.
// New trailers land in `data/trailers.ts` and their detail page gets
// generated on the next deploy — no code change needed here.
export function generateStaticParams() {
  return trailers.map((t) => ({ slug: t.slug }));
}

// ─── Metadata ──────────────────────────────────────────────
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trailer = trailers.find((t) => t.slug === slug);
  if (!trailer) {
    return { title: "Trailer Not Found" };
  }
  const dailyRate = trailer.pricing.fullDay;
  return {
    title: `${trailer.name} Rental — San Antonio`,
    description: `Rent the ${trailer.name} in San Antonio starting at $${dailyRate}/day. ${trailer.description.slice(0, 120)}... Transparent block pricing. $200 refundable deposit. Same-day pickup.`,
    alternates: { canonical: `/fleet/${trailer.slug}` },
  };
}

// ─── Safety & rules content ────────────────────────────────
interface SafetyGroup {
  title: string;
  items: string[];
}

const safetyByType: Record<TrailerType, SafetyGroup[]> = {
  enclosed: [
    {
      title: "Before You Tow",
      items: [
        'Confirm 2-5/16" ball coupler and drop height match your truck',
        "Cross safety chains, lock coupler, connect the breakaway cable",
        "Verify all lights around the trailer — brake, turn, running",
      ],
    },
    {
      title: "On the Road",
      items: [
        "Texas trailer speed limit is 65 mph — obey it",
        "Wider turns than your truck alone; use both mirrors",
        "Avoid hard braking on downhill grades — this trailer is heavy loaded",
      ],
    },
    {
      title: "Loading",
      items: [
        "Distribute weight roughly 60% front / 40% rear over the axle",
        "Strap and block cargo — no exceptions, even for short trips",
        "GVWR is your ceiling — check the placard, don't guess",
      ],
    },
    {
      title: "On Return",
      items: [
        "Sweep the deck clean — avoids the $100 cleaning fee",
        "Return any tie-down straps you found inside",
        "No fuel required — no auxiliary engine on this trailer",
      ],
    },
  ],
  dump: [
    {
      title: "Before You Tow",
      items: [
        'Confirm 2-5/16" ball coupler and drop height match your truck',
        "Cross safety chains, lock coupler, connect the breakaway cable",
        "Verify hydraulic pump is disconnected — no accidental raise in transit",
      ],
    },
    {
      title: "On the Road",
      items: [
        "Texas trailer speed limit is 65 mph — obey it",
        "Wider turns than your truck alone; use both mirrors",
        "Avoid hard braking with a loaded dump — this trailer is heavy",
      ],
    },
    {
      title: "Loading",
      items: [
        "Load evenly — do NOT pile all the mass at the tailgate",
        "GVWR includes trailer + bed + load — no exceptions",
        "Wet dirt/gravel weighs 2x dry — use ticket weight when in doubt",
      ],
    },
    {
      title: "Dumping — read carefully",
      items: [
        "Only operate the lift on level ground. No slopes. No exceptions.",
        "Chock the wheels before you raise the bed",
        "Stand to the side of the bed, never behind it",
        "Lower the bed all the way down before you drive off",
      ],
    },
    {
      title: "On Return",
      items: [
        "Sweep the bed clean — avoids the $100 cleaning fee",
        "Hydraulic remote clipped back in its holder",
      ],
    },
  ],
  utility: [
    {
      title: "General Rules",
      items: [
        "Confirm hitch size, drop, and safety chains before you tow",
        "Verify all lights before leaving the yard",
        "Texas trailer speed limit is 65 mph",
        "Distribute weight over the axle; strap and block your load",
        "Sweep the deck on return to avoid the $100 cleaning fee",
      ],
    },
  ],
  car_hauler: [
    {
      title: "General Rules",
      items: [
        "Confirm hitch size, drop, and safety chains before you tow",
        "Verify all lights before leaving the yard",
        "Texas trailer speed limit is 65 mph",
        "Center the vehicle on the trailer; strap all four corners",
        "Sweep the deck on return to avoid the $100 cleaning fee",
      ],
    },
  ],
  flatbed: [
    {
      title: "General Rules",
      items: [
        "Confirm hitch size, drop, and safety chains before you tow",
        "Verify all lights before leaving the yard",
        "Texas trailer speed limit is 65 mph",
        "Distribute weight over the axle; strap and block your load",
        "Sweep the deck on return to avoid the $100 cleaning fee",
      ],
    },
  ],
  gooseneck: [
    {
      title: "General Rules",
      items: [
        "Confirm gooseneck coupler is seated and locked before you tow",
        "Verify all lights before leaving the yard",
        "Texas trailer speed limit is 65 mph",
        "Distribute weight over the axle; strap and block your load",
        "Sweep the deck on return to avoid the $100 cleaning fee",
      ],
    },
  ],
};

// ─── Page component ────────────────────────────────────────
export default async function TrailerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trailer = trailers.find((t) => t.slug === slug);
  if (!trailer) notFound();

  const otherTrailers = trailers.filter((t) => t.slug !== trailer.slug);
  const safetyGroups = safetyByType[trailer.type];
  const dimensionsLine = trailer.specs.heightInches
    ? `${trailer.specs.widthInches}" W × ${trailer.specs.lengthFeet}' L × ${trailer.specs.heightInches}" H`
    : `${trailer.specs.widthInches}" W × ${trailer.specs.lengthFeet}' L`;
  const isBookable = trailer.status === "available";

  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="min-h-screen pt-24 pb-24 px-6 md:px-8 max-w-6xl mx-auto"
      >
        {/* ─── Breadcrumb ─────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-headline uppercase tracking-widest mb-8 text-on-surface-variant"
        >
          <Link href="/fleet" className="hover:text-primary transition-colors">
            Fleet
          </Link>
          <Icon name="chevron_right" className="text-sm" aria-hidden="true" />
          <span className="text-on-surface">{trailer.name}</span>
        </nav>

        {/* ─── Hero ───────────────────────────────────────── */}
        <section className="grid md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12 mb-16">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-surface-container overflow-hidden">
            <Image
              src={trailer.imageUrl}
              alt={`${trailer.name} — available for rental in San Antonio`}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
              priority
            />
            {trailer.badge && (
              <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-primary-action/80 backdrop-blur-md text-white border border-primary/30 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter">
                  {trailer.badge}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-4" aria-hidden="true">
              <div className="h-[2px] w-12 bg-primary" />
              <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
                Rental Detail
              </span>
            </div>
            <h1 className="font-teko text-5xl md:text-6xl font-bold tracking-tighter uppercase leading-[0.9] mb-4">
              {trailer.name}
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg font-light leading-relaxed mb-8">
              {trailer.description}
            </p>

            {/* Quick specs */}
            <dl className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-outline-variant/15">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  Full Day
                </dt>
                <dd className="text-2xl font-teko font-bold text-primary">
                  ${trailer.pricing.fullDay}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  Half Day
                </dt>
                <dd className="text-2xl font-teko font-bold text-on-surface">
                  ${trailer.pricing.halfDay}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  Deposit (Hold)
                </dt>
                <dd className="text-2xl font-teko font-bold text-on-surface">
                  ${trailer.deposit}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  GVWR
                </dt>
                <dd className="text-2xl font-teko font-bold text-on-surface">
                  {trailer.specs.gvwr.toLocaleString()}
                  <span className="text-sm ml-1 text-on-surface-variant">lbs</span>
                </dd>
              </div>
            </dl>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isBookable ? (
                <Link
                  href={`/book?trailer=${trailer.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-3 bg-primary-action text-white px-6 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:brightness-110 transition-all"
                >
                  Rent This Trailer
                  <Icon name="arrow_forward" className="text-base" />
                </Link>
              ) : (
                <div className="flex-1 inline-flex items-center justify-center gap-3 bg-surface-container border border-outline-variant/15 text-on-surface-variant px-6 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base">
                  {trailer.badge ?? "Coming Soon"}
                </div>
              )}
              <Link
                href="/rates"
                className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-white px-6 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:bg-white/10 transition-all"
              >
                See Full Rates
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Instructional Video ────────────────────────── */}
        <section aria-labelledby="video-heading" className="mb-16">
          <div className="flex items-baseline gap-4 mb-6">
            <span className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              Video
            </span>
            <h2
              id="video-heading"
              className="font-headline uppercase tracking-tight text-2xl md:text-3xl font-bold text-on-surface"
            >
              How to Tow, Set Up &amp; Return
            </h2>
          </div>
          <TrailerVideoPanel
            trailerName={trailer.name}
            videoUrl={trailer.instructionalVideoUrl}
            posterUrl={trailer.instructionalVideoPosterUrl}
          />
          <p className="text-on-surface-variant text-sm font-light leading-relaxed mt-4 max-w-3xl">
            Walk-through of hitch-up, cargo securement, on-road handling,
            {trailer.type === "dump" ? " safe hydraulic dump operation," : ""}
            {" "}and clean-return best practices — filmed on this exact trailer
            model. Watch before pickup so you can drive out of the yard ready.
          </p>
        </section>

        {/* ─── Full Specs ─────────────────────────────────── */}
        <section
          aria-labelledby="specs-heading"
          className="mb-16 border-t border-outline-variant/15 pt-12"
        >
          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              Specs
            </span>
            <h2
              id="specs-heading"
              className="font-headline uppercase tracking-tight text-2xl md:text-3xl font-bold text-on-surface"
            >
              The Numbers
            </h2>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-low border border-outline-variant/15 p-5">
              <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                Weight Rating
              </dt>
              <dd className="font-teko text-3xl font-bold text-on-surface">
                {trailer.specs.gvwr.toLocaleString()}{" "}
                <span className="text-sm text-on-surface-variant">lbs GVWR</span>
              </dd>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/15 p-5">
              <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                Payload
              </dt>
              <dd className="font-teko text-3xl font-bold text-on-surface">
                {trailer.specs.payload.toLocaleString()}{" "}
                <span className="text-sm text-on-surface-variant">lbs</span>
              </dd>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/15 p-5">
              <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                Hitch
              </dt>
              <dd className="font-teko text-2xl font-bold text-on-surface leading-tight">
                {trailer.specs.hitchSize}
              </dd>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/15 p-5">
              <dt className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                Dimensions
              </dt>
              <dd className="font-teko text-lg font-bold text-on-surface leading-tight">
                {dimensionsLine}
              </dd>
            </div>
          </dl>
        </section>

        {/* ─── Pricing Block Matrix ───────────────────────── */}
        <section
          aria-labelledby="pricing-heading"
          className="mb-16 border-t border-outline-variant/15 pt-12"
        >
          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              Pricing
            </span>
            <h2
              id="pricing-heading"
              className="font-headline uppercase tracking-tight text-2xl md:text-3xl font-bold text-on-surface"
            >
              Every Block, Every Price
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_DURATIONS.map((d) => {
              const price = trailer.pricing[d];
              const isTwoWeeks = d === "twoWeeks";
              return (
                <div
                  key={d}
                  className="bg-surface-container-low border border-outline-variant/15 p-5 flex flex-col"
                >
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                    {DURATION_SHORT[d]}
                  </span>
                  <span className="font-headline uppercase tracking-tight text-lg font-bold text-on-surface mb-3">
                    {DURATION_LABELS[d]}
                  </span>
                  <span className="font-teko text-4xl font-bold text-primary leading-none">
                    {formatUsd(price * 100)}
                  </span>
                  {isTwoWeeks && (
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 font-bold mt-3">
                      15 days · 1 free day
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-on-surface-variant text-sm font-light leading-relaxed mt-6 max-w-3xl">
            All rates in USD. Texas sales tax (Bexar County, 8.25%) applies to
            the rental fee. Refundable ${trailer.deposit} deposit is a
            pre-authorization hold on your card, not a charge.
          </p>
        </section>

        {/* ─── Safety & Rules ─────────────────────────────── */}
        <section
          aria-labelledby="safety-heading"
          className="mb-16 border-t border-outline-variant/15 pt-12"
        >
          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
              Safety
            </span>
            <h2
              id="safety-heading"
              className="font-headline uppercase tracking-tight text-2xl md:text-3xl font-bold text-on-surface"
            >
              Rules Before You Roll
            </h2>
          </div>
          <div className="space-y-8">
            {safetyGroups.map((group) => (
              <div
                key={group.title}
                className="grid md:grid-cols-[16rem_1fr] gap-4 md:gap-8"
              >
                <h3 className="font-headline uppercase tracking-tight text-lg font-bold text-on-surface">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <Icon
                        name="check_circle"
                        className="text-primary text-lg flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-on-surface-variant text-sm md:text-base font-light leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Final CTA ──────────────────────────────────── */}
        <section className="bg-surface-container-low border border-outline-variant/15 p-8 md:p-12 text-center">
          <h2 className="font-teko text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none mb-3">
            {isBookable ? "Ready to Pull & Go?" : "Coming Soon to the Yard"}
          </h2>
          <p className="text-on-surface-variant text-base font-light max-w-xl mx-auto mb-8 leading-relaxed">
            {isBookable
              ? "Book online in 60 seconds. Same-day pickup if it's in the yard."
              : "This trailer isn't in the yard yet — check back soon or browse what's available now."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isBookable ? (
              <Link
                href={`/book?trailer=${trailer.slug}`}
                className="inline-flex items-center justify-center gap-3 bg-primary-action text-white px-10 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:brightness-110 transition-all"
              >
                Rent This Trailer
                <Icon name="arrow_forward" className="text-base" />
              </Link>
            ) : (
              <Link
                href="/fleet"
                className="inline-flex items-center justify-center gap-3 bg-primary-action text-white px-10 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:brightness-110 transition-all"
              >
                Browse the Fleet
                <Icon name="arrow_forward" className="text-base" />
              </Link>
            )}
            <Link
              href="/rates"
              className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-white px-10 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:bg-white/10 transition-all"
            >
              See All Rates
            </Link>
          </div>
        </section>

        {/* ─── Other Trailers ─────────────────────────────── */}
        {otherTrailers.length > 0 && (
          <section
            aria-labelledby="others-heading"
            className="mt-16 border-t border-outline-variant/15 pt-12"
          >
            <h2
              id="others-heading"
              className="font-headline uppercase tracking-tight text-xl font-bold text-on-surface mb-6"
            >
              Other Trailers in the Fleet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherTrailers.map((t) => (
                <Link
                  key={t.slug}
                  href={`/fleet/${t.slug}`}
                  className="group flex items-center gap-4 bg-surface-container-low border border-outline-variant/15 p-4 hover:border-primary/30 transition-all"
                >
                  <div className="relative w-20 h-20 flex-shrink-0 bg-surface-container overflow-hidden">
                    <Image
                      src={t.imageUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-headline uppercase tracking-tight text-base font-bold text-on-surface truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      From ${t.pricing.halfDay} · Half Day
                    </p>
                  </div>
                  <Icon
                    name="arrow_forward"
                    className="text-on-surface-variant group-hover:text-primary transition-colors flex-shrink-0"
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
