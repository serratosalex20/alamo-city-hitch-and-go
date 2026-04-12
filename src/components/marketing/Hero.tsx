import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Icon } from "@/components/ui/Icon";

export function Hero() {
  return (
    <section className="relative z-10 px-8 md:px-16 pt-12 pb-24 max-w-7xl mx-auto">
      <div className="editorial-grid gap-y-12">
        {/* Main Headline */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-headline text-primary tracking-[0.3em] uppercase text-xs font-bold">
              Industrial Grade Reliability
            </span>
          </div>
          <h1 className="font-headline text-5xl md:text-8xl font-bold tracking-tighter text-on-surface leading-[0.9] mb-8">
            SAN ANTONIO&apos;S <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              TOP-RATED
            </span>{" "}
            <br />
            TRAILER RENTALS
          </h1>
        </div>

        {/* Trust Badge */}
        <div className="col-span-12 lg:col-span-4 flex lg:justify-end items-start pt-4">
          <GlassPanel className="p-6 flex flex-col items-center gap-2">
            <div className="flex gap-1 text-primary">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} name="star" filled className="text-xl" />
              ))}
            </div>
            <span className="font-headline font-bold text-xl uppercase tracking-tighter">
              Local &amp; Reliable
            </span>
            <span className="text-on-surface-variant text-xs font-medium uppercase tracking-widest">
              Precision Hauling Since 2018
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
          <div className="flex flex-col sm:flex-row gap-6">
            <Button
              variant="primary"
              icon={<Icon name="arrow_forward" />}
            >
              Book Your Trailer
            </Button>
            <Button variant="secondary">View Fleet</Button>
          </div>
        </div>

        {/* Hero Image — Asymmetric Overlap */}
        <div className="col-span-12 lg:col-span-10 lg:col-start-3 mt-12 relative">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-sm bg-surface-container">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9F4jtDJSPvB_viF6QVpEt1l9eCCFxSWf49RL3C9aD_SbOLgXimAwCR9I4tQGc80fENxPUXygJwz1Qu5Ssijps0Ii4rMwtXB8VWLKP1bPLhRSTLYqsHmDDj3tIDBv8iKHunWTsAxdiCObm1II7npg7y_HNJ2vu--OuvuhNfu3cDNtaKYejqYyjVN7mzIDCIkNJcWZVCtAUHG97Fl_lk_ez-LOqWZVADNB9t5i1vFF-R96C0MtWn1VtgrMh4ME9KVGlO1wqA2furYs"
              alt="Professional Trailer Fleet — Modern heavy-duty utility trailer parked on dark asphalt with San Antonio industrial skyline during dramatic dusk lighting"
              fill
              className="object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
