/**
 * FAQ — frequently asked questions, with FAQPage JSON-LD.
 *
 * Sprint 3.1 audit fix. Closes the "no FAQ section" gap from the audit.
 *
 * Two functions:
 *   1. Visible accordion on the page — answers high-intent questions
 *      before a customer has to email or call to confirm a detail.
 *   2. FAQPage JSON-LD — one of the few structured-data types that
 *      still produces visible SERP enhancements (expandable Q&A in
 *      search results, People Also Ask placements).
 *
 * Question copy mirrors actual customer-search phrasing on purpose
 * ("Do I need insurance to rent a trailer?" not "What's the insurance
 * policy?"). Higher chance Google picks individual questions for the
 * People Also Ask box.
 *
 * Single faqs array drives both the rendered <details> elements AND
 * the JSON-LD, so visible content and structured data cannot drift.
 *
 * Uses native HTML <details>/<summary> instead of JS-driven accordion:
 *   - Zero JavaScript shipped to the browser
 *   - Keyboard accessible by default (Enter/Space toggle)
 *   - prefers-reduced-motion respected by the browser, not by us
 *   - Crawlers see the answer text even when the panel is collapsed
 */

import { Icon } from "@/components/ui/Icon";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "How long can I rent a trailer?",
    answer:
      "Rentals come in four block sizes: 4, 12, 24, or 36 hours. Pick the block that matches your job. If you need more time mid-rental, extensions sell in 4-hour blocks at a lower per-hour rate than going over — request through your customer dashboard before your scheduled return time.",
  },
  {
    question: "Do I need insurance to rent a trailer?",
    answer:
      "Yes. Before the trailer leaves our premises you provide a clear photo of current auto liability insurance that extends to a towed trailer, meeting at least the State of Texas minimum financial responsibility limits. Your insurance is primary; ours (if any) is excess and non-contributing.",
  },
  {
    question: "Is the security deposit charged to my card?",
    answer:
      "No. The deposit is a pre-authorization hold, not a charge. It releases within three business days after the trailer is returned and inspected in acceptable condition. If damage, cleaning, fuel replacement, or overtime is owed, we capture only the amount due and release the remainder.",
  },
  {
    question: "How much does a trailer rental cost in San Antonio?",
    answer:
      "Block rates start at $25 for a 4-hour rental of our 10' utility trailer. See the full price matrix on our rates page — every block of every trailer is priced openly, no quote forms or hidden fees. Texas sales tax (Bexar County combined, 8.25%) applies to the rental fee.",
  },
  {
    question: "What if I'm late returning the trailer?",
    answer:
      "A flat late fee applies if the trailer comes back after the scheduled return time without an approved extension. The flat late fee is materially higher than the extension rate — request the extension in advance through your dashboard. After roughly 24 hours overdue with no contact, the trailer is treated as abandoned and law enforcement may be notified.",
  },
  {
    question: "Can I take the trailer outside of Texas?",
    answer:
      "Only with our prior written consent. Out-of-state use changes the insurance and recovery picture, so we need to know in advance. Reach out before you book if your trip crosses state lines.",
  },
  {
    question: "What do I need to bring to pick up the trailer?",
    answer:
      "A valid driver's license in good standing (you must be 21+), proof of auto insurance that extends to a towed trailer, and the payment card you used to book — the name on the card must match the name on the license.",
  },
  {
    question: "What kind of tow vehicle do I need?",
    answer:
      "A vehicle rated and equipped to tow the trailer class you're renting. Each trailer page lists the GVWR (gross weight rating) and the hitch size — your vehicle's tow rating must meet or exceed that GVWR, and your hitch must match. If you're unsure, message us before booking and we'll help you confirm.",
  },
  {
    question: "Do you deliver the trailer to me?",
    answer:
      "Pickup and return at our San Antonio yard for now. As the business grows, we'll evaluate adding delivery as a paid service — let us know if it's something you'd use.",
  },
];

export function FAQ() {
  // Build the FAQPage JSON-LD from the same array that drives the rendered UI.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <section
      className="px-8 md:px-16 py-24 max-w-4xl mx-auto"
      aria-labelledby="faq-heading"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6" aria-hidden="true">
          <div className="h-[2px] w-12 bg-primary" />
          <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
            FAQ
          </span>
        </div>
        <h2
          id="faq-heading"
          className="font-teko text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.85] mb-6"
        >
          Common Questions
        </h2>
        <p className="text-lg text-on-surface-variant font-light leading-relaxed max-w-2xl">
          The things people ask before their first booking. Anything missing,
          shoot us a note from the booking flow and we&apos;ll add it here.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details
            key={f.question}
            className="group bg-surface-container border border-outline-variant/15 open:bg-surface-container-high transition-colors"
            // Open the first FAQ by default so the answer pattern is obvious
            open={i === 0}
          >
            <summary className="cursor-pointer list-none min-h-[44px] flex items-center justify-between gap-4 px-6 py-5 select-none">
              <span className="font-headline text-base md:text-lg font-bold uppercase tracking-tight text-on-surface text-left">
                {f.question}
              </span>
              <Icon
                name="expand_more"
                className="text-primary text-2xl transition-transform group-open:rotate-180 flex-shrink-0"
                aria-hidden="true"
              />
            </summary>
            <div className="px-6 pb-6 -mt-1 text-on-surface-variant text-sm md:text-base font-light leading-relaxed max-w-3xl">
              {f.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
