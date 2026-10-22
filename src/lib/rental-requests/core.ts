import { z } from 'zod';
export const requestSchema = z.object({
    submissionKey: z.string().uuid(), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
    phone: z.string().trim().max(30).refine(v => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 15, 'Enter a valid phone number.'),
    trailerId: z.string().min(1).max(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/),
    duration: z.enum(['halfDay', 'fullDay', 'oneWeek', 'twoWeeks']), outsideHours: z.boolean().default(false), message: z.string().trim().max(1000).default(''),
});
export type RequestInput = z.infer<typeof requestSchema>;
export type RequestRecord = RequestInput & {
    id: string;
    status: 'pending';
    startTime: string;
    endTime: string;
    createdAtMs: number;
    notificationStatus: 'pending' | 'accepted';
    notificationId?: string;
};
const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const hours = { halfDay: 12, fullDay: 24, oneWeek: 168, twoWeeks: 360 };
export function requestedSchedule(raw: RequestInput, nowMs = Date.now()) {
    const input = requestSchema.parse(raw), [year, month, day] = input.date.split('-').map(Number), [hour, minute] = input.time.split(':').map(Number);
    if (!input.outsideHours && (hour < 8 || hour > 18 || (hour === 18 && minute > 0)))
        throw Error('Use the outside-hours request option for this time.');
    const desired = { year, month, day, hour, minute }, wall = Date.UTC(year, month - 1, day, hour, minute), matches: number[] = [];
    for (let offset = -14 * 60; offset <= 14 * 60; offset += 30) {
        const candidate = wall + offset * 60000, actual = Object.fromEntries(formatter.formatToParts(candidate).map(p => [p.type, Number(p.value)]));
        if (Object.entries(desired).every(([k, v]) => actual[k] === v))
            matches.push(candidate);
    }
    if (matches.length !== 1)
        throw Error('Choose a valid, unambiguous Central Time pickup.');
    if (matches[0] <= nowMs)
        throw Error('Pickup must be in the future.');
    return { startTime: new Date(matches[0]).toISOString(), endTime: new Date(matches[0] + hours[input.duration] * 3600000).toISOString() };
}
export async function saveRequest(raw: unknown, dependencies: {
    save: (record: RequestRecord) => Promise<{
        record: RequestRecord;
        created: boolean;
    }>;
    notify: (record: RequestRecord) => Promise<boolean>;
}, nowMs = Date.now()) {
    const input = requestSchema.parse(raw), schedule = requestedSchedule(input, nowMs);
    const saved = await dependencies.save({ ...input, ...schedule, id: input.submissionKey, status: 'pending', createdAtMs: nowMs, notificationStatus: 'pending' });
    let notificationAccepted = saved.record.notificationStatus === 'accepted';
    if (!notificationAccepted) {
        try {
            notificationAccepted = await dependencies.notify(saved.record);
        }
        catch { /* Saved requests survive uncertain email delivery. */ }
    }
    return { requestId: saved.record.id, notificationAccepted, created: saved.created };
}
