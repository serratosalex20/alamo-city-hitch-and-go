import type { Metadata } from "next";
import { Space_Grotesk, Inter, Teko, Oswald } from "next/font/google";
import { appUrl } from "@/lib/env";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const teko = Teko({
  subsets: ["latin"],
  variable: "--font-teko",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Alamo City Hitch & Go Co. | San Antonio's Top-Rated Trailer Rentals",
    template: "%s | Alamo City Hitch & Go Co.",
  },
  description:
    "Heavy-duty trailer rentals in San Antonio, TX. Industrial-grade enclosed and dump trailers in Half Day, Full Day, 3-Day, or 2-Week blocks. Same-day pickup. Pull & Go.",
  // Sprint 3.3 fleet realignment: dropped utility + car-hauler keywords
  // (no longer in fleet), added enclosed + dump + moving + construction.
  // Meta-keywords is deprecated by Google for ranking but harmless;
  // these strings still inform some site-search engines + AI crawlers.
  keywords: [
    "trailer rental san antonio",
    "trailer rental san antonio tx",
    "enclosed trailer rental san antonio",
    "dump trailer rental san antonio",
    "moving trailer rental san antonio",
    "construction trailer rental san antonio",
    "san antonio trailer rentals near me",
    "trailer rental near me same day",
  ],
  // Reads NEXT_PUBLIC_APP_URL via @/lib/env, set on Vercel to the live deployment.
  // Falls back to localhost in dev. Audit 2026-05-15 fix: was hardcoded to a
  // DNS-NXDOMAIN domain (alamocityhitch.com) which made every canonical URL
  // point at a dead host, blocking Google indexing of the live vercel.app site.
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Alamo City Hitch & Go Co. | Heavy-Duty Trailer Rentals",
    description:
      "San Antonio's top-rated trailer rentals. Industrial-grade equipment, same-day pickup, transparent pricing.",
    locale: "en_US",
    type: "website",
    siteName: "Alamo City Hitch & Go Co.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alamo City Hitch & Go Co.",
    description:
      "Heavy-duty trailer rentals in San Antonio. Same-day pickup. Pull & Go.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "theme-color": "#0f131b",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${teko.variable} ${oswald.variable} min-h-screen`}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
