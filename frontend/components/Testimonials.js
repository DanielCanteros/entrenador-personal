import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading.js";

function Stars({ rating }) {
  return (
    <div className="testimonial-card__stars" role="img" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} aria-hidden="true" className={index < rating ? "is-on" : undefined}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const t = useTranslations("testimonials");
  const items = t.raw("items");

  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="testimonials__grid">
          {items.map((item, index) => (
            <figure
              key={item.name + item.text.slice(0, 10)}
              className="testimonial-card"
              data-reveal
              style={{ "--reveal-delay": `${index * 110}ms` }}
            >
              <Stars rating={item.rating} />
              <blockquote className="testimonial-card__text">
                <p>{item.text}</p>
              </blockquote>
              <figcaption className="testimonial-card__name">{item.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
