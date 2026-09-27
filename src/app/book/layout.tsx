import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Trailer",
  description:
    "Reserve an enclosed or utility trailer in San Antonio. Contact Alamo City Hitch & Go for available dates, rental rates, and pickup arrangements.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
