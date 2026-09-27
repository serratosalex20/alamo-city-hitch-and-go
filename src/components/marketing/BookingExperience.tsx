"use client";

import { createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

type Experience = { contactOnly: boolean; phone: string };
const BookingExperience = createContext<Experience>({ contactOnly: true, phone: "210-269-3467" });

export function BookingExperienceProvider({ children, ...value }: Experience & { children: ReactNode }) {
  return <BookingExperience.Provider value={value}>{children}</BookingExperience.Provider>;
}

export const useBookingExperience = () => useContext(BookingExperience);

export function BookingCTA({ href = "/book", className, children }: {
  href?: string; className?: string; children: ReactNode;
}) {
  const { contactOnly } = useBookingExperience();
  return <Link href={href} className={className}>{contactOnly ? "Call / Text to Book" : children}</Link>;
}

export function ContactActions({ trailerName, compact = false }: { trailerName?: string; compact?: boolean }) {
  const { phone } = useBookingExperience();
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  const message = `Hi! I'd like to rent ${trailerName ? `the ${trailerName}` : "a trailer"}. Can you help me check availability?`;
  const button = `min-h-[48px] flex items-center justify-center gap-2 px-6 ${compact ? "py-3" : "py-4"} font-headline font-bold uppercase tracking-wide transition-colors`;
  return <div className="flex flex-col sm:flex-row gap-3">
    <a href={`tel:${number}`} className={`${button} bg-primary-action text-white hover:brightness-110`}>
      <Icon name="call" />Call to Book
    </a>
    <a href={`sms:${number}?body=${encodeURIComponent(message)}`} className={`${button} border border-white/20 bg-surface-container-high text-white hover:bg-surface-bright`}>
      <Icon name="sms" />Text to Book
    </a>
  </div>;
}

export function HeroBookingActions() {
  const { contactOnly, phone } = useBookingExperience();
  return <>
    {contactOnly ? <>
      <ContactActions />
      <p className="mt-4 text-sm text-on-surface-variant">{phone} · Tell us your trailer and dates. We’ll confirm availability and pickup.</p>
    </> : <BookingCTA className="bg-primary-action text-white px-8 py-4 inline-flex items-center gap-3 font-bold uppercase min-h-[48px]">Book Your Trailer<Icon name="arrow_forward" /></BookingCTA>}
    <Link href="/fleet" className="inline-flex items-center gap-2 mt-5 py-3 min-h-[44px] text-on-surface font-bold underline underline-offset-4">View Fleet &amp; Rates<Icon name="arrow_forward" /></Link>
  </>;
}
