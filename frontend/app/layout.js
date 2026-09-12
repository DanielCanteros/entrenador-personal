import { getLocale } from "next-intl/server";
import { siteConfig } from "../site.config.js";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  formatDetection: { telephone: false },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport = {
  themeColor: "#10141a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
