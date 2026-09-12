import { useTranslations } from "next-intl";
import WhatsAppButton from "./WhatsAppButton.js";
import { siteConfig } from "../site.config.js";

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="hero section-dark">
      <div className="container hero__inner">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="hero__title">{t("title")}</h1>
          <p className="hero__subtitle">{t("subtitle")}</p>

          <ul className="hero__bullets">
            {t.raw("bullets").map((bullet) => (
              <li key={bullet}>
                <span aria-hidden="true">✓</span> {bullet}
              </li>
            ))}
          </ul>

          <div className="hero__actions">
            <WhatsAppButton>{t("ctaPrimary")}</WhatsAppButton>
            <a href="#tarifas" className="btn btn-outline">
              {t("ctaSecondary")}
            </a>
          </div>
        </div>

        <div className="hero__card card">
          <p className="hero__card-name">{siteConfig.trainer.name}</p>
          <p className="hero__card-role">{t("badge.role")}</p>
          <p className="hero__card-detail">{t("badge.experience")}</p>
          <p className="hero__card-detail">
            {siteConfig.location.city}, {siteConfig.location.country}
          </p>
        </div>
      </div>
    </section>
  );
}
