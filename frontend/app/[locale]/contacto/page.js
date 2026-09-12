import { getTranslations } from "next-intl/server";
import ContactForm from "../../../components/ContactForm.js";
import JsonLd from "../../../components/JsonLd.js";
import { breadcrumbSchema, withGraph } from "../../../lib/schema.js";
import { absoluteUrl, buildAlternates } from "../../../lib/seo.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: {
      canonical: absoluteUrl(locale, "/contacto"),
      languages: buildAlternates("/contacto"),
    },
    openGraph: {
      title: t("contactTitle"),
      description: t("contactDescription"),
      url: absoluteUrl(locale, "/contacto"),
      locale: locale === "pt" ? "pt_BR" : "es_PY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("contactTitle"),
      description: t("contactDescription"),
    },
  };
}

export default async function ContactoPage({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactForm" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <section className="section">
      <div className="container">
        <JsonLd
          data={withGraph(
            breadcrumbSchema(locale, [
              { name: tNav("home"), path: "/" },
              { name: tNav("contact"), path: "/contacto" },
            ])
          )}
        />

        <div className="section-header">
          <span className="eyebrow">{tNav("contact")}</span>
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
