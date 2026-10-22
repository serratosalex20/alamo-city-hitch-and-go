"use client";

import { useEffect, useRef, useState } from "react";
import { InspectionCamera } from "./InspectionCamera";

interface Props {
  phase: "pre" | "post";
  savedCount: number;
  disabled: boolean;
  uploading: boolean;
  onUpload: (data: FormData) => Promise<boolean>;
}

export function InspectionPhotoPicker({ phase, savedCount, disabled, uploading, onUpload }: Props) {
  const [choices, setChoices] = useState(false);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const allocated = urls.current;
    return () => { allocated.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);
  const label = phase === "pre" ? "Pre-rental" : "Return";
  const buttonClass = "min-h-[44px] px-5 py-3 bg-surface-container-high text-white font-headline font-bold uppercase tracking-widest text-xs disabled:opacity-40";

  function select(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    input.value = "";
    addFiles(files);
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    if (photos.length + files.length > 8) { setError("Select up to 8 photos per upload."); return; }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)) {
      setError("Choose JPG, PNG, or WebP photos, each 10 MB or smaller."); return;
    }
    setError("");
    const selected = files.map((file) => {
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      return { file, url };
    });
    setPhotos((previous) => [...previous, ...selected]);
  }

  return <form className="space-y-3 border-t border-white/10 pt-5" onSubmit={async (event) => {
    event.preventDefault();
    if (!photos.length || disabled) return;
    const data = new FormData();
    data.set("phase", phase);
    photos.forEach(({ file }) => data.append("files", file));
    if (await onUpload(data)) {
      photos.forEach(({ url }) => { URL.revokeObjectURL(url); urls.current.delete(url); });
      setPhotos([]);
      setChoices(false);
    }
  }}>
    <h3 className="text-xs font-bold uppercase tracking-widest">{label} Inspection Photos ({savedCount} saved)</h3>
    <button type="button" disabled={disabled || cameraOpen} aria-expanded={choices} aria-controls={`${phase}-photo-options`} onClick={() => setChoices(!choices)} className={`${buttonClass} border border-primary`}>Add {label} Photos</button>
    {choices && <div id={`${phase}-photo-options`} className="flex flex-wrap gap-3">
      <button type="button" disabled={disabled || cameraOpen} onClick={() => upload.current?.click()} className={buttonClass}>Upload from device</button>
      <button type="button" disabled={disabled || cameraOpen || photos.length >= 8} onClick={() => setCameraOpen(true)} className={buttonClass}>Camera — take photo</button>
      <p className="w-full text-xs text-on-surface-variant">Up to 8 photos per upload; JPG, PNG, or WebP, 10 MB each.</p>
    </div>}
    <input ref={upload} type="file" hidden accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => select(event.currentTarget)} />
    {cameraOpen && <InspectionCamera onCapture={(file) => addFiles([file])} onClose={() => setCameraOpen(false)} />}
    {photos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {photos.map(({ file, url }) => <div key={url} className="space-y-2">
        {/* Local file previews use temporary blob URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Selected inspection photo: ${file.name}`} className="h-28 w-full rounded object-cover" />
        <p className="truncate text-xs">{file.name}</p>
        <button type="button" disabled={disabled} className="min-h-[44px] text-sm underline" aria-label={`Remove ${file.name}`} onClick={() => {
          URL.revokeObjectURL(url); urls.current.delete(url);
          setPhotos((previous) => previous.filter((photo) => photo.url !== url));
        }}>Remove</button>
      </div>)}
    </div>}
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    <div><button type="submit" disabled={disabled || cameraOpen || photos.length === 0} className={buttonClass}>{uploading ? "Uploading…" : `Upload ${label} Photos${photos.length ? ` (${photos.length})` : ""}`}</button></div>
  </form>;
}
