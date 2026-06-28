import type { Metadata } from "next";
import { Playfair_Display, IM_Fell_English, Libre_Baskerville, Courier_Prime } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const canopee = localFont({
  src: "../../public/fonts/616fd1dd00cf6c70f978fc69_Canopee.woff2",
  variable: "--font-canopee",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const imFell = IM_Fell_English({
  subsets: ["latin"],
  variable: "--font-im-fell",
  weight: ["400"],
  style: ["normal", "italic"],
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-libre",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  variable: "--font-courier",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "TypeAds — Earn Rewards by Typing Real Ads",
  description: "Earn gift cards by typing real ad copy. Progressive image reveal. Real rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${imFell.variable} ${libreBaskerville.variable} ${courierPrime.variable} ${canopee.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
