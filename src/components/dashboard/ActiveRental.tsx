"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { rentalClock } from "@/lib/booking/dashboard";
import type { BookingStatus } from "@/types/models";

export function ActiveRental({ bookingId, trailerName, unitId, status, startTime, endTime, nowMs, supportPhone }: {
  bookingId: string; trailerName: string; unitId: string; status: BookingStatus; startTime: string; endTime: string; nowMs: number; supportPhone: string;
}) {
  const [now, setNow] = useState(nowMs);
  const [extension, setExtension] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const start = Date.parse(startTime), end = Date.parse(endTime);
  const clock = rentalClock(start, end, now);
  const minutes = Math.ceil(clock.remainingMs / 60000);
  const remaining = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const date = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" });
  const terminal = ["completed", "cancelled", "rejected", "return_inspection"].includes(status);
  const active = status === "active";
  const phone = supportPhone.replace(/[^+\d]/g, "");
  const request = encodeURIComponent(`I'd like to request more time for booking ${bookingId.slice(0, 8).toUpperCase()} (${trailerName}), currently due ${date.format(new Date(end))} Central Time. What is available?`);
  return <section className="bg-surface-container-high rounded-lg p-6 shadow-2xl relative overflow-hidden" aria-label="Rental status">
    <div className="absolute top-0 right-0 p-4 opacity-10" aria-hidden="true"><Icon name="local_shipping" filled className="text-8xl" /></div>
    <div className="relative space-y-5">
      <div><span className="text-[10px] font-bold tracking-widest text-primary uppercase">{status.replaceAll("_", " ")}</span><h2 className="text-xl font-bold text-white mt-1">{terminal ? "Rental" : "Current Rental"}: {trailerName}</h2><p className="text-xs text-on-surface-variant mt-1">Unit ID: {unitId}</p></div>
      <div className="text-sm text-on-surface-variant space-y-1"><p>Pickup: {date.format(new Date(start))}</p><p>Return: {date.format(new Date(end))}</p><p className="text-xs">Central Time</p></div>
      {active && <div className="space-y-3">
        <div className="flex justify-between gap-3 items-end"><span className="text-xs font-bold tracking-wider uppercase">{clock.beforePickup ? "Rental Duration" : clock.overdue ? "Return Due" : "Time Remaining"}</span><span className="text-xl font-bold text-primary">{clock.overdue ? "Overdue" : remaining}</span></div>
        <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden"><div role="progressbar" aria-label="Rental time elapsed" aria-valuenow={Math.round(clock.progress)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={clock.overdue ? "Return time passed" : `${remaining} remaining`} className="h-full bg-gradient-to-r from-primary to-red-400 rounded-full" style={{ width: `${clock.progress}%` }} /></div>
        {clock.beforePickup && <p className="text-xs text-on-surface-variant">Picked up early. Your scheduled rental period begins {date.format(new Date(start))}.</p>}
      </div>}
      {active && <>
        <button onClick={() => setExtension(value => !value)} aria-expanded={extension} className="w-full min-h-[44px] bg-primary-action text-white py-4 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2"><Icon name="timer" />Extend Rental Time</button>
        {extension && <div className="p-4 bg-surface-container-low rounded space-y-3"><p className="text-sm">Contact the owner to check availability and pricing. Your return time stays the same until an extension is approved.</p><div className="flex flex-wrap gap-3"><a href={`sms:${phone}?body=${request}`} className="min-h-[44px] p-3 bg-primary-action font-bold">Text Extension Request</a><a href={`tel:${phone}`} className="min-h-[44px] p-3 bg-surface-container-high font-bold">Call Owner</a></div></div>}
      </>}
      {terminal ? <>
        <Link href="/book" className="block text-center min-h-[44px] py-3 bg-primary-action font-bold uppercase">Book a Trailer</Link>
        <Link href={`/booking/${bookingId}/documents?details=1`} className="block text-center min-h-[44px] py-3 text-on-surface-variant underline">View Rental Details</Link>
      </> : !active && <Link href={`/booking/${bookingId}/documents?details=1`} className="block text-center min-h-[44px] py-3 bg-primary-action font-bold">View Booking & Next Steps</Link>}
      {status === "completed" && <p className="text-sm text-green-400">Rental completed. Your account and documents remain available.</p>}
    </div>
  </section>;
}
