import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alamo City Hitch & Go Co. | San Antonio's Top-Rated Trailer Rentals",
  description:
    "Hassle-Free Trailer Rentals in San Antonio, TX. Heavy-duty hauling, zero paperwork headaches. Pull & Go.",
  keywords: [
    "trailer rental san antonio",
    "trailer rental san antonio tx",
    "utility trailer rental san antonio",
    "car hauler rental san antonio",
    "enclosed trailer rental san antonio",
  ],
  openGraph: {
    title: "Alamo City Hitch & Go Co.",
    description:
      "San Antonio's top-rated trailer rentals. Industrial-grade equipment, hassle-free process.",
    locale: "en_US",
    type: "website",
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
        className={`${spaceGrotesk.variable} ${manrope.variable} min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
