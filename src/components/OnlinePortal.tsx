import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { contactBookingOnly } from "@/lib/env";

/** Keep legacy portal links useful while production takes call/text reservations. */
export default function OnlinePortal({ children }: { children: ReactNode }) {
  if (contactBookingOnly) redirect("/book");
  return children;
}
