import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Trailer Online",
  description:
    "Reserve your San Antonio trailer rental online in minutes. Enclosed cargo trailers and dump trailers. Half Day, Full Day, 1 Week, or 2 Weeks (15 days) blocks. Same-day pickup. Pull & Go.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
