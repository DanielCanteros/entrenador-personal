import { useTranslations } from "next-intl";
import WhatsAppButton from "./WhatsAppButton.js";

function ServiceCard({ title, description, features }) {
  return (
    <div className="card service-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <ul className="service-card__features">
        {features.map((feature) => (
          <li key={feature}>
            <span aria-hidden="true">✓</span> {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Services() {
  const t = useTranslations("services");
  const online = t.raw("online");
  const presencial = t.raw("presencial");

  return (
    <section className="section section-alt" id="servicios">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">{t("title")}</span>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        <div className="grid grid-2">
          <ServiceCard {...online} />
          <ServiceCard {...presencial} />
        </div>

        <div className="services__cta">
          <WhatsAppButton>{t("cta")}</WhatsAppButton>
        </div>
      </div>
    </section>
  );
}
