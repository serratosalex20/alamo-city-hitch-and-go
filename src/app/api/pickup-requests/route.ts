import { after } from "next/server";
import { deliverPickupRequestNotifications } from "@/lib/pickup-requests/notifications";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { submitPickupRequest } from "@/lib/pickup-requests/submission";
import { PickupRequestError } from "@/lib/pickup-requests/repository";
export async function POST(request: Request) {
  try {
    const receipt = await submitPickupRequest(request);
    after(async () => {
      try {
        await deliverPickupRequestNotifications(receipt.requestId);
      } catch {
        console.error("[pickup-request-delivery] delivery pending");
      }
    });
    return NextResponse.json(
      { ok: true, requestId: receipt.requestId, status: "received" },
      { status: receipt.created ? 201 : 200 },
    );
  } catch (error) {
    const status =
      error instanceof PickupRequestError
        ? error.status
        : error instanceof ZodError
          ? 400
          : 503;
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof ZodError
            ? error.issues[0]?.message
            : error instanceof PickupRequestError
              ? error.message
              : "Your request could not be saved. Please try again.",
      },
      {
        status,
        headers: status === 429 ? { "Retry-After": "600" } : undefined,
      },
    );
  }
}
