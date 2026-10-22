import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminSession } from "@/lib/auth/authorization";
import {
  assertSameOrigin,
  readRequestJson,
} from "@/lib/pickup-requests/submission";
import { PickupRequestError } from "@/lib/pickup-requests/repository";
import { handlePickupRequestAction } from "@/lib/pickup-requests/service";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session)
      throw new PickupRequestError("Owner access is required.", 403);
    assertSameOrigin(request);
    const { id } = await params;
    const delivery = await handlePickupRequestAction(
      id,
      await readRequestJson(request),
      session,
    );
    return NextResponse.json({ ok: true, delivery });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof ZodError
            ? error.issues[0]?.message
            : error instanceof PickupRequestError
              ? error.message
              : "The request could not be updated. Please try again.",
      },
      {
        status:
          error instanceof PickupRequestError
            ? error.status
            : error instanceof ZodError
              ? 400
              : 503,
      },
    );
  }
}
