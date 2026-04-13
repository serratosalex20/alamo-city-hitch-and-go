import Image from "next/image";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { TrailerCard } from "@/components/marketing/TrailerCard";
import { Icon } from "@/components/ui/Icon";
import { trailers } from "@/lib/data/trailers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fleet | Alamo City Hitch & Go Co. — Trailer Rental San Antonio TX",
  description:
    "Browse our fleet of industrial-grade utility trailers, car haulers, and enclosed cargo trailers. Transparent pricing. Same-day pickup in San Antonio.",
};

export default function FleetPage() {
  return (
    <>
      <Navbar />

      <div id="main-content" />
      {/* Hero */}
      <section
        className="relative min-h-[70vh] flex items-center pt-20 overflow-hidden branding-split"
        aria-labelledby="fleet-hero-heading"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDASxFGFJ2br1S88eOFnq2Er0FNnukarTF11nSa18Wvbm94srS-Or5mE9HmsSkqGnbUrjWFv35Cei78Rs--PfYrvRawKm8mGb1c0UxYivyhaVGPFzr5uh9u8pjRCd8BpDNOu1px6JILHEUNP2t07vmc_U9o_2VufiGQXKMiNntgc9OO2_-l4XoWtf1vxkCpuo4aqt7RoEa7pprI7gtgJZOtp74yqRqdLrQ9lY7soBkBuHSXnoTTxXvKHc4kLetkjoYgKuFfZnHEAc"
            alt="Industrial heavy-duty trailer on dark asphalt with dramatic sunset lighting"
            fill
            sizes="100vw"
            className="object-cover grayscale opacity-30"
            priority
          />
        </div>
        <div className="container mx-auto px-8 relative z-20">
          <div className="max-w-4xl">
            <span className="inline-block px-3 py-1 bg-primary-action/10 border border-primary-action/20 text-primary text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
              Industrial Precision Hauling
            </span>
            <h1 id="fleet-hero-heading" className="text-6xl sm:text-7xl md:text-9xl font-headline font-bold leading-[0.85] tracking-tighter uppercase mb-8 text-white">
              HEAVY DUTY.
              <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "1.5px white" }}
              >
                HASSLE FREE.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant font-light max-w-2xl mb-12 leading-relaxed">
              Industrial-grade trailer rentals engineered for San Antonio&apos;s
              toughest jobs. Whether it&apos;s a cross-state haul or a local
              site move, we provide the steel.
            </p>
            <div className="flex flex-wrap gap-6">
              <a
                href="#fleet"
                className="bg-primary-action hover:bg-red-800 text-white px-10 py-5 min-h-[44px] font-headline font-bold uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95"
              >
                VIEW THE FLEET
                <Icon name="arrow_forward" className="text-sm" />
              </a>
              <a
                href="/locations"
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-10 py-5 min-h-[44px] font-headline font-bold uppercase tracking-widest transition-all flex items-center"
              >
                OUR LOCATIONS
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 right-12 z-20 hidden lg:flex flex-col items-end">
          <div className="h-24 w-px bg-gradient-to-b from-transparent via-primary to-primary" />
          <span className="mt-4 font-headline text-[10px] tracking-[0.3em] uppercase text-on-surface-variant [writing-mode:vertical-rl] rotate-180">
            Scroll to Explore
          </span>
        </div>
      </section>

      {/* Trailer Grid */}
      <section
        id="fleet"
        className="bg-surface-dim py-24 relative overflow-hidden"
      >
        <div className="container mx-auto px-8">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-headline font-bold tracking-tighter uppercase mb-4 text-white">
                SELECT YOUR TRAILER
              </h2>
              <p className="text-on-surface-variant font-body">
                Meticulously maintained equipment for commercial and residential
                transport. Choose the rig that fits your cargo requirements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trailers.map((trailer) => (
              <TrailerCard key={trailer.id} trailer={trailer} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
