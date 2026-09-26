"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.js";
import BrandMark from "./BrandMark.js";
import LanguageSwitcher from "./LanguageSwitcher.js";
import WhatsAppButton from "./WhatsAppButton.js";

export default function Header({ showLanguageSwitcher = true }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Transparente sobre el hero; fondo sólido con blur al hacer scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menú móvil: Escape lo cierra y el body no scrollea mientras está abierto.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  const links = [
    { href: "/servicios", label: t("services") },
    { href: "/sobre-mi", label: t("about") },
    { href: "/blog", label: t("blog") },
    { href: "/contacto", label: t("contact") },
  ];

  const isCurrent = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const classes = ["site-header", scrolled ? "is-scrolled" : "", open ? "is-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes}>
      <div className="container site-header__inner">
        <Link href="/" className="site-header__brand" onClick={close}>
          <BrandMark />
        </Link>

        <nav id="site-nav" className="site-header__nav" aria-label="Navegación principal">
          <ul className="site-header__links">
            {links.map((link, index) => (
              <li key={link.href} style={{ "--i": index }}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="site-header__link"
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="site-header__actions">
            {showLanguageSwitcher && <LanguageSwitcher className="site-header__lang" />}
            <NextLink href="/cuenta/login" onClick={close} className="site-header__link site-header__account">
              {t("login")}
            </NextLink>
            <WhatsAppButton className="site-header__cta" showIcon={false}>
              {t("cta")}
            </WhatsAppButton>
          </div>
        </nav>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="site-nav"
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
