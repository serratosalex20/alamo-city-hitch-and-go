import { NextResponse } from "next/server";
import { z } from "zod";
import { trailers } from "@/lib/data/trailers";
import { buildRentalSchedule } from "@/lib/booking/schedule";
import {
  checkBookingAvailability,
  isPersistenceReady,
} from "@/lib/booking/repository";
import { scheduleSchema } from "@/lib/booking/validation";

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
