"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import JsonLd from "./JsonLd.js";
import { faqSchema } from "../lib/schema.js";

export default function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items");
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <JsonLd data={{ "@context": "https://schema.org", ...faqSchema(items) }} />

        <div className="section-header">
          <span className="eyebrow">{t("title")}</span>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        <div className="faq-list">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div className={`faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                <h3>
                  <button
                    type="button"
                    className="faq-item__trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    {item.question}
                    <span aria-hidden="true" className="faq-item__icon">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                {isOpen && <p className="faq-item__answer">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
