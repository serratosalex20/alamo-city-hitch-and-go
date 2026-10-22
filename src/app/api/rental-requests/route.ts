import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { captureRequest, requestReadiness } from '@/lib/rental-requests/server';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ available: await requestReadiness() }, { headers: { 'Cache-Control': 'no-store' } }); }
export async function POST(request: Request) {
    if (request.headers.get('origin') !== new URL(request.url).origin)
        return NextResponse.json({ ok: false, error: 'Invalid request origin.' }, { status: 403 });
    try {
        const reader = request.body?.getReader();
        if (!reader)
            throw Error('Missing details.');
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            size += value.length;
            if (size > 12000) {
                await reader.cancel();
                return NextResponse.json({ ok: false, error: 'Request is too large.' }, { status: 413 });
            }
            chunks.push(value);
        }
        const raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (raw.website)
            throw Error('Unable to accept request.');
        const address = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : undefined;
        const receipt = await captureRequest(raw, address && isIP(address) ? address : 'unknown-network');
        return NextResponse.json({ ok: true, ...receipt }, { status: receipt.created ? 201 : 200, headers: { 'Cache-Control': 'no-store' } });
    }
    catch (error) {
        const validation = error instanceof Error && (error.name === 'ZodError' || /Choose|Pickup|outside-hours|Central Time|details changed|Too many/.test(error.message));
        return NextResponse.json({ ok: false, error: validation && error instanceof Error && error.name !== 'ZodError' ? error.message : 'Your request could not be saved. Please check the details or call JB at 210-269-3467.' }, { status: validation ? 400 : 503 });
    }
}
