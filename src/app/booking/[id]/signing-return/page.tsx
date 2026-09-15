"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
export default function SigningReturn() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    // This is only a signal to refresh. Agreement completion is verified server-side with DocuSign.
    if (window.top !== window) window.top?.postMessage({ type: "agreement-returned", bookingId: id }, window.location.origin);
  }, [id]);
  return <main className="p-8"><p>Your signing session has ended. We’ll check the agreement status.</p><Link className="underline" href={`/booking/${encodeURIComponent(id)}/documents`}>Return to your booking</Link></main>;
}
