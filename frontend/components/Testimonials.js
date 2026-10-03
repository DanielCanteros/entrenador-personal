import Image from "next/image";
import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading.js";
import MancuernasCaida from "./motion/MancuernasCaida.js";

// Una foto por testimonio, en el mismo orden que testimonials.items.
// Hay más fotos disponibles en public/images/depoimentos/ (3596, 3872, 3893, 3931).
const PHOTOS = [
  "/images/depoimentos/depoimento-3793.webp",
  "/images/depoimentos/depoimento-4067.webp",
  "/images/depoimentos/depoimento-pc.webp",
];

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
      <MancuernasCaida />
      <div className="container">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="testimonials__grid">
          {items.map((item, index) => (
            <figure
              key={item.name + item.text.slice(0, 10)}
              className="testimonial-card"
              tabIndex={0}
              data-reveal
              style={{ "--reveal-delay": `${index * 110}ms` }}
            >
              <Image
                className="testimonial-card__photo"
                src={PHOTOS[index % PHOTOS.length]}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 960px) 80vw, 33vw"
              />

              <div className="testimonial-card__body">
                <Stars rating={item.rating} />
                <h3 className="testimonial-card__title">{item.title}</h3>
                <div className="testimonial-card__reveal">
                  <div>
                    <blockquote className="testimonial-card__text">
                      <p>{item.text}</p>
                    </blockquote>
                    <figcaption className="testimonial-card__name">{item.name}</figcaption>
                  </div>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
