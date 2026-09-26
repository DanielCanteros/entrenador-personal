"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import JsonLd from "./JsonLd.js";
import SectionHeading from "./SectionHeading.js";
import { faqSchema } from "../lib/schema.js";

export default function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items");
  const [openIndex, setOpenIndex] = useState(0);
  const baseId = useId();

  return (
    <section className="section faq" id="faq">
      <JsonLd data={{ "@context": "https://schema.org", ...faqSchema(items) }} />

      <div className="container faq__layout">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="faq-list" data-reveal style={{ "--reveal-delay": "120ms" }}>
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <div className={`faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                <h3 className="faq-item__heading">
                  <button
                    type="button"
                    id={buttonId}
                    className="faq-item__trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span className="faq-item__index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="faq-item__question">{item.question}</span>
                    <span aria-hidden="true" className="faq-item__icon" />
                  </button>
                </h3>
                {/* La respuesta siempre está en el DOM (SEO) y se anima con grid-template-rows. */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  className="faq-item__panel"
                >
                  <div className="faq-item__panel-inner">
                    <p className="faq-item__answer">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
