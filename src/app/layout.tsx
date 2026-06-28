import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeAds — Earn Rewards by Typing Real Ads",
  description:
    "TypeAds is a typing platform where you earn gift cards by typing real ad copy. Every word you type is a real advertisement — and you get rewarded for it.",
  keywords: ["typing", "earn rewards", "gift cards", "ad platform", "WPM"],
  openGraph: {
    title: "TypeAds — Earn Rewards by Typing Real Ads",
    description: "Earn gift cards by typing real ad copy. Progressive image reveal. Real rewards.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
