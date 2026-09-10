import type { Metadata, Viewport } from "next";
import "./globals.css";

// TODO: fill in the real metadata — this is still the default create-next-app setup
export const metadata: Metadata = {
  title: "Fluvia — Get paid in dollars. Settle in minutes.",
  description:
    "Fluvia is the on/off-ramp that makes stablecoins boring enough to actually use. Invoice, get paid and settle in USDC/USDT — in minutes, for cents.",
  keywords: ["stablecoin", "usdc", "usdt", "payments", "latam", "freelancers", "on-ramp", "off-ramp"],
};

export const viewport: Viewport = {
  themeColor: "#060809",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
