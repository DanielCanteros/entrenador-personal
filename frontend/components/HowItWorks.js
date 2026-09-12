import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations("howItWorks");
  const steps = t.raw("steps");

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">{t("title")}</span>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        <ol className="grid grid-3 how-it-works">
          {steps.map((step, index) => (
            <li key={step.title} className="card how-it-works__item">
              <span className="how-it-works__number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
