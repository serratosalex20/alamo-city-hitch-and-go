/**
 * PricingCallout — transparent-pricing anti-objection banner.
 *
 * Sprint 3.2 audit fix. Pulls the /rates page win onto the homepage where
 * most visitors land. Every competitor we audited either hides pricing
 * behind a "call for a quote" form or shows vague tiers — publishing
 * the actual block range ON THE HOMEPAGE is a positioning play that
 * pre-empts the #1 question a price-sensitive visitor has.
 *
 * Placement: directly under Hero, above FeatureGrid. The visitor sees
 * the CTAs in Hero, then immediately the price reality check, then the
 * three product promises. Each section answers one funnel objection in
 * order: "is this real?" -> "is it in my budget?" -> "is the experience good?"
 *
 * Server Component, zero JS shipped, Industrial Editorial styling.
 */

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";

// Derive the actual block-rate range from the seed data so the headline
// number stays in sync if the owner changes pricing in src/lib/data/trailers.ts.
const allBlockRates = trailers.flatMap((t) => [
  t.pricing.rate4h,
  t.pricing.rate12h,
  t.pricing.rate24h,
  t.pricing.rate36h,
]);
const minRate = Math.min(...allBlockRates);
const maxRate = Math.max(...allBlockRates);

export function PricingCallout() {
  return (
    <section
      className="px-8 md:px-16 py-12 max-w-7xl mx-auto"
      aria-labelledby="pricing-callout-heading"
    >
      <div className="bg-surface-container border-l-4 border-primary px-8 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Headline + claims */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3" aria-hidden="true">
            <Icon name="receipt_long" className="text-primary text-2xl" />
            <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
              Transparent Pricing
            </span>
          </div>
          <h2
            id="pricing-callout-heading"
            className="font-teko text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-none mb-4"
          >
            <span className="text-primary">${minRate}&ndash;${maxRate}</span> per block.
            <br className="md:hidden" />
            <span className="text-on-surface-variant"> Every rate published.</span>
          </h2>
          <p className="text-on-surface-variant text-sm md:text-base font-light leading-relaxed max-w-2xl">
            No quote forms, no &quot;call for a price&quot; runaround, no mileage
            surprises. Pick a trailer, pick a 4 / 12 / 24 / 36-hour block, see the
            total before you book. Texas sales tax called out. Refundable deposit
            is a hold, not a charge.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/rates"
          className="inline-flex items-center gap-3 bg-primary-action text-white px-8 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all flex-shrink-0"
        >
          See Every Rate
          <Icon name="arrow_forward" className="text-sm" />
        </Link>
      </div>
    </section>
  );
}
