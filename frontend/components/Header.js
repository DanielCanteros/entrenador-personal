"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.js";
import LanguageSwitcher from "./LanguageSwitcher.js";
import WhatsAppButton from "./WhatsAppButton.js";
import { siteConfig } from "../site.config.js";

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/servicios", label: t("services") },
    { href: "/blog", label: t("blog") },
    { href: "/sobre-mi", label: t("about") },
    { href: "/contacto", label: t("contact") },
  ];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__brand" onClick={() => setOpen(false)}>
          {siteConfig.brandName}
        </Link>

        <nav
          className={`site-header__nav${open ? " is-open" : ""}`}
          aria-label="Navegación principal"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="site-header__link"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher className="site-header__lang" />
          <WhatsAppButton className="site-header__cta" message={undefined}>
            {t("cta")}
          </WhatsAppButton>
        </nav>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
