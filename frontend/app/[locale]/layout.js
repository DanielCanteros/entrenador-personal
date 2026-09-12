import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing.js";
import Header from "../../components/Header.js";
import Footer from "../../components/Footer.js";
import JsonLd from "../../components/JsonLd.js";
import { LocaleAlternatesProvider } from "../../context/LocaleAlternatesContext.js";
import {
  personSchema,
  localBusinessSchema,
  websiteSchema,
  withGraph,
} from "../../lib/schema.js";
import { absoluteUrl, buildAlternates } from "../../lib/seo.js";
import { siteConfig } from "../../site.config.js";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: {
      default: t("homeTitle"),
      template: `%s | ${siteConfig.brandName}`,
    },
    description: t("homeDescription"),
    alternates: {
      canonical: absoluteUrl(locale, "/"),
      languages: buildAlternates("/"),
    },
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: absoluteUrl(locale, "/"),
      siteName: siteConfig.brandName,
      locale: locale === "pt" ? "pt_BR" : "es_PY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("homeTitle"),
      description: t("homeDescription"),
    },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
    other: {
      "geo.region": siteConfig.location.geoRegionCode,
      "geo.placename": siteConfig.location.city,
      "geo.position": `${siteConfig.location.latitude};${siteConfig.location.longitude}`,
      ICBM: `${siteConfig.location.latitude}, ${siteConfig.location.longitude}`,
    },
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <JsonLd
        data={withGraph(
          localBusinessSchema(locale),
          personSchema(locale),
          websiteSchema(locale)
        )}
      />
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <LocaleAlternatesProvider>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </LocaleAlternatesProvider>
    </NextIntlClientProvider>
  );
}
