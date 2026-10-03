import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import ScrollReveal from "../components/motion/ScrollReveal.js";
import { siteConfig } from "../site.config.js";
import "./globals.css";

// Texto corrido: Outfit (variable, 100-900)
const outfit = localFont({
  src: "./fonts/Outfit-VariableFont_wght.ttf",
  weight: "100 900",
  display: "swap",
  variable: "--font-outfit",
});

// Títulos: Big Noodle Titling (un solo peso) y su versión oblicua para énfasis
const bigNoodle = localFont({
  src: [
    { path: "./fonts/big_noodle_titling.ttf", weight: "400", style: "normal" },
    { path: "./fonts/big_noodle_titling_oblique.ttf", weight: "400", style: "italic" },
  ],
  display: "swap",
  variable: "--font-display-face",
});

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
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${outfit.variable} ${bigNoodle.variable}`}>
      <body>
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}
