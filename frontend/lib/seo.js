import { siteConfig } from "../site.config.js";
import { routing } from "../i18n/routing.js";

export function localizedPath(locale, path = "/") {
  const clean = path === "/" ? "" : path;
  if (locale === routing.defaultLocale) {
    return clean || "/";
  }
  return `/${locale}${clean}` || `/${locale}`;
}

export function absoluteUrl(locale, path = "/") {
  return `${siteConfig.siteUrl}${localizedPath(locale, path)}`;
}

export function buildAlternates(path = "/") {
  const languages = {};
  routing.locales.forEach((locale) => {
    languages[locale] = absoluteUrl(locale, path);
  });
  languages["x-default"] = absoluteUrl(routing.defaultLocale, path);
  return languages;
}

/**
 * hreflang absolutos para un post de blog, respetando que cada idioma
 * puede tener un slug distinto (solo incluye los idiomas que realmente
 * tienen esa traducción publicada).
 */
export function buildPostAlternates(currentLocale, post) {
  const languages = { [currentLocale]: absoluteUrl(currentLocale, `/blog/${post.slug}`) };
  (post.translations || []).forEach((translation) => {
    languages[translation.locale] = absoluteUrl(translation.locale, `/blog/${translation.slug}`);
  });
  return languages;
}

/**
 * Igual que buildPostAlternates pero con rutas relativas (respetando el
 * prefijo "as-needed"), pensado para el selector de idioma del header.
 */
export function buildPostLanguagePaths(currentLocale, post) {
  const paths = { [currentLocale]: localizedPath(currentLocale, `/blog/${post.slug}`) };
  (post.translations || []).forEach((translation) => {
    paths[translation.locale] = localizedPath(translation.locale, `/blog/${translation.slug}`);
  });
  return paths;
}
