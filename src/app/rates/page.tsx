/**
 * /rates — public pricing transparency page.
 *
 * Audit 2026-05-15 fix: the Navbar linked to /rates but the page didn't exist
 * (404 in production). Every competitor in the San Antonio market either hides
 * pricing behind a "call for a quote" form or shows vague tiers — publishing
 * the full price matrix is a positioning play, not just a navigation fix.
 *
 * Server Component on purpose: pure read of `trailers` from src/lib/data,
 * zero interactivity, zero JS shipped to the browser for the pricing block.
 * Reuses the Industrial Editorial design system from src/app/globals.css.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import { calculatePrice, formatUsd, ALL_DURATIONS, DURATION_LABELS } from "@/lib/booking/pricing";

export const metadata: Metadata = {
  title: "Rates",
  description:
    "Transparent trailer rental pricing in San Antonio. Enclosed and dump trailers in Half Day / Full Day / 3 Days / 2 Weeks blocks. No hidden fees.",
  alternates: { canonical: "/rates" },
};

export default function RatesPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-28 pb-24 px-6 md:px-8 max-w-6xl mx-auto">
        {/* Section header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6" aria-hidden="true">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
              Transparent Pricing
            </span>
          </div>
          <h1 className="font-teko text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] mb-6">
            Rates
          </h1>
          <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl">
            Pick a trailer, pick a block, see the total. No quote forms. No
            mileage surprises. The price you see is the price you pay, plus
            Texas sales tax on the rental fee and a refundable deposit hold.
          </p>
        </header>

        {/* Pricing matrix — one card per trailer */}
        <section aria-labelledby="pricing-heading" className="space-y-12">
          <h2 id="pricing-heading" className="sr-only">
            Pricing by trailer and rental block
          </h2>

          {trailers.map((trailer) => (
            <article
              key={trailer.id}
              className="bg-surface-container-low border border-outline-variant/15 overflow-hidden"
            >
              {/* Card header */}
              <div className="p-6 md:p-8 border-b border-outline-variant/15">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-2">
                      {trailer.type.replace(/_/g, " ")}
                    </div>
                    <h3 className="font-teko text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none mb-2">
                      {trailer.name}
                    </h3>
                    <p className="text-on-surface-variant text-sm font-light max-w-xl leading-relaxed">
                      {trailer.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-headline uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">
                      Refundable Deposit
                    </div>
                    <div className="font-teko text-3xl font-bold text-on-surface">
                      ${trailer.deposit}
                    </div>
                  </div>
                </div>

                {/* Spec strip */}
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-outline-variant/10 text-xs">
                  <div>
                    <dt className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">GVWR</dt>
                    <dd className="font-bold text-on-surface mt-1">{trailer.specs.gvwr.toLocaleString()} lbs</dd>
                  </div>
                  <div>
                    <dt className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">Payload</dt>
                    <dd className="font-bold text-on-surface mt-1">{trailer.specs.payload.toLocaleString()} lbs</dd>
                  </div>
                  <div>
                    <dt className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">Length</dt>
                    <dd className="font-bold text-on-surface mt-1">{trailer.specs.lengthFeet} ft</dd>
                  </div>
                  <div>
                    <dt className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant">Hitch</dt>
                    <dd className="font-bold text-on-surface mt-1">{trailer.specs.hitchSize}</dd>
                  </div>
                </dl>
              </div>

              {/* Block grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-outline-variant/10 border-b border-outline-variant/15">
                {ALL_DURATIONS.map((duration) => {
                  const quote = calculatePrice(trailer.id, duration);
                  return (
                    <div key={duration} className="p-5 md:p-6 text-center">
                      <div className="font-headline uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-2">
                        {DURATION_LABELS[duration]}
                      </div>
                      <div className="font-teko text-4xl md:text-5xl font-bold text-on-surface leading-none mb-1">
                        {formatUsd(quote.rentalCents)}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-2 leading-tight">
                        + {formatUsd(quote.taxCents)} tax<br />
                        = {formatUsd(quote.totalCents)} total
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA strip */}
              <div className="p-6 md:p-8 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-on-surface-variant text-xs uppercase tracking-widest font-headline font-bold">
                  All blocks include the deposit hold • Released after return inspection
                </p>
                <Link
                  href={`/book?trailer=${trailer.slug}`}
                  className="inline-flex items-center gap-2 bg-primary-action text-white px-6 py-3 min-h-[44px] font-headline font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all"
                >
                  Book This Trailer
                  <Icon name="arrow_forward" className="text-sm" />
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* What's included strip */}
        <section
          aria-labelledby="included-heading"
          className="mt-20 bg-surface-container p-8 md:p-12 border-l-4 border-primary"
        >
          <h2
            id="included-heading"
            className="font-teko text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none mb-6"
          >
            What&apos;s Included
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-2">
                Pro Inspection
              </div>
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                Tires, lights, coupler, safety chains — documented before every release. Not assumed.
              </p>
            </div>
            <div>
              <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-2">
                Rapid Pickup
              </div>
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                Trailer is ready when you arrive. No line, no paperwork shuffling, no improvisation.
              </p>
            </div>
            <div>
              <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-2">
                24/7 Support
              </div>
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                Real person, reachable the whole time the trailer is out. Industrial reliability includes the people attached to it.
              </p>
            </div>
          </div>
        </section>

        {/* Fine print */}
        <section className="mt-12 text-xs text-on-surface-variant font-light leading-relaxed space-y-2">
          <p>
            <strong className="text-on-surface">Texas sales tax (Bexar County combined, 8.25%)</strong> applies
            to the rental fee only. Refundable deposit is a pre-authorization hold on your card, not a charge.
          </p>
          <p>
            <strong className="text-on-surface">Mid-rental extensions</strong> are billed in 4-hour blocks
            so you only pay for the time you actually need &mdash; not a full half-day. Approved extensions
            cost materially less than the $100 flat late-return fee. Request from your dashboard before your
            scheduled return time.
          </p>
          <p>
            Full terms in our <Link href="/terms" className="text-primary hover:underline">rental agreement</Link>.
            Questions? See <Link href="/book" className="text-primary hover:underline">the booking flow</Link> or
            reach support.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
