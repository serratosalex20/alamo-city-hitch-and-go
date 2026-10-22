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
import Image from "next/image";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import { calculatePrice, formatUsd, ALL_DURATIONS, DURATION_LABELS } from "@/lib/booking/pricing";

export const metadata: Metadata = {
  title: "Rates",
  description:
    "Transparent trailer rental pricing in San Antonio. Enclosed and dump trailers in Half Day / Full Day / 1 Week / 2 Weeks (15-day) blocks. $200 deposit. No hidden fees.",
  alternates: { canonical: "/rates" },
};

export default function RatesPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-28 pb-24 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Section header */}
        <header className="mb-10 md:mb-14">
          <div className="flex items-center gap-4 mb-6" aria-hidden="true">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
              Transparent Pricing
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-teko)" }} className="text-6xl md:text-8xl font-bold tracking-tight uppercase leading-[0.85] mb-6">
            Rates
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant leading-relaxed max-w-2xl">
            Pick a trailer, pick a block, see the total. No quote forms. No
            mileage surprises. The price you see is the price you pay, plus
            Texas motor vehicle rental tax on the rental fee and a refundable deposit charged at checkout.
          </p>
        </header>

        <section aria-labelledby="pricing-heading" className="space-y-8 md:space-y-12">
          <h2 id="pricing-heading" className="sr-only">
            Pricing by trailer and rental block
          </h2>
          {trailers.map((trailer) => (
            <article
              key={trailer.id}
              aria-labelledby={`rate-${trailer.id}`}
              className="bg-surface-container-low border border-white/10 overflow-hidden"
            >
              <div className="grid lg:grid-cols-[2fr_3fr] border-b border-white/10">
                <div className="relative aspect-[16/10] lg:aspect-auto bg-surface-container overflow-hidden">
                  <Image
                    src={trailer.imageUrl}
                    alt={trailer.name}
                    fill
                    sizes="(max-width: 1023px) 100vw, 440px"
                    className="object-cover"
                  />
                  {trailer.status === "coming_soon" && (
                    <span className="absolute top-4 left-4 bg-background/90 text-on-surface border border-white/20 px-3 py-2 text-xs font-headline font-bold uppercase tracking-wider">
                      Coming Soon
                    </span>
                  )}
                </div>
                <div className="p-5 md:p-8 min-w-0">
                  <p className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-3">
                    {trailer.type.replace(/_/g, " ")}
                  </p>
                  <h3 id={`rate-${trailer.id}`} style={{ fontFamily: "var(--font-teko)" }} className="text-4xl md:text-5xl font-bold uppercase tracking-tight leading-none mb-3">
                    {trailer.name}
                  </h3>
                  <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed">
                    {trailer.description}
                  </p>
                  <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-x-5 gap-y-4 mt-5 pt-5 border-t border-white/10 text-sm">
                    <div>
                      <dt className="font-headline uppercase tracking-wider text-xs text-on-surface-variant">GVWR</dt>
                      <dd className="font-bold text-on-surface mt-1">{trailer.specs.gvwr.toLocaleString()} lbs</dd>
                    </div>
                    <div>
                      <dt className="font-headline uppercase tracking-wider text-xs text-on-surface-variant">Payload</dt>
                      <dd className="font-bold text-on-surface mt-1">{trailer.specs.payload.toLocaleString()} lbs</dd>
                    </div>
                    <div>
                      <dt className="font-headline uppercase tracking-wider text-xs text-on-surface-variant">Length</dt>
                      <dd className="font-bold text-on-surface mt-1">{trailer.specs.lengthFeet} ft</dd>
                    </div>
                    <div>
                      <dt className="font-headline uppercase tracking-wider text-xs text-on-surface-variant">Hitch</dt>
                      <dd className="font-bold text-on-surface mt-1">{trailer.specs.hitchSize}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border-b border-white/10">
                {ALL_DURATIONS.map((duration) => {
                  const quote = calculatePrice(trailer.id, duration);
                  return (
                    <div key={duration} className="p-4 md:p-6 bg-surface-container-low min-w-0">
                      <div className="font-headline uppercase tracking-wider text-xs font-bold text-on-surface-variant mb-3">
                        {DURATION_LABELS[duration]}
                      </div>
                      <div className="font-teko text-4xl md:text-5xl font-bold tabular-nums text-on-surface leading-none whitespace-nowrap">
                        {formatUsd(quote.rentalCents)}
                      </div>
                      <div className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                        + {formatUsd(quote.taxCents)} tax
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <span className="block text-xs text-on-surface-variant leading-relaxed">Due at checkout</span>
                        <span className="block mt-1 font-headline font-bold text-lg tabular-nums whitespace-nowrap">{formatUsd(quote.checkoutTotalCents)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-5 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-start gap-3 max-w-lg">
                  <Icon name="verified_user" className="text-primary text-xl shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    <strong className="block text-on-surface font-headline font-bold mb-1">${trailer.deposit} refundable deposit</strong>
                    Included in every checkout total above. Charged at checkout;
                    refunded after return inspection.
                  </p>
                </div>
                {trailer.status === "available" || trailer.status === "rented" ? (
                  <Link
                    href={`/book?trailer=${trailer.slug}`}
                    aria-label={`Book the ${trailer.name}`}
                    className="w-full sm:w-auto shrink-0 inline-flex justify-center items-center gap-2 bg-primary-action text-white px-6 py-4 min-h-[48px] font-headline font-bold uppercase tracking-wider text-sm hover:brightness-110 transition-all"
                  >
                    Book This Trailer
                    <Icon name="arrow_forward" className="text-sm" />
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="w-full sm:w-auto shrink-0 inline-flex justify-center items-center gap-2 bg-white/[0.02] text-on-surface-variant/50 px-6 py-4 min-h-[48px] font-headline font-bold uppercase tracking-wider text-sm border border-white/5 cursor-not-allowed select-none"
                  >
                    Available Soon
                    <Icon name="schedule" className="text-sm" />
                  </div>
                )}
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
            <strong className="text-on-surface">Texas motor vehicle rental tax (10% for contracts of 1–30 days)</strong> applies
            to the rental fee only. The refundable $200 deposit is charged at checkout,
            with the same deposit amount across every trailer in the fleet.
          </p>
          <p>
            <strong className="text-on-surface">Mid-rental extensions</strong> are billed in the same block
            sizes as the original rental — Half Day, Full Day, 1 Week, or 2 Weeks — so you extend by one
            more block at a time. Approved extensions still cost materially less than the $100 flat late-return
            fee. Request from your dashboard before your scheduled return time.
          </p>
          <p>
            <strong className="text-on-surface">2-Week block ships with a free day.</strong> The published
            2-Weeks sticker price holds the trailer for 15 calendar days, not 14 — the 15th day is
            on us.
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
