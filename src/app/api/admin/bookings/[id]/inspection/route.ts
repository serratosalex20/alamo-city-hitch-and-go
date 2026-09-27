import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/authorization";
import { getBooking, updateBooking } from "@/lib/booking/repository";
import { getStorageBucket } from "@/lib/firebase/admin";
import { bookingStoragePrefix, isDemoEnvironment } from "@/lib/env";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_PHOTOS = 8;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

  try {
    const { id } = await params;
    const booking = await getBooking(id);
    if (!booking) throw new Error("Booking not found.");
    const form = await request.formData();
    const phase = String(form.get("phase"));
    if (phase !== "pre" && phase !== "post") throw new Error("Choose pre-rental or return inspection.");
    if (phase === "pre" && !["confirmed", "deposit_action_required", "ready_for_pickup"].includes(booking.status)) {
      throw new Error("Pre-rental photos can only be added to an approved booking before pickup.");
    }
    if (phase === "post" && booking.status !== "return_inspection") {
      throw new Error("Return photos can only be added after the trailer is marked returned.");
    }
    const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length < 1 || files.length > MAX_PHOTOS) throw new Error(`Upload 1 to ${MAX_PHOTOS} photos.`);
    for (const file of files) {
      if (!ALLOWED.has(file.type)) throw new Error("Inspection photos must be JPG, PNG, or WebP.");
      if (file.size > MAX_PHOTO_BYTES) throw new Error("Each inspection photo must be 10 MB or smaller.");
    }

    const bucket = getStorageBucket();
    if (!bucket && !isDemoEnvironment) throw new Error("Secure photo storage is unavailable.");
    const paths: string[] = [];
    for (const file of files) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${bookingStoragePrefix}/${id}/inspections/${phase}/${randomUUID()}.${extension}`;
      if (bucket) {
        await bucket.file(path).save(Buffer.from(await file.arrayBuffer()), {
          resumable: false,
          validation: "crc32c",
          metadata: {
            contentType: file.type,
            contentDisposition: "attachment",
            metadata: { bookingId: id, phase },
          },
        });
      }
      paths.push(path);
    }

    const field = phase === "pre" ? "preInspectionPhotos" : "postInspectionPhotos";
    const previous = booking[field];
    const updated = await updateBooking(
      id,
      { [field]: [...previous, ...paths] },
      { action: `${phase}_inspection_photos_uploaded`, actor: session.email, note: `${paths.length} photo(s)` },
    );
    return NextResponse.json({ ok: true, count: updated[field].length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Photo upload failed." },
      { status: 400 },
    );
  }
}
