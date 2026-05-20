/**
 * /terms — public rental terms summary.
 *
 * Audit 2026-05-15 fix: Navbar linked to /terms but the page 404'd.
 *
 * This page is a PLAIN-LANGUAGE SUMMARY of the full rental agreement
 * stored at deliverables/rental-agreement/rental-agreement.html. It is
 * NOT the legally binding contract — that gets presented at booking time
 * (Phase 7 will wire DocuSign). This page exists so a visitor can read
 * the major terms before they start a booking, building trust.
 *
 * The full agreement is still in DRAFT pending Texas attorney review —
 * the page flags this clearly so a customer doesn't think they're reading
 * the final binding language.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Plain-language summary of Alamo City Hitch & Go Co's trailer rental terms — deposits, insurance, late returns, extensions, and governing law. Bexar County, Texas.",
  alternates: { canonical: "/terms" },
};

interface Section {
  heading: string;
  body: string;
}

const sections: Section[] = [
  {
    heading: "Who Can Rent",
    body:
      "Renters must be at least 21 years old, hold a valid driver's license in good standing, and tow with a vehicle rated and equipped for the trailer class being rented.",
  },
  {
    heading: "Payment",
    body:
      "The rental fee is charged at booking. Texas sales tax (Bexar County combined, 8.25%) applies to the rental fee only. Your card on file must be in your legal name as shown on the driver's license you present at pickup.",
  },
  {
    heading: "Refundable Deposit",
    body:
      "Every rental requires a refundable deposit hold — $300 on the enclosed trailers, $200 on the dump trailer. It is a pre-authorization on your card, not a charge. The hold releases within three business days after the trailer is returned and inspected in acceptable condition. If damage, cleaning ($100 flat), or unpaid overtime is owed, we capture only the amount due and release the remainder.",
  },
  {
    heading: "Insurance",
    body:
      "Before the trailer leaves our premises you must provide a clear photo of current auto liability insurance that extends to a towed trailer, meeting at least the State of Texas minimum financial responsibility limits. Your insurance is primary; ours (if any) is excess and non-contributing.",
  },
  {
    heading: "Use of the Trailer",
    body:
      "Use only for lawful, personal, or commercial hauling consistent with the trailer's rated load. Do not exceed the trailer's load rating, take the trailer outside Texas without our written consent, transport hazardous materials, sublease to anyone not named on this agreement, or operate while under the influence.",
  },
  {
    heading: "Extensions",
    body:
      "Need more time? Request an extension through your customer dashboard or by calling us BEFORE the scheduled return time. Mid-rental extensions are billed in 4-hour blocks — so you only pay for the time you actually need, not a full half-day. An approved extension confirms via SMS or email and the new return time becomes binding.",
  },
  {
    heading: "Late Return",
    body:
      "If the trailer comes back late without an approved extension, a flat $100 late fee applies (in addition to any continued-use block charges). The $100 late fee is materially higher than the approved extension rate — request the extension in advance, not after.",
  },
  {
    heading: "Cleaning Fee",
    body:
      "A flat $100 cleaning fee applies only if the trailer is returned uncleaned — meaning trash, mud, debris, manure, paint splatter, or any soiling that requires more than about 15 minutes of cleanup time. Sweep the deck and clear any obvious mess before return and the fee doesn't apply.",
  },
  {
    heading: "Damage, Loss & Inspection",
    body:
      "We inspect with you at pickup and document the trailer's condition on a joint inspection report. We re-inspect within two business days of return. Damage, loss, missing accessories, or excessive soiling that wasn't there at pickup is documented with photographs and billed at commercially reasonable rates.",
  },
  {
    heading: "Governing Law & Venue",
    body:
      "This rental is governed by the laws of the State of Texas. Any dispute is resolved exclusively in the state or federal courts located in Bexar County, Texas.",
  },
  {
    heading: "Electronic Signature",
    body:
      "When you sign the rental agreement at booking — including via DocuSign or any equivalent platform — your electronic signature has the same legal force as a handwritten one under the Texas Uniform Electronic Transactions Act, Texas Business & Commerce Code Chapter 322.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-28 pb-24 px-6 md:px-8 max-w-4xl mx-auto">
        {/* Section header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6" aria-hidden="true">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
              Rental Terms
            </span>
          </div>
          <h1 className="font-teko text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] mb-6">
            Terms
          </h1>
          <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl">
            The major points, in plain language. The complete signed rental
            agreement is presented at booking — this page exists so you can
            read it before you start.
          </p>
        </header>

        {/* DRAFT notice */}
        <aside
          role="note"
          className="bg-surface-container border-l-4 border-primary p-6 mb-12"
        >
          <div className="flex items-start gap-4">
            <Icon name="info" className="text-primary text-2xl flex-shrink-0 mt-1" aria-hidden="true" />
            <div>
              <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary mb-2">
                Working Draft — Pending Texas Attorney Review
              </div>
              <p className="text-on-surface-variant text-sm font-light leading-relaxed">
                The summary below reflects the current draft of our rental
                agreement. A licensed Texas business attorney is reviewing the
                final language before any customer signs. Nothing on this page
                is a binding contract — the binding document is the agreement
                presented at booking time, signed via DocuSign.
              </p>
            </div>
          </div>
        </aside>

        {/* Section list */}
        <section aria-labelledby="terms-heading" className="space-y-10">
          <h2 id="terms-heading" className="sr-only">
            Rental terms summary
          </h2>
          {sections.map((section, i) => (
            <article key={section.heading} className="border-t border-outline-variant/15 pt-8">
              <div className="grid md:grid-cols-[3rem_1fr] gap-4 md:gap-8">
                <div className="font-headline uppercase tracking-widest text-xs font-bold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-headline uppercase tracking-tight text-2xl font-bold text-on-surface mb-3">
                    {section.heading}
                  </h3>
                  <p className="text-on-surface-variant text-base font-light leading-relaxed">
                    {section.body}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-20 bg-surface-container-low border border-outline-variant/15 p-8 md:p-12 text-center">
          <h2 className="font-teko text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none mb-3">
            Ready When You Are
          </h2>
          <p className="text-on-surface-variant text-base font-light max-w-xl mx-auto mb-8 leading-relaxed">
            You&apos;ll see the full binding agreement at booking. Sign once,
            pull, go.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-3 bg-primary-action text-white px-10 py-4 min-h-[44px] font-headline font-bold uppercase tracking-widest text-base hover:brightness-110 transition-all"
          >
            Start a Booking
            <Icon name="arrow_forward" className="text-base" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
