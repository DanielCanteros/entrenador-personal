import { getTranslations } from "next-intl/server";
import JsonLd from "../../../components/JsonLd.js";
import Services from "../../../components/Services.js";
import Pricing from "../../../components/Pricing.js";
import Faq from "../../../components/Faq.js";
import { breadcrumbSchema, withGraph } from "../../../lib/schema.js";
import { absoluteUrl, buildAlternates } from "../../../lib/seo.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("servicesTitle"),
    description: t("servicesDescription"),
    alternates: {
      canonical: absoluteUrl(locale, "/servicios"),
      languages: buildAlternates("/servicios"),
    },
    openGraph: {
      title: t("servicesTitle"),
      description: t("servicesDescription"),
      url: absoluteUrl(locale, "/servicios"),
      locale: locale === "pt" ? "pt_BR" : "es_PY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("servicesTitle"),
      description: t("servicesDescription"),
    },
  };
}

export default async function ServiciosPage({ params }) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <div className="container">
        <JsonLd
          data={withGraph(
            breadcrumbSchema(locale, [
              { name: tNav("home"), path: "/" },
              { name: tNav("services"), path: "/servicios" },
            ])
          )}
        />
      </div>
      <Services />
      <Pricing />
      <Faq />
    </>
  );
}
