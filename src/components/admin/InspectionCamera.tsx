"use client";

import { useEffect, useRef, useState } from "react";

export function InspectionCamera({ onCapture, onClose }: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    let stream: MediaStream | undefined;
    async function open() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) { media.getTracks().forEach((track) => track.stop()); return; }
        stream = media;
        if (video.current) {
          video.current.srcObject = media;
          await video.current.play();
        }
      } catch (cause) {
        stream?.getTracks().forEach((track) => track.stop());
        if (cancelled) return;
        const name = cause instanceof Error ? cause.name : "";
        setError(name === "NotAllowedError"
          ? "Camera access was blocked. Allow camera access in your browser settings, then close and reopen the camera. You can also upload an existing photo."
          : name === "NotFoundError"
            ? "No camera was found on this device. Connect a camera, use your phone, or upload an existing photo."
            : "The camera could not start. It may be in use by another app. Close the camera and try again, or upload an existing photo.");
      }
    }
    void open();
    return () => {
      cancelled = true;
      mounted.current = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function capture() {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight || capturing) return;
    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2048 / Math.max(source.videoWidth, source.videoHeight));
      canvas.width = Math.round(source.videoWidth * scale);
      canvas.height = Math.round(source.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Capture unavailable");
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!mounted.current) return;
      if (!blob) throw new Error("Capture failed");
      onCapture(new File([blob], `inspection-${Date.now()}.jpg`, { type: "image/jpeg" }));
      onClose();
    } catch {
      if (mounted.current) setError("Could not capture this photo. Please try again.");
    } finally {
      if (mounted.current) setCapturing(false);
    }
  }

  return <section aria-label="Inspection camera" className="space-y-3 rounded border border-primary p-4">
    <p className="font-bold">Camera preview</p>
    {!ready && !error && <p role="status">Allow camera access when your browser asks.</p>}
    <video ref={video} autoPlay muted playsInline onPlaying={() => setReady(true)} className="max-h-96 w-full rounded bg-black" />
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={!ready || capturing || !!error} onClick={() => void capture()} className="min-h-[44px] bg-primary px-5 py-3 font-bold text-white disabled:opacity-40">{capturing ? "Capturing…" : "Take photo"}</button>
      <button type="button" onClick={onClose} className="min-h-[44px] bg-surface-container-high px-5 py-3 font-bold">Close camera</button>
    </div>
    <p className="text-xs text-on-surface-variant">Your captured photo will appear below for review before you upload it.</p>
  </section>;
}
