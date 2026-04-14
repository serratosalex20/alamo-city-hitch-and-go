import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Trailer | Alamo City Hitch & Go Co. — San Antonio TX",
  description:
    "Reserve your trailer online in minutes. Choose from utility trailers, car haulers, and enclosed cargo trailers. Same-day pickup available in San Antonio.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
