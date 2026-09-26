import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading.js";

export default function HowItWorks() {
  const t = useTranslations("howItWorks");
  const steps = t.raw("steps");

  return (
    <section className="section how-it-works-section">
      <div className="container">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <ol className="steps">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="step"
              data-reveal
              style={{ "--reveal-delay": `${index * 110}ms` }}
            >
              <span className="step__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__text">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
