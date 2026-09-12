import { getTranslations } from "next-intl/server";
import JsonLd from "../../../components/JsonLd.js";
import WhatsAppButton from "../../../components/WhatsAppButton.js";
import { breadcrumbSchema, withGraph } from "../../../lib/schema.js";
import { absoluteUrl, buildAlternates } from "../../../lib/seo.js";
import { siteConfig } from "../../../site.config.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: {
      canonical: absoluteUrl(locale, "/sobre-mi"),
      languages: buildAlternates("/sobre-mi"),
    },
    openGraph: {
      title: t("aboutTitle"),
      description: t("aboutDescription"),
      url: absoluteUrl(locale, "/sobre-mi"),
      locale: locale === "pt" ? "pt_BR" : "es_PY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("aboutTitle"),
      description: t("aboutDescription"),
    },
  };
}

export default async function SobreMiPage({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const bio = t.raw("bio");
  const credentials = t.raw("credentials");

  return (
    <section className="section">
      <div className="container about-page">
        <JsonLd
          data={withGraph(
            breadcrumbSchema(locale, [
              { name: tNav("home"), path: "/" },
              { name: tNav("about"), path: "/sobre-mi" },
            ])
          )}
        />

        <div className="section-header">
          <span className="eyebrow">{siteConfig.trainer.name}</span>
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-subtitle">{t("intro")}</p>
        </div>

        <div className="about-page__grid">
          <div className="card">
            {bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <WhatsAppButton>{tNav("cta")}</WhatsAppButton>
          </div>

          <div className="card">
            <h2>{t("credentialsTitle")}</h2>
            <ul className="about-page__credentials">
              {credentials.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
