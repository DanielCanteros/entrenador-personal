import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.js";
import WhatsAppButton from "./WhatsAppButton.js";
import { ArrowRight } from "./icons.js";

export default function CtaFinal() {
  const t = useTranslations("ctaFinal");

  return (
    <section className="cta-final" aria-labelledby="cta-final-title">
      <div className="cta-final__glow" aria-hidden="true" />
      <div className="container cta-final__inner" data-reveal>
        <p className="eyebrow eyebrow--light">{t("eyebrow")}</p>
        <h2 className="section-title cta-final__title" id="cta-final-title">
          {t("title")}
        </h2>
        <p className="cta-final__subtitle">{t("subtitle")}</p>
        <div className="cta-final__actions">
          <WhatsAppButton className="btn-light">{t("ctaPrimary")}</WhatsAppButton>
          <Link href="/blog" className="text-link text-link--light">
            {t("ctaSecondary")}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
