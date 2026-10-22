import { createHmac, randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { authSecret, hasFirebase, hasProductionAuthSecret, firebaseAdminProjectId } from '@/lib/env';
import { trailers } from '@/lib/data/trailers';
import { saveRequest, type RequestRecord } from './core';
function setting(name: string) { return process.env[name]?.trim(); }
// Additive intake collection; never mix request-only records with confirmed bookings or Preview's approval-to-checkout records.
function namespace() { const base = setting('BOOKING_COLLECTION'); if (!base || !/^[A-Za-z0-9_-]+$/.test(base))
    throw Error('Request storage is unavailable.'); return `${base}_rental_requests`; }
function database() { if (!hasFirebase || !hasProductionAuthSecret || authSecret.length < 32)
    throw Error('Request storage is unavailable.'); const auth = getFirebaseAdmin(); if (!auth)
    throw Error('Request storage is unavailable.'); return getFirestore(auth.app); }
function mailConfig() { const key = setting('RESEND_API_KEY'), from = setting('EMAIL_FROM'); if (!key || !from)
    throw Error('Request notifications are unavailable.'); return { key, from }; }
/** Read-only checks; never creates a lead, notification, payment or envelope. */
export async function requestReadiness() {
    try {
        await database().collection(namespace()).limit(1).get();
        // Check write permissions without creating a test request or changing IAM.
        const credential = getFirebaseAdmin()?.app.options.credential;
        if (!credential || !firebaseAdminProjectId) return false;
        const token = await credential.getAccessToken();
        const permissions = ['datastore.entities.get', 'datastore.entities.list', 'datastore.entities.create', 'datastore.entities.update'];
        const permissionResponse = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${encodeURIComponent(firebaseAdminProjectId)}:testIamPermissions`, {
            method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissions }), cache: 'no-store', signal: AbortSignal.timeout(5000),
        });
        if (!permissionResponse.ok) return false;
        const granted = (await permissionResponse.json()).permissions ?? [];
        if (!permissions.every(permission => granted.includes(permission))) return false;
        const { key, from } = mailConfig(), response = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (response.status === 401)
            return false;
        if (response.ok) {
            const result = await response.json(), domain = from.match(/@([^>\s]+)/)?.[1]?.toLowerCase();
            if (!result.data?.some((d: {
                name: string;
                status: string;
            }) => d.name.toLowerCase() === domain && d.status === 'verified'))
                return false;
        }
        else if (response.status !== 403)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
export async function captureRequest(raw: unknown, network: string) {
    const db = database(), collection = namespace();
    mailConfig();
    return saveRequest(raw, {
        save: async (record) => {
            if (!trailers.some(t => t.id === record.trailerId && t.status === 'available'))
                throw Error('Choose a trailer currently offered for rental.');
            const digest = (v: string) => createHmac('sha256', authSecret).update(`pickup-request-rate:${v}`).digest('hex');
            const ref = db.collection(collection).doc(record.id), rate = db.collection(`${collection}_rates`), nr = rate.doc(`network-${digest(network)}`), er = rate.doc(`email-${digest(record.email)}`);
            return db.runTransaction(async (tx) => {
                const old = await tx.get(ref);
                if (old.exists) {
                    const prior = old.data() as RequestRecord;
                    for (const key of ['submissionKey', 'firstName', 'lastName', 'email', 'phone', 'trailerId', 'date', 'time', 'duration', 'outsideHours', 'message'] as const)
                        if (prior[key] !== record[key])
                            throw Error('Request details changed. Start a new request.');
                    return { record: prior, created: false };
                }
                const [ns, es] = await Promise.all([tx.get(nr), tx.get(er)]), now = Date.now();
                const quota = (v: unknown, window: number, limit: number) => { const stamps = Array.isArray(v) ? v.filter(s => typeof s === 'number' && s > now - window) : []; if (stamps.length >= limit)
                    throw Error('Too many requests. Please wait before trying again.'); return [...stamps, now]; };
                const n = quota(ns.data()?.stamps, 600000, 5), e = quota(es.data()?.stamps, 3600000, 3);
                tx.create(ref, record);
                tx.set(nr, { stamps: n });
                tx.set(er, { stamps: e });
                return { record, created: true };
            });
        },
        notify: async (record) => {
            const ref = db.collection(collection).doc(record.id), claim = randomUUID(), now = Date.now();
            const claimed = await db.runTransaction(async (tx) => { const r = (await tx.get(ref)).data(); if (r?.notificationStatus === 'accepted')
                return 'accepted'; if ((r?.notificationLeaseUntil ?? 0) > now)
                return 'pending'; tx.update(ref, { notificationClaim: claim, notificationLeaseUntil: now + 60000 }); return 'claimed'; });
            if (claimed !== 'claimed')
                return claimed === 'accepted';
            const { key, from } = mailConfig(), trailer = trailers.find(t => t.id === record.trailerId);
            const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `rental-request-${record.id}` }, signal: AbortSignal.timeout(10000), body: JSON.stringify({ from, to: ['booking@alamocityhitchandgo.com'], reply_to: record.email, subject: `Rental request — ${trailer?.name ?? 'Trailer'} — ${record.date}`, text: `REQUEST ONLY — NOT A CONFIRMED RESERVATION\nReference: ${record.id}\n${record.firstName} ${record.lastName}\n${record.email}\n${record.phone}\nTrailer: ${trailer?.name}\nRequested pickup: ${record.date} ${record.time} Central Time\nDuration: ${record.duration}\nRequested return: ${record.endTime}\nOutside normal hours: ${record.outsideHours ? 'Yes' : 'No'}\nMessage: ${record.message}\n\nNo payment or deposit hold was created. JB must check availability and contact the renter to confirm arrangements. This request does not reserve inventory.` }) });
            const body = await response.json().catch(() => null), accepted = response.ok && typeof body?.id === 'string';
            await db.runTransaction(async (tx) => { if ((await tx.get(ref)).data()?.notificationClaim === claim)
                tx.update(ref, { notificationStatus: accepted ? 'accepted' : 'pending', notificationLeaseUntil: 0, ...(accepted ? { notificationId: body.id } : {}) }); });
            return accepted;
        }
    });
}
