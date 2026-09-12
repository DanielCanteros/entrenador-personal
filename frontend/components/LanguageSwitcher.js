"use client";

import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
import { usePathname, Link } from "../i18n/navigation.js";
import { routing } from "../i18n/routing.js";
import { localizedPath } from "../lib/seo.js";
import { useLocaleAlternates } from "../context/LocaleAlternatesContext.js";

export default function LanguageSwitcher({ className = "" }) {
  const t = useTranslations("languageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const alternates = useLocaleAlternates();

  return (
    <div className={`lang-switcher ${className}`} role="group" aria-label={t("label")}>
      {routing.locales.map((loc) => {
        const isActive = loc === locale;
        const linkClassName = `lang-switcher__option${isActive ? " is-active" : ""}`;

        // Página con rutas específicas por idioma (p. ej. un post de blog
        // cuyo slug cambia entre ES/PT): navega a la traducción real, o al
        // listado del blog en ese idioma si todavía no existe esa traducción.
        if (alternates) {
          const href = alternates[loc] || localizedPath(loc, "/blog");
          return (
            <NextLink key={loc} href={href} className={linkClassName} aria-current={isActive ? "true" : undefined}>
              {loc.toUpperCase()}
            </NextLink>
          );
        }

        return (
          <Link
            key={loc}
            href={pathname}
            locale={loc}
            className={linkClassName}
            aria-current={isActive ? "true" : undefined}
          >
            {loc.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
