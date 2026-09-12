import { getTranslations } from "next-intl/server";
import Hero from "../../components/Hero.js";
import HowItWorks from "../../components/HowItWorks.js";
import Services from "../../components/Services.js";
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

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Services />
      <Pricing />
      <Testimonials />
      <Faq />
      <CtaFinal />
    </>
  );
}
