import Image from "next/image";
import { useTranslations } from "next-intl";
import WhatsAppButton from "./WhatsAppButton.js";
import HeroParallax from "./motion/HeroParallax.js";
import CountUp from "./motion/CountUp.js";
import { ArrowRight } from "./icons.js";
import { getHeroImage } from "../lib/heroImage.js";
import { siteConfig } from "../site.config.js";

export default function Hero() {
  const t = useTranslations("hero");
  const titleLines = t.raw("titleLines");
  const stats = t.raw("stats");
  const heroImage = getHeroImage();

  const nameParts = siteConfig.trainer.name.trim().split(/\s+/);
  const [firstName, ...restName] = nameParts;
  const initials = nameParts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <HeroParallax className="hero" aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true">
        <div className="hero__glow" />
        <div className="hero__bgtext">
          <span className="hero__bgtext-line">{firstName}</span>
          {restName.length > 0 && (
            <span className="hero__bgtext-line hero__bgtext-line--end">{restName.join(" ")}</span>
          )}
        </div>
        <div className="hero__grain" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <h1 className="hero__title" id="hero-title">
            {titleLines.map((line, index) => (
              <span className="hero__line" key={line}>
                <span className="hero__line-inner" style={{ "--i": index }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p className="hero__subtitle">{t("subtitle")}</p>

          <div className="hero__actions">
            <WhatsAppButton showIcon={false} withArrow>
              {t("ctaPrimary")}
            </WhatsAppButton>
            <a href="#programas" className="text-link">
              {t("ctaSecondary")}
              <ArrowRight />
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <div className={`hero__figure${heroImage ? "" : " hero__figure--monogram"}`}>
            {heroImage ? (
              <Image
                src={heroImage}
                alt={`${t("imageAlt")} ${siteConfig.trainer.name}`}
                fill
                priority
                sizes="(max-width: 900px) 90vw, 50vw"
                className="hero__image"
              />
            ) : (
              <div className="hero__monogram" aria-hidden="true">
                <span className="hero__monogram-ring" />
                <span className="hero__monogram-ring hero__monogram-ring--2" />
                <span className="hero__monogram-text">{initials}</span>
              </div>
            )}
          </div>

          <ul className="hero__stats">
            {stats.map((stat, index) => (
              <li
                key={stat.label}
                className={`hero-stat hero-stat--${index + 1}`}
                style={{ "--i": index }}
              >
                <p className="hero-stat__value">
                  <CountUp value={stat.value} suffix={stat.suffix} delay={1150 + index * 150} />
                </p>
                <p className="hero-stat__caption">
                  <strong>{stat.label}.</strong> {stat.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HeroParallax>
  );
}
