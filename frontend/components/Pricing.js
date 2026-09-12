import { useTranslations } from "next-intl";
import WhatsAppButton from "./WhatsAppButton.js";

export default function Pricing() {
  const t = useTranslations("pricing");
  const features = t.raw("features");

  return (
    <section className="section" id="tarifas">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">{t("title")}</span>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        <div className="pricing-card card">
          <span className="badge">{t("recommended")}</span>
          <h3>{t("planName")}</h3>
          <p className="pricing-card__price">
            {t("price")} <span>{t("period")}</span>
          </p>
          <ul className="pricing-card__features">
            {features.map((feature) => (
              <li key={feature}>
                <span aria-hidden="true">✓</span> {feature}
              </li>
            ))}
          </ul>
          <WhatsAppButton className="btn-block">{t("cta")}</WhatsAppButton>
          <p className="pricing-card__note">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
