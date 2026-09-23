import { NextResponse } from "next/server";
import { z } from "zod";
import { trailers } from "@/lib/data/trailers";
import { buildRentalSchedule } from "@/lib/booking/schedule";
import {
  checkBookingAvailability,
  getPickupAvailability,
  isPersistenceReady,
} from "@/lib/booking/repository";
import { rentalDurationSchema, scheduleSchema } from "@/lib/booking/validation";

const calendarSchema = z.object({
  trailerId: z.string().trim().min(1),
  duration: rentalDurationSchema,
  month: z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/),
});

export async function GET(request: Request) {
  const input = calendarSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!input.success) {
    return NextResponse.json({ ok: false, error: "Choose a trailer, rental duration, and valid calendar month." }, { status: 400 });
  }
  const { trailerId, duration, month } = input.data;
  const trailer = trailers.find(item => item.id === trailerId);
  if (!trailer || trailer.status !== "available") {
    return NextResponse.json({ ok: false, error: "This trailer is not currently bookable." }, { status: 400 });
  }
  if (!isPersistenceReady()) {
    return NextResponse.json({ ok: false, error: "Online scheduling is temporarily unavailable." }, { status: 503 });
  }
  try {
    const checkedAtMs = Date.now();
    const days = await getPickupAvailability(trailerId, month, duration, trailer.inventoryCount + trailer.virtualBoost, checkedAtMs);
    return NextResponse.json({ ok: true, days, checkedAtMs }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "We could not load available pickups. Please try again." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let input: z.infer<typeof scheduleSchema>;
  try {
    input = scheduleSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid schedule.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (!isPersistenceReady()) {
    return NextResponse.json(
      { ok: false, error: "Online scheduling is temporarily unavailable." },
      { status: 503 },
    );
  }

  const trailer = trailers.find((item) => item.id === input.trailerId);
  if (!trailer || trailer.status !== "available") {
    return NextResponse.json(
      { ok: false, error: "This trailer is not currently bookable." },
      { status: 400 },
    );
  }

  try {
    const schedule = buildRentalSchedule(input.date, input.time, input.duration);
    const available = await checkBookingAvailability(
      input.trailerId,
      schedule.startTimeMs,
      schedule.endTimeMs,
      trailer.inventoryCount + trailer.virtualBoost,
    );
    return NextResponse.json({ ok: true, available, schedule });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Availability check failed." },
      { status: 400 },
    );
  }
}
