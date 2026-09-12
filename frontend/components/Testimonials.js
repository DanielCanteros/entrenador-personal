import { useTranslations } from "next-intl";

function Stars({ rating }) {
  return (
    <div className="testimonial-card__stars" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} aria-hidden="true">
          {index < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const t = useTranslations("testimonials");
  const items = t.raw("items");

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">{t("title")}</span>
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        <div className="grid grid-3">
          {items.map((item) => (
            <article key={item.name + item.text.slice(0, 10)} className="card testimonial-card">
              <Stars rating={item.rating} />
              <p>&ldquo;{item.text}&rdquo;</p>
              <p className="testimonial-card__name">{item.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
