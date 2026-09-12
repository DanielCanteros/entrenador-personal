import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.js";
import { siteConfig, whatsappLink } from "../site.config.js";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__col">
          <p className="site-footer__brand">{siteConfig.brandName}</p>
          <p>{t("tagline")}</p>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__heading">{t("quickLinks")}</p>
          <ul>
            <li><Link href="/">{tNav("home")}</Link></li>
            <li><Link href="/servicios">{tNav("services")}</Link></li>
            <li><Link href="/blog">{tNav("blog")}</Link></li>
            <li><Link href="/sobre-mi">{tNav("about")}</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__heading">{t("contact")}</p>
          <ul>
            <li>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
            </li>
            <li>{siteConfig.location.city}, {siteConfig.location.country}</li>
          </ul>
        </div>
      </div>

      <div className="container site-footer__bottom">
        <p>© {year} {siteConfig.legalName}. {t("rights")}</p>
        <p>{t("madeWith")}</p>
      </div>
    </footer>
  );
}
