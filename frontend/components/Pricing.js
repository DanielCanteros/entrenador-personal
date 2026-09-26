import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading.js";
import WhatsAppButton from "./WhatsAppButton.js";

export default function Pricing() {
  const t = useTranslations("pricing");
  const features = t.raw("features");

  return (
    <section className="section pricing" id="tarifas">
      <div className="container pricing__layout">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="pricing-card" data-reveal style={{ "--reveal-delay": "120ms" }}>
          <div className="pricing-card__top">
            <h3 className="pricing-card__name">{t("planName")}</h3>
            <span className="badge">{t("recommended")}</span>
          </div>
          <p className="pricing-card__price">
            {t("price")} <span>{t("period")}</span>
          </p>
          <ul className="check-list pricing-card__features">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <WhatsAppButton className="btn-block" withArrow>
            {t("cta")}
          </WhatsAppButton>
          <p className="pricing-card__note">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
