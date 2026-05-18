import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { PricingCallout } from "@/components/marketing/PricingCallout";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Comparison } from "@/components/marketing/Comparison";
import { TrustBlock } from "@/components/marketing/TrustBlock";
import { FAQ } from "@/components/marketing/FAQ";
import { Footer } from "@/components/marketing/Footer";
import { appUrl } from "@/lib/env";

/**
 * LocalBusiness schema for organic search rich results.
 *
 * Audit 2026-05-15 fix: removed fabricated `aggregateRating` (5★/127 reviews)
 * and placeholder `telephone` (a 555 number). Google's structured-data policy
 * (https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
 * specifies review snippets must reflect real, originally-collected reviews;
 * publishing a fake aggregate is a manual-action risk.
 *
 * Re-add `telephone`, `aggregateRating`, and street address only when verifiable
 * data exists (e.g., once GBP is live and reviews are real). `url` is now derived
 * from NEXT_PUBLIC_APP_URL so it always points at the live deployment.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Alamo City Hitch & Go Co.",
  description:
    "San Antonio's top-rated trailer rentals. Industrial-grade utility trailers, car haulers, and enclosed cargo trailers.",
  url: appUrl,
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Antonio",
    addressRegion: "TX",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 29.4241,
    longitude: -98.4936,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    ],
    opens: "06:00",
    closes: "22:00",
  },
  priceRange: "$$",
};

export default function HomePage() {
  return (
    <>
      {/* Structured data for local business SEO — static content, safe to inject */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main-content" className="relative min-h-screen pt-24 overflow-hidden">
        <Hero />
        <PricingCallout />
        <FeatureGrid />
        <Comparison />
        <TrustBlock />
        <FAQ />

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-screen opacity-10 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-container via-transparent to-transparent" />
        </div>
      </main>
      <Footer />
    </>
  );
}
