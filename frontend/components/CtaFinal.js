import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.js";
import WhatsAppButton from "./WhatsAppButton.js";

export default function CtaFinal() {
  const t = useTranslations("ctaFinal");

  return (
    <section className="section-dark cta-final">
      <div className="container cta-final__inner">
        <h2 className="section-title">{t("title")}</h2>
        <p className="section-subtitle">{t("subtitle")}</p>
        <div className="hero__actions">
          <WhatsAppButton>{t("ctaPrimary")}</WhatsAppButton>
          <Link href="/blog" className="btn btn-outline">
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
