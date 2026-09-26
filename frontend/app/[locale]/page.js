import { getTranslations } from "next-intl/server";
import Hero from "../../components/Hero.js";
import Programs from "../../components/Programs.js";
import LatestPosts from "../../components/LatestPosts.js";
import HowItWorks from "../../components/HowItWorks.js";
import Pricing from "../../components/Pricing.js";
import Testimonials from "../../components/Testimonials.js";
import Faq from "../../components/Faq.js";
import CtaFinal from "../../components/CtaFinal.js";
import { absoluteUrl, buildAlternates } from "../../lib/seo.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: absoluteUrl(locale, "/"),
      languages: buildAlternates("/"),
    },
  };
}

// Orden de la referencia de diseño: Hero -> Programas -> Blog. Debajo siguen
// las secciones de conversión y SEO (método, testimonios, tarifa, FAQ, CTA).
export default async function HomePage({ params }) {
  const { locale } = await params;

  return (
    <>
      <Hero />
      <Programs />
      <LatestPosts locale={locale} />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Faq />
      <CtaFinal />
    </>
  );
}
