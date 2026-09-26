import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading.js";
import WhatsAppButton from "./WhatsAppButton.js";

function ServiceCard({ index, title, description, features }) {
  return (
    <article className="service-card" data-reveal style={{ "--reveal-delay": `${index * 110}ms` }}>
      <span className="service-card__number">{String(index + 1).padStart(2, "0")}</span>
      <h3 className="service-card__title">{title}</h3>
      <p className="service-card__text">{description}</p>
      <ul className="check-list">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </article>
  );
}

export default function Services() {
  const t = useTranslations("services");
  const online = t.raw("online");
  const presencial = t.raw("presencial");

  return (
    <section className="section services" id="servicios">
      <div className="container">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          aside={
            <>
              <p>{t("subtitle")}</p>
              <WhatsAppButton withArrow>{t("cta")}</WhatsAppButton>
            </>
          }
        />

        <div className="services__grid">
          <ServiceCard index={0} {...online} />
          <ServiceCard index={1} {...presencial} />
        </div>
      </div>
    </section>
  );
}
