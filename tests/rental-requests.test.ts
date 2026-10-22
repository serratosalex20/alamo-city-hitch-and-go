import test from 'node:test';
import assert from 'node:assert/strict';
import { requestSchema, requestedSchedule, saveRequest, type RequestRecord, type RequestInput } from '../src/lib/rental-requests/core';
const input: RequestInput = { submissionKey: '2f42939f-2971-4f69-8470-564ee13ba74e', firstName: 'Test', lastName: 'Renter', email: 'TEST@example.com', phone: '2105550123', trailerId: 'enclosed-20', date: '2026-11-10', time: '08:00', duration: 'fullDay', message: '', outsideHours: false };
test('a saved request stays pending with no reservation or payment state', async () => {
    let stored: RequestRecord | undefined;
    const result = await saveRequest(input, { save: async (r) => { stored = r; return { record: r, created: true }; }, notify: async () => false }, new Date('2026-10-22').getTime());
    assert.equal(result.notificationAccepted, false);
    assert.equal(stored?.status, 'pending');
    assert.equal(stored?.email, 'test@example.com');
    assert.equal(stored?.startTime, '2026-11-10T14:00:00.000Z');
    assert.equal(stored?.endTime, '2026-11-11T14:00:00.000Z');
    assert.equal('paymentIntentId' in stored!, false);
    assert.equal('bookingId' in stored!, false);
});
test('failed persistence never returns a receipt or sends notification', async () => {
    let notified = false;
    await assert.rejects(saveRequest(input, { save: async () => { throw Error('offline'); }, notify: async () => { notified = true; return true; } }, Date.parse('2026-10-22')), /offline/);
    assert.equal(notified, false);
});
test('notification failure preserves the durable receipt without claiming delivery', async () => {
    const result = await saveRequest(input, { save: async (r) => ({ record: r, created: true }), notify: async () => { throw Error('timeout'); } }, Date.parse('2026-10-22'));
    assert.equal(result.requestId, input.submissionKey);
    assert.equal(result.notificationAccepted, false);
});
test('normal pickup is 8 AM through 6 PM; exceptions require an explicit request', () => {
    assert.throws(() => requestedSchedule({ ...input, time: '07:30' }, Date.parse('2026-10-22')), /outside-hours/);
    assert.equal(requestedSchedule({ ...input, time: '07:30', outsideHours: true }, Date.parse('2026-10-22')).startTime, '2026-11-10T13:30:00.000Z');
    assert.equal(requestedSchedule({ ...input, time: '18:00' }, Date.parse('2026-10-22')).startTime, '2026-11-11T00:00:00.000Z');
});
test('rejects past, invalid, ambiguous and nonexistent Central times', () => {
    for (const data of [{ ...input, date: '2026-02-30' }, { ...input, date: '2026-11-01', time: '01:30', outsideHours: true }, { ...input, date: '2027-03-14', time: '02:30', outsideHours: true }, { ...input, date: '2025-01-01' }])
        assert.throws(() => requestedSchedule(data, Date.parse('2026-10-22')));
});
test('validates contact, UUID, duration and half-hour slots', () => {
    for (const patch of [{ email: 'bad' }, { phone: '123' }, { submissionKey: 'guess' }, { duration: 'other' }, { time: '08:01' }])
        assert.equal(requestSchema.safeParse({ ...input, ...patch }).success, false);
});
test('the disabled checkout endpoint never contacts a payment provider', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw Error('Unexpected external call'); };
    try {
        const { POST } = await import('../src/app/api/checkout/route');
        const response = await POST();
        assert.equal(response.status, 503);
        assert.equal((await response.json()).ok, false);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('accepted notifications are not resent when the saved request is recovered', async () => {
    let sends = 0;
    const record = { ...input, ...requestedSchedule(input, Date.parse('2026-10-22')), id: input.submissionKey, status: 'pending' as const, createdAtMs: Date.parse('2026-10-22'), notificationStatus: 'accepted' as const };
    const result = await saveRequest(input, { save: async () => ({ record, created: false }), notify: async () => { sends++; return true; } }, Date.parse('2026-10-22'));
    assert.equal(result.created, false);
    assert.equal(result.notificationAccepted, true);
    assert.equal(sends, 0);
});
