/**
 * TrustBlock — "Why a new local beats the chain"
 *
 * Sprint 3.1 audit fix. The original audit recommended a testimonials
 * section, but the business is brand-new and has no real customer
 * reviews yet — fabricating them would repeat the JSON-LD review
 * violation we just fixed (commit cafbd7d). Instead this block reframes
 * "we're new" as a positioning advantage by addressing the four
 * U-Haul-style pain points the audit sentiment research surfaced:
 *
 *   - Wrong/broken equipment given at the counter
 *   - Reserved trailer "not actually available" at pickup
 *   - Rude / unhelpful staff at busy locations
 *   - Hidden mileage and surprise fees on top of the daily rate
 *
 * Each "promise" in this block addresses one of those pains head-on.
 * When the business has 5-10 real reviews (post-GBP), this component
 * is replaced with a customer-review carousel without touching the
 * homepage composition.
 *
 * Server Component on purpose: pure static markup, zero JS shipped.
 */

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface Promise {
  icon: string;
  heading: string;
  body: string;
}

const promises: Promise[] = [
  {
    icon: "checklist",
    heading: "Documented Pre-Rental Inspection",
    body:
      "Every trailer gets a written safety inspection before you arrive — tires, lights, coupler, safety chains. You see the report. We don't assume; we document.",
  },
  {
    icon: "schedule",
    heading: "If It's Booked, It's Yours",
    body:
      "No double-booking, no \"the trailer you reserved isn't actually here\" surprises. Your booking is held against a single physical unit, not a wishlist.",
  },
  {
    icon: "support_agent",
    heading: "Owner-Level Attention, Every Rental",
    body:
      "You're not customer #4,212 at a national chain. Small operation, local owner, accountable to every transaction. Reach a real person 24/7 the entire time the trailer is out.",
  },
  {
    icon: "request_quote",
    heading: "What You See Is What You Pay",
    body:
      "Flat block pricing on the rates page. Texas sales tax called out. Refundable deposit is a hold, not a charge. No mileage roulette, no fuel-fill gotchas.",
  },
];

export function TrustBlock() {
  return (
    <section
      className="px-8 md:px-16 py-24 max-w-7xl mx-auto"
      aria-labelledby="trust-heading"
    >
      <div className="mb-12 max-w-3xl">
        <div className="flex items-center gap-4 mb-6" aria-hidden="true">
          <div className="h-[2px] w-12 bg-primary" />
          <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
            What You Get
          </span>
        </div>
        <h2
          id="trust-heading"
          className="font-teko text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85] mb-6"
        >
          A New Local Beats <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4444] via-[#DC2626] to-[#7F1D1D]">
            The Chain
          </span>
        </h2>
        <p className="text-lg text-on-surface-variant font-light leading-relaxed">
          We&apos;re new — and that&apos;s the point. Every rental gets the kind
          of attention a national counter can&apos;t deliver. Here&apos;s what
          that looks like in practice.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {promises.map((p) => (
          <article
            key={p.heading}
            className="bg-surface-container p-8 flex gap-6 items-start border-l-2 border-primary/40 hover:border-primary transition-colors"
          >
            <Icon name={p.icon} className="text-primary text-3xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-headline text-xl font-bold uppercase tracking-tight mb-3 text-on-surface">
                {p.heading}
              </h3>
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                {p.body}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Quiet honesty footer — talks about reviews as future-tense without faking */}
      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-container-low border border-outline-variant/15 px-8 py-6">
        <p className="text-on-surface-variant text-sm font-light leading-relaxed text-center md:text-left max-w-2xl">
          <strong className="text-on-surface font-semibold">Brand-new business.</strong>{" "}
          Reviews and testimonials populate here as real customers leave them.
          In the meantime: you&apos;re reading transparent pricing on the same
          page that holds the rental agreement &mdash; not a sales letter.
        </p>
        <Link
          href="/book"
          className="inline-flex items-center gap-3 bg-primary-action text-white px-8 py-3 min-h-[44px] font-headline font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all flex-shrink-0"
        >
          Be Our Next Booking
          <Icon name="arrow_forward" className="text-sm" />
        </Link>
      </div>
    </section>
  );
}
