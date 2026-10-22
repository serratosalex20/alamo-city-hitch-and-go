"use client";
import { useState } from "react";
import { MARKETING_CONSENT_TEXT } from "@/lib/customers/profile";

export function CustomerProfileForm({ email, initialName, initialPhone, initialMarketing }: {
  email: string; initialName: string; initialPhone: string; initialMarketing: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [emailMarketing, setEmailMarketing] = useState(initialMarketing);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const inputClass = "w-full bg-surface-container-high p-3 mt-2";
  return <form className="bg-surface-container-low p-6 ghost-border space-y-4 mb-8" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setMessage(""); setFailed(false);
    try {
      const response = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, emailMarketing }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Could not save your profile.");
      setMessage("Profile and email preference saved.");
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Could not save your profile."); }
    finally { setBusy(false); }
  }}>
    <h2 className="font-headline text-2xl font-bold uppercase">Your Profile</h2>
    <p className="text-sm text-on-surface-variant">Keep your contact details ready for your next rental. Your account stays available between bookings.</p>
    <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
      <label htmlFor="profile-name">Full name<input id="profile-name" autoComplete="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
      <label htmlFor="profile-phone">Phone number<input id="profile-phone" type="tel" autoComplete="tel" required maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} /></label>
      <label htmlFor="profile-email" className="sm:col-span-2">Verified email<input id="profile-email" type="email" value={email} readOnly className={`${inputClass} opacity-70`} /></label>
      <label className="sm:col-span-2 flex items-start gap-3"><input type="checkbox" checked={emailMarketing} onChange={(event) => setEmailMarketing(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" /><span>{MARKETING_CONSENT_TEXT}</span></label>
    </fieldset>
    <p className="text-xs text-on-surface-variant">Uncheck the box and save to stop promotional emails. Booking messages are separate. See our <a href="/privacy" className="underline">privacy notice</a>.</p>
    <button disabled={busy} className="min-h-[44px] px-5 py-3 bg-primary-action font-bold uppercase disabled:opacity-40">{busy ? "Saving…" : "Save Profile"}</button>
    {message && <p role={failed ? "alert" : "status"} className={failed ? "text-error" : "text-green-400"}>{message}</p>}
  </form>;
}
