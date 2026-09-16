"use client";

import { useEffect, useState } from "react";
import { instructionState } from "@/lib/booking/renter-instructions";
import { pickupChecklist, returnChecklist, type BookingOperationsContact } from "@/lib/booking/communications";
import type { BookingStatus } from "@/types/models";

export function BookingInstructions({ status, endTime, contact, nowMs }: {
  status: BookingStatus; endTime: string; contact: BookingOperationsContact | null; nowMs: number;
}) {
  const [now, setNow] = useState(nowMs);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  const state = instructionState(status, Date.parse(endTime), now);
  if (!state.pickup && !state.returns) return null;
  const returnDate = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }).format(new Date(endTime));
  return (
    <section className={`mt-5 border-l-4 p-5 ${state.pickup ? "border-green-500 bg-green-500/10" : state.returnDue ? "border-primary bg-primary/10" : "border-outline-variant bg-surface-container"}`}>
      {state.pickup ? <>
        <h3 className="font-headline text-xl font-bold uppercase">Pickup Instructions</h3>
        <p className="mt-2 text-sm">Private pickup address: {contact?.pickupAddress ?? "Contact the owner for the handoff location."}</p>
        {contact && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-on-surface-variant">{pickupChecklist(contact).map(item => <li key={item}>{item}</li>)}</ul>}
      </> : <>
        <p className="font-bold">Return by {returnDate} (Central Time)</p>
        {state.returnDue && <p role="status" className="mt-2 font-bold text-primary">{Date.parse(endTime) <= now ? "Your return time has passed. Please contact the owner." : "Your trailer is due back within 24 hours."}</p>}
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="mt-3 min-h-[44px] px-4 py-3 bg-surface-container-high font-bold uppercase">
          {expanded ? "Hide Return Instructions" : "Show Return Instructions"}
        </button>
        {expanded && <div className="mt-4">
          <p className="text-sm">Return location: {contact?.pickupAddress ?? "Contact the owner for the return location."}</p>
          {contact && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-on-surface-variant">{returnChecklist(contact).map(item => <li key={item}>{item}</li>)}</ul>}
        </div>}
      </>}
    </section>
  );
}
