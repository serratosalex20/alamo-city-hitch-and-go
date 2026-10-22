import { NextResponse } from 'next/server';
/** Approved temporary request-only release: never create a Stripe customer or intent. */
export async function POST() { return NextResponse.json({ ok: false, error: 'Online payment is unavailable. Send a rental request; JB must confirm availability. No payment or deposit hold has been created.' }, { status: 503 }); }
