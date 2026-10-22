'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { trailers } from '@/lib/data/trailers';
import { ALL_DURATIONS, DURATION_LABELS } from '@/lib/booking/pricing';
import { formatBusinessDate } from '@/lib/booking/schedule';
import { PickupDatePicker } from './PickupDatePicker';
import { PickupTimePicker } from './PickupTimePicker';
import { requestSchema, requestedSchedule, type RequestInput } from '@/lib/rental-requests/core';
const inputClass = 'w-full bg-surface-container-low border border-outline-variant p-3 min-h-12';
const times = Array.from({ length: 48 }, (_, i) => { const hour = Math.floor(i / 2), minute = i % 2 ? '30' : '00'; return { value: `${String(hour).padStart(2, '0')}:${minute}`, label: `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}` }; });
const initial = { submissionKey: '', firstName: '', lastName: '', email: '', phone: '', trailerId: '', date: '', time: '', duration: 'fullDay' as const, message: '', outsideHours: false };
export function RentalRequestForm() {
    const [draft, setDraft] = useState<RequestInput>(initial), [month, setMonth] = useState(''), [today, setToday] = useState(''), [available, setAvailable] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState<{
        requestId: string;
        notificationAccepted: boolean;
    } | null>(null);
    useEffect(() => { const day = formatBusinessDate(Date.now()); setToday(day); setMonth(day.slice(0, 7)); setDraft(d => ({ ...d, submissionKey: crypto.randomUUID() })); let live = true; fetch('/api/rental-requests', { cache: 'no-store' }).then(r => r.json()).then(r => { if (live)
        setAvailable(r.available === true); }).catch(() => { if (live)
        setAvailable(false); }); return () => { live = false; }; }, []);
    function change(patch: Partial<RequestInput>) { setDraft(d => ({ ...d, ...patch })); setError(''); }
    async function submit(event: FormEvent) { event.preventDefault(); if (busy || !available)
        return; setError(''); const parsed = requestSchema.safeParse(draft); if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Check your details.');
        return;
    } try {
        requestedSchedule(parsed.data);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Check your pickup time.');
        return;
    } setBusy(true); try {
        const response = await fetch('/api/rental-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) }), result = await response.json();
        if (!response.ok || !result.ok)
            throw Error(result.error ?? 'Your request could not be saved.');
        setReceipt(result);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Your request could not be saved. Please retry with the same details or call JB.');
    }
    finally {
        setBusy(false);
    } }
    if (receipt)
        return <section role="status" className="bg-surface-container p-6 space-y-4"><h2 className="text-3xl font-headline uppercase">Request received</h2><p>Your request was saved. <strong>This is not a confirmed reservation.</strong> JB must contact you to confirm trailer availability and arrangements. No payment or deposit hold has been created.</p><p className="break-all">Request reference: {receipt.requestId}</p><p>{receipt.notificationAccepted ? 'The email service accepted the notification to JB. Please wait for his personal confirmation.' : 'The request is saved, but the notification to JB could not be confirmed. Please call him and quote your request reference.'}</p><a className="inline-block underline min-h-11 py-3" href="tel:+12102693467">Call JB: 210-269-3467</a></section>;
    if (available === null)
        return <p role="status">Checking request availability…</p>;
    if (!available)
        return <section role="status" className="bg-surface-container p-6"><p>Online requests are temporarily unavailable. No request has been submitted. Please contact JB to ask about availability.</p><a className="inline-block underline min-h-11 py-3" href="tel:+12102693467">Call JB: 210-269-3467</a></section>;
    const options = times.filter(o => draft.outsideHours ? o.value < '08:00' || o.value > '18:00' : o.value >= '08:00' && o.value <= '18:00');
    return <form onSubmit={submit} className="space-y-6"><fieldset disabled={busy} className="space-y-6"><div><label htmlFor="request-trailer" className="block mb-2">Trailer *</label><select id="request-trailer" required className={inputClass} value={draft.trailerId} onChange={e => change({ trailerId: e.target.value })}><option value="">Choose a trailer</option>{trailers.filter(t => t.status === 'available').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><p className="text-sm mt-2">Listings do not guarantee availability for your requested dates.</p></div><div><label htmlFor="booking-date" className="block mb-2">Requested pickup date *</label>{month && <PickupDatePicker value={draft.date} month={month} today={today} onMonthChange={setMonth} onChange={date => change({ date, time: '' })}/>}</div><div><label htmlFor="booking-time" className="block mb-2">Requested pickup time *</label><PickupTimePicker value={draft.time} options={options} disabled={!draft.date} onChange={time => change({ time })}/><p className="text-sm mt-2">8 AM–6 PM daily, Central Time. All requests need JB’s confirmation.</p><button type="button" className="underline text-sm min-h-11" onClick={() => change({ outsideHours: !draft.outsideHours, time: '' })}>{draft.outsideHours ? 'Use normal pickup hours' : 'Need an outside-hours pickup? Request another time'}</button>{draft.outsideHours && <p className="text-sm">Outside-hours request only — JB may decline the requested time.</p>}</div><div><label htmlFor="request-duration" className="block mb-2">Rental duration *</label><select id="request-duration" className={inputClass} value={draft.duration} onChange={e => change({ duration: e.target.value as RequestInput['duration'] })}>{ALL_DURATIONS.map(d => <option key={d} value={d}>{DURATION_LABELS[d]}{d === 'twoWeeks' ? ' (15 calendar days)' : ''}</option>)}</select></div><div className="grid sm:grid-cols-2 gap-4">{(['firstName', 'lastName', 'email', 'phone'] as const).map(key => <div key={key}><label htmlFor={`request-${key}`} className="block mb-2">{{ firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone' }[key]} *</label><input id={`request-${key}`} required type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} autoComplete={{ firstName: 'given-name', lastName: 'family-name', email: 'email', phone: 'tel' }[key]} maxLength={key === 'email' ? 254 : key === 'phone' ? 30 : 80} className={inputClass} value={draft[key]} onChange={e => change({ [key]: e.target.value })}/></div>)}</div><div><label htmlFor="request-message" className="block mb-2">Anything JB should know? (optional)</label><textarea id="request-message" maxLength={1000} className={inputClass} value={draft.message} onChange={e => change({ message: e.target.value })}/></div><p className="text-sm">We use your contact details to respond to this rental request. No payment details, driver license or insurance upload is needed here.</p>{error && <p role="alert" className="text-error">{error}</p>}<button type="submit" disabled={busy} className="min-h-12 px-6 py-4 bg-primary-action text-white font-bold uppercase disabled:opacity-50">{busy ? 'Saving request…' : 'Send rental request'}</button></fieldset></form>;
}
