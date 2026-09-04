import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How Alamo City Hitch & Go handles booking, identity, insurance, and payment information.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Information We Collect",
    body: "We collect the contact, address, tow-vehicle, scheduling, payment-reference, agreement, identity-verification status, insurance, and trailer-inspection information needed to evaluate and manage a rental.",
  },
  {
    title: "Payments",
    body: "Card details are collected and processed by Stripe. We receive transaction references, payment status, card brand, and limited card details such as the last four digits; our website does not store the complete card number.",
  },
  {
    title: "Identity Verification",
    body: "We use Stripe Identity to verify government-issued identification. Stripe may collect your name, contact information, address, facial images, identity-document images, identification numbers, device information, and fraud signals. Stripe shares verification results with us and processes this information under its own privacy policy. Our booking database stores the Stripe verification reference and status rather than a separate raw copy of your ID.",
  },
  {
    title: "Agreements and Insurance",
    body: "DocuSign processes the electronic rental agreement. Insurance photos and PDFs are stored in private cloud storage and are available only to authorized staff through protected booking tools. We use these records to confirm rental eligibility and resolve a documented claim, charge, or dispute.",
  },
  {
    title: "Sharing and Service Providers",
    body: "We share information only as needed with companies that operate the booking service, including Stripe, DocuSign, cloud hosting, secure document storage, and transactional-email providers, or when required by law. We do not sell renter identity or insurance information.",
  },
  {
    title: "Retention and Deletion",
    body: "We retain booking records for business, tax, safety, claim, and dispute purposes and remove sensitive documents when they are no longer reasonably needed. To request access, correction, or deletion, contact us using the information in your booking confirmation. Stripe Identity data can be redacted after applicable verification and recordkeeping needs are satisfied; some deletion requests may also require contacting Stripe.",
  },
  {
    title: "Security",
    body: "We use access controls, private storage, encrypted connections, and audit records intended to limit unauthorized access. No internet service can guarantee absolute security, so please contact us immediately if you believe booking information has been exposed.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-28 pb-24 px-6 md:px-8 max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-5">Customer Privacy</div>
          <h1 className="font-teko text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] mb-6">Privacy Notice</h1>
          <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl">What we collect during a trailer booking, why we need it, and how sensitive records are protected.</p>
          <p className="text-sm text-on-surface-variant mt-4">Effective September 4, 2026</p>
        </header>
        <section className="space-y-10" aria-label="Privacy notice sections">
          {sections.map((section, index) => (
            <article key={section.title} className="border-t border-outline-variant/15 pt-8 grid md:grid-cols-[3rem_1fr] gap-4 md:gap-8">
              <div className="font-headline text-xs font-bold uppercase tracking-widest text-primary">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <h2 className="font-headline text-2xl font-bold uppercase tracking-tight mb-3">{section.title}</h2>
                <p className="text-on-surface-variant leading-relaxed">{section.body}</p>
              </div>
            </article>
          ))}
        </section>
        <aside className="mt-14 border-l-4 border-primary bg-surface-container p-6 text-sm text-on-surface-variant">
          This notice should be reviewed with the final rental agreement by a Texas attorney before production identity verification is enabled.
        </aside>
      </main>
      <Footer />
    </>
  );
}
