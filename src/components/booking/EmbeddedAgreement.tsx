"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

type Signing = { on: (event: string, callback: () => void) => void; mount: (selector: string) => void };
declare global {
  interface Window {
    DocuSign?: { loadDocuSign: (integrationKey: string) => Promise<{ signing: (options: { url: string; displayFormat: string }) => Signing }> };
  }
}

export function EmbeddedAgreement({ url, integrationKey, bookingId, onClose }: {
  url: string; integrationKey: string; bookingId: string; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const id = `agreement-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === "agreement-returned" && event.data?.bookingId === bookingId) close.current();
    };
    window.addEventListener("message", receive);
    return () => { window.removeEventListener("message", receive); document.body.style.overflow = previous; node?.close(); };
  }, [bookingId]);
  useEffect(() => {
    if (!sdkReady || !window.DocuSign) return;
    let disposed = false;
    const node = container.current;
    const timeout = window.setTimeout(() => { if (!disposed) setError("Signing is taking longer than expected. Close this window and try Review & Sign again."); }, 30000);
    void window.DocuSign.loadDocuSign(integrationKey).then(api => {
      if (disposed) return;
      const signing = api.signing({ url, displayFormat: "focused" });
      signing.on("ready", () => { if (!disposed) { window.clearTimeout(timeout); setReady(true); setError(""); } });
      signing.on("sessionEnd", () => { if (!disposed) close.current(); });
      signing.mount(`#${id}`);
    }).catch(() => { if (!disposed) setError("Could not load signing. Close this window and try Review & Sign again."); });
    return () => { disposed = true; window.clearTimeout(timeout); node?.replaceChildren(); };
  }, [sdkReady, integrationKey, url, id]);
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); close.current(); }} aria-labelledby="signing-title"
    className="m-auto w-[96vw] max-w-5xl h-[92dvh] max-h-[92dvh] bg-surface-container text-on-surface p-0 backdrop:bg-black/70">
    <Script src="https://js.docusign.com/bundle.js" onReady={() => setSdkReady(true)} onError={() => setError("Could not load DocuSign. Close this window and try again.")} />
    <div className="flex justify-between items-center p-4 border-b border-white/10">
      <h2 id="signing-title" className="font-headline font-bold text-xl">Review &amp; Sign Your Agreement</h2>
      <button type="button" onClick={() => close.current()} className="min-h-[44px] px-4 bg-surface-container-highest">Close</button>
    </div>
    {!ready && !error && <p role="status" className="p-4">Loading secure signing…</p>}
    {error && <p role="alert" className="p-4 text-error">{error}</p>}
    <div id={id} ref={container} className="w-full h-[calc(100%-76px)] min-h-[350px] bg-white" />
  </dialog>;
}
