import Image from "next/image";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ContactActions } from "./BookingExperience";
import { bookableTrailers } from "@/lib/data/trailers";
import { supportPhone } from "@/lib/env";

export function ContactBooking({ trailerSlug }: { trailerSlug?: string }) {
  const selected = bookableTrailers.find(t => t.slug === trailerSlug);
  return <>
    <Navbar />
    <main id="main-content" className="max-w-5xl mx-auto px-6 pt-32 pb-20">
      <p className="text-primary text-xs font-bold uppercase tracking-[0.25em] mb-5">San Antonio trailer rentals</p>
      <h1 className="font-teko text-6xl sm:text-8xl font-bold uppercase leading-[0.9] mb-6">Let’s get you hauling.</h1>
      <p className="max-w-2xl text-lg text-on-surface-variant leading-relaxed mb-8">Call or text to reserve your trailer. We’ll help you choose the right fit, confirm your dates, and arrange pickup.</p>

      <section aria-labelledby="contact-booking-heading" className="bg-surface-container border border-white/10 p-6 sm:p-8">
        <h2 id="contact-booking-heading" className="font-headline text-2xl font-bold mb-3">{selected ? selected.name : "Book directly with our team"}</h2>
        <p className="text-3xl font-teko font-bold mb-5">{supportPhone}</p>
        <ContactActions trailerName={selected?.name} />
        <p className="text-sm text-on-surface-variant mt-5 leading-relaxed">Have your pickup date, rental length, and tow vehicle details ready. Your reservation is confirmed once our team verifies availability and completes the booking with you.</p>
        <p className="text-sm text-on-surface-variant mt-3">Pickup by appointment in San Antonio. We’ll confirm your pickup time and location with your reservation.</p>
      </section>

      <section aria-labelledby="choose-trailer-heading" className="mt-12">
        <h2 id="choose-trailer-heading" className="font-teko text-4xl font-bold uppercase mb-5">{selected ? "Explore our trailers" : "Find your trailer"}</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {bookableTrailers.map(t => <article key={t.id} className="bg-surface-container-low border border-white/10 overflow-hidden">
            <div className="relative aspect-[16/9]"><Image src={t.imageUrl} alt={t.name} fill sizes="(max-width: 640px) 100vw, 480px" className="object-cover" /></div>
            <div className="p-6">
              <h3 className="font-headline text-xl font-bold mb-2">{t.name}</h3>
              <p className="text-on-surface-variant">From ${t.pricing.halfDay} / half day · ${t.pricing.fullDay} / full day</p>
              <p className="text-xs text-on-surface-variant mt-2">Plus rental tax and a ${t.deposit} refundable deposit.</p>
              <Link href={`/book?trailer=${t.slug}`} className="inline-flex items-center min-h-[44px] py-3 mt-3 text-primary font-bold underline underline-offset-4">Ask about this trailer</Link>
              <Link href={`/fleet/${t.slug}`} className="block min-h-[44px] py-3 text-sm text-on-surface-variant underline">View trailer details</Link>
            </div>
          </article>)}
        </div>
      </section>
      <p className="mt-8 text-sm text-on-surface-variant"><Link href="/rates" className="underline underline-offset-4">See all rental rates</Link><span className="mx-3">·</span><Link href="/terms" className="underline underline-offset-4">Rental requirements &amp; terms</Link></p>
    </main>
    <Footer />
  </>;
}
