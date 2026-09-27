import Image from "next/image";
import { HeroBookingActions } from "./BookingExperience";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Icon } from "@/components/ui/Icon";

export function Hero() {
  return (
    <section
      className="relative z-10 px-8 md:px-16 pt-12 pb-24 max-w-7xl mx-auto"
      aria-labelledby="hero-heading"
    >
      <div className="editorial-grid gap-y-12">
        {/* Main Headline */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-4 mb-6" aria-hidden="true">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
              Industrial Grade Reliability
            </span>
          </div>
          <h1
            id="hero-heading"
            className="font-teko text-6xl md:text-9xl font-bold tracking-tighter text-on-surface leading-[0.8] mb-8"
          >
            SAN ANTONIO&apos;S <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4444] via-[#DC2626] to-[#7F1D1D]">
              HEAVY-DUTY
            </span>{" "}
            <br />
            TRAILER RENTALS
          </h1>
        </div>

        {/* Trust Badge */}
        <div className="col-span-12 lg:col-span-4 flex lg:justify-end items-start pt-4">
          <GlassPanel className="p-6 flex flex-col items-center gap-2">
            <Icon name="local_shipping" className="text-primary text-3xl" />
            <span className="font-headline font-bold text-xl uppercase tracking-tighter">
              Local &amp; Reliable
            </span>
            <span className="text-on-surface-variant text-xs font-medium uppercase tracking-widest">
              Heavy-Duty Reliability &amp; Convenience
            </span>
          </GlassPanel>
        </div>

        {/* Subheadline & CTAs */}
        <div className="col-span-12 lg:col-span-6 mt-8">
          <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed mb-10 font-light">
            Hassle-Free Trailer Rentals. Built for heavy duty, designed for
            simplicity.{" "}
            <span className="text-on-surface font-bold">Pull &amp; Go.</span>
          </p>
          <HeroBookingActions />
        </div>

        {/* Hero Image — Asymmetric Overlap */}
        <div className="col-span-12 lg:col-span-10 lg:col-start-3 mt-12 relative">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-sm bg-surface-container">
            <Image
              src="/fleet/20-enclosed-side.png"
              alt="Charcoal 8.5' x 20' enclosed cargo trailer available to rent in San Antonio — Alamo City Hitch &amp; Go"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1100px"
              className="object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-700"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
