import Image from "next/image";
import Link from "next/link";
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
              TOP-RATED
            </span>{" "}
            <br />
            TRAILER RENTALS
          </h1>
        </div>

        {/* Trust Badge */}
        <div className="col-span-12 lg:col-span-4 flex lg:justify-end items-start pt-4">
          <GlassPanel className="p-6 flex flex-col items-center gap-2">
            <div className="flex gap-1 text-[#F59E0B]" aria-label="5 out of 5 stars" role="img">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} name="star" filled className="text-xl" />
              ))}
            </div>
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
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              href="/book"
              className="bg-primary-action text-white hover:brightness-110 transition-all duration-300 font-headline font-black tracking-widest uppercase px-10 py-5 text-lg flex items-center justify-center gap-3 active:scale-95 min-h-[44px]"
            >
              Book Your Trailer
              <Icon name="arrow_forward" />
            </Link>
            <Link
              href="/fleet"
              className="bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-headline font-bold tracking-widest uppercase border-b-2 border-outline-variant px-10 py-5 text-lg flex items-center justify-center gap-3 min-h-[44px]"
            >
              View Fleet
            </Link>
          </div>
        </div>

        {/* Hero Image — Asymmetric Overlap */}
        <div className="col-span-12 lg:col-span-10 lg:col-start-3 mt-12 relative">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-sm bg-surface-container">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9F4jtDJSPvB_viF6QVpEt1l9eCCFxSWf49RL3C9aD_SbOLgXimAwCR9I4tQGc80fENxPUXygJwz1Qu5Ssijps0Ii4rMwtXB8VWLKP1bPLhRSTLYqsHmDDj3tIDBv8iKHunWTsAxdiCObm1II7npg7y_HNJ2vu--OuvuhNfu3cDNtaKYejqYyjVN7mzIDCIkNJcWZVCtAUHG97Fl_lk_ez-LOqWZVADNB9t5i1vFF-R96C0MtWn1VtgrMh4ME9KVGlO1wqA2furYs"
              alt="Professional trailer fleet — modern heavy-duty utility trailer parked on dark asphalt with San Antonio industrial skyline during dramatic dusk lighting"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1100px"
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
