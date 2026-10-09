import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import "@/components/cards/cards.css";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Takht — who sits on the throne?", template: "%s · Takht" },
  description:
    "Takht is the pay-to-rank leaderboard for Pakistani businesses. Pay Rs 1 more than the business above you to take its rank.",
  openGraph: { siteName: "Takht", locale: "en_PK", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#0B2F25",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK">
      <body>{children}</body>
    </html>
  );
}
