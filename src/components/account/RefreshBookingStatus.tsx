"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresh server-owned status after owner actions, while preserving client form state. */
export function RefreshBookingStatus({ enabled = true }: { enabled?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      if (document.visibilityState !== "visible" || document.querySelector("dialog[open]") || document.activeElement?.closest("form")) return;
      router.refresh();
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, router]);
  return null;
}
