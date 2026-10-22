import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Trailer Rental",
  description:
    "Send your requested trailer and schedule. JB must confirm availability. No payment or deposit hold is taken online.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
