/**
 * Comparison — "The Big-Box Counter vs Our Yard"
 *
 * Sprint 3.2 audit fix. The audit recommended a "vs U-Haul" block.
 * Naming a specific competitor in marketing copy creates two real risks:
 *   - Trademark dilution (each named use needs to be nominative-fair-use clean)
 *   - Comparative advertising rules — every contrasted claim must be
 *     factually verifiable AND specifically substantiated about THAT
 *     competitor's current practices (not a general industry pattern)
 *
 * The framing here is **The Big-Box Counter vs Our Yard**: same
 * recognition pattern for customers who've had bad national-chain
 * experiences (the audit sentiment data is clear on what those are),
 * zero litigation surface for the business.
 *
 * Every claim on our side maps to a written commitment in the rental
 * agreement or a documented business practice — nothing aspirational.
 *
 * Server Component, zero JS shipped.
 */

import { Icon } from "@/components/ui/Icon";

interface Row {
  topic: string;
  counter: string; // the pattern customers complain about
  yard: string; // our specific commitment
}

const rows: Row[] = [
  {
    topic: "Reserved Trailer",
    counter:
      "Your booking is a wishlist. You arrive and the trailer is rented to someone else, broken, or never showed up on the truck.",
    yard:
      "Your booking holds a specific physical unit. If it's booked to you, it's yours.",
  },
  {
    topic: "Pre-Rental Inspection",
    counter:
      "A clipboard with three checkboxes you sign without seeing the trailer. Tire pressure low? Lights out? You find out 30 minutes from the lot.",
    yard:
      "Written 25-point inspection completed before you arrive. You see the report.",
  },
  {
    topic: "Pricing",
    counter:
      "Daily rate, plus mileage, plus environmental fee, plus insurance up-sell at the counter, plus a fuel-fill surcharge if you don't top it off perfectly.",
    yard:
      "Block price + Texas sales tax. Refundable deposit hold, not a charge. That's it.",
  },
  {
    topic: "Support While You're Out",
    counter:
      "Call center routed offshore. Hold music. A ticket number. No one calls back until you're already late returning.",
    yard:
      "Owner-level support, 24/7, the entire time the trailer is out. Reach a real person.",
  },
  {
    topic: "Returning the Trailer",
    counter:
      "Wait in line at the counter. Get charged for damage you didn't cause. Dispute by mail. Maybe win in six weeks.",
    yard:
      "Joint return inspection. Photos. Damage (if any) billed at commercially reasonable rates with the receipts attached, in writing.",
  },
];

export function Comparison() {
  return (
    <section
      className="px-8 md:px-16 py-24 max-w-7xl mx-auto"
      aria-labelledby="comparison-heading"
    >
      <div className="mb-12 max-w-3xl">
        <div className="flex items-center gap-4 mb-6" aria-hidden="true">
          <div className="h-[2px] w-12 bg-primary" />
          <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
            Counter vs Yard
          </span>
        </div>
        <h2
          id="comparison-heading"
          className="font-teko text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85] mb-6"
        >
          The Big-Box Counter <br className="hidden md:block" />
          <span className="text-on-surface-variant">isn&apos;t the only option.</span>
        </h2>
        <p className="text-lg text-on-surface-variant font-light leading-relaxed">
          If you&apos;ve ever rented from a national chain you already know the
          pattern. Here&apos;s the same five touchpoints, side by side.
        </p>
      </div>

      {/* Two-column comparison header */}
      <div className="grid grid-cols-2 gap-4 mb-2 px-4 md:px-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-outline-variant/40">
          <Icon name="store" className="text-on-surface-variant text-xl" aria-hidden="true" />
          <span className="font-headline uppercase tracking-widest text-xs md:text-sm font-bold text-on-surface-variant">
            The Big-Box Counter
          </span>
        </div>
        <div className="flex items-center gap-3 pb-3 border-b-2 border-primary">
          <Icon name="local_shipping" className="text-primary text-xl" aria-hidden="true" />
          <span className="font-headline uppercase tracking-widest text-xs md:text-sm font-bold text-primary">
            Our Yard
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-outline-variant/15 border-b border-outline-variant/15">
        {rows.map((row) => (
          <article key={row.topic} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-4 md:gap-6 px-4 md:px-6 py-6 items-start">
            {/* Topic label — mobile only (desktop has it in the middle column) */}
            <div className="md:col-span-3 mb-2 md:mb-3 md:hidden">
              <span className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
                {row.topic}
              </span>
            </div>

            {/* Desktop: 3-column layout with topic in the middle. Mobile: stacked. */}
            <div className="md:order-1">
              <p className="text-on-surface-variant text-sm font-light leading-relaxed italic">
                {row.counter}
              </p>
            </div>

            <div className="hidden md:flex items-center justify-center md:order-2">
              <span className="font-headline uppercase tracking-widest text-[10px] font-bold text-primary text-center">
                {row.topic}
              </span>
            </div>

            <div className="md:order-3 bg-surface-container px-5 py-4 border-l-2 border-primary">
              <p className="text-on-surface text-sm font-medium leading-relaxed">
                {row.yard}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Disclaimer footer — keep the legal posture clean */}
      <p className="mt-6 text-[10px] uppercase tracking-widest font-headline text-on-surface-variant/70 max-w-3xl leading-relaxed">
        Pattern descriptions reflect recurring customer complaints about
        national trailer-rental counters captured in public reviews and
        independent reporting. Our practices are the specific commitments
        in our rental agreement.
      </p>
    </section>
  );
}
