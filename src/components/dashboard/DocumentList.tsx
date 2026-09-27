"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function DocumentList({ bookingId, signedAvailable }: { bookingId: string; signedAvailable: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => () => { urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const documents = [
    { name: "Signed Agreement PDF", url: `/api/bookings/${bookingId}/agreement/document`, filename: `rental-agreement-${bookingId}.pdf`, available: signedAvailable, icon: "description" },
    { name: "Rules & Guidelines PDF", url: "/renter-guidelines.pdf", filename: "alamo-rules-guidelines.pdf", available: true, icon: "policy" },
  ];
  async function open(doc: typeof documents[number], download: boolean) {
    setBusy(doc.name); setError(null);
    try {
      const response = await fetch(doc.url, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error ?? "Could not open this document. Please try again.");
      }
      if (!response.headers.get("content-type")?.includes("application/pdf")) throw new Error("Please sign in again to open your documents.");
      const url = URL.createObjectURL(await response.blob());
      urls.current.push(url);
      if (download) {
        const link = document.createElement("a"); link.href = url; link.download = doc.filename;
        document.body.appendChild(link); link.click(); link.remove();
      } else setPreview({ name: doc.name, url });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not open document."); }
    finally { setBusy(null); }
  }
  return <section aria-label="My Documents" className="space-y-4">
    <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase"><Icon name="folder_open" className="text-primary" />My Documents</h2>
    {documents.map(doc => <div key={doc.name} className="bg-surface-container rounded-lg p-4 border-l-4 border-primary/40">
      <div className="flex items-center gap-3"><Icon name={doc.icon} className="text-primary" /><h3 className="font-bold text-sm">{doc.name}</h3></div>
      {doc.available ? <div className="flex gap-3 mt-3">
        <button onClick={() => void open(doc, false)} disabled={busy !== null} className="min-h-[44px] px-4 bg-surface-container-high font-bold text-sm disabled:opacity-50">View PDF</button>
        <button onClick={() => void open(doc, true)} disabled={busy !== null} aria-label={`Download ${doc.name}`} className="min-h-[44px] px-4 bg-surface-container-high font-bold text-sm disabled:opacity-50">Download</button>
        {busy === doc.name && <span role="status" className="self-center text-xs">Loading…</span>}
      </div> : <p className="text-xs text-on-surface-variant mt-2">Available after the agreement is signed and processed.</p>}
    </div>)}
    {error && <p role="alert" className="text-error text-sm">{error}</p>}
    {preview && <div className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2"><a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-primary underline min-h-[44px] py-3">Open {preview.name}</a><button onClick={() => setPreview(null)} className="min-h-[44px] px-3 bg-surface-container-high">Close Preview</button></div>
      <iframe src={preview.url} title={preview.name} className="w-full h-[32rem] rounded bg-white" />
    </div>}
  </section>;
}
