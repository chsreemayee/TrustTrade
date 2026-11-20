import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "../lib/i18n";

export const metadata: Metadata = {
  title: "TrustTrade - Voice-first Investment & Scam Checker",
  description: "Educational voice-first app to spot financial scams and practise safe trading.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TrustTrade",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F5C5C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
