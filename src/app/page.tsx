import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Footer } from "@/components/marketing/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Alamo City Hitch & Go Co.",
  description:
    "San Antonio's top-rated trailer rentals. Industrial-grade utility trailers, car haulers, and enclosed cargo trailers.",
  url: "https://alamocityhitch.com",
  telephone: "+12105550123",
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
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "127",
  },
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
        <FeatureGrid />

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-screen opacity-10 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-container via-transparent to-transparent" />
        </div>
      </main>
      <Footer />
    </>
  );
}
