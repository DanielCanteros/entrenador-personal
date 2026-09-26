import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.js";
import SectionHeading from "./SectionHeading.js";
import { ArrowRight } from "./icons.js";

// Tarjeta resaltada en rojo mientras no se interactúa con la grilla
// (al pasar el mouse por otra, el resaltado se mueve a esa).
const FEATURED_INDEX = 2;

export default function Programs() {
  const t = useTranslations("programs");
  const items = t.raw("items");

  return (
    <section className="section programs" id="programas" aria-labelledby="programs-title">
      <div className="programs__glow" aria-hidden="true" />
      <div className="container">
        <SectionHeading
          id="programs-title"
          eyebrow={t("eyebrow")}
          title={t.raw("titleLines")}
          aside={
            <>
              <p>{t("intro")}</p>
              <Link href="/servicios" className="btn btn-primary">
                {t("cta")}
                <ArrowRight />
              </Link>
            </>
          }
        />

        <ol className="programs__grid">
          {items.map((item, index) => (
            <li
              key={item.title}
              className="programs__item"
              data-reveal
              style={{ "--reveal-delay": `${index * 90}ms` }}
            >
              <article className={`program-card${index === FEATURED_INDEX ? " is-featured" : ""}`}>
                <span className="program-card__number">{String(index + 1).padStart(2, "0")}</span>
                <span className="program-card__rule" aria-hidden="true" />
                <h3 className="program-card__title">{item.title}</h3>
                <p className="program-card__text">{item.description}</p>
                <Link href="/servicios" className="program-card__link">
                  {t("learnMore")}
                  <span className="visually-hidden">: {item.title}</span>
                  <ArrowRight />
                </Link>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
