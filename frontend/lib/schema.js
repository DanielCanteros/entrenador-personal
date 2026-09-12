import { siteConfig } from "../site.config.js";
import { absoluteUrl } from "./seo.js";

function sameAsLinks() {
  return Object.values(siteConfig.social).filter(Boolean);
}

export function personSchema(locale) {
  return {
    "@type": "Person",
    "@id": `${siteConfig.siteUrl}/#trainer`,
    name: siteConfig.trainer.name,
    jobTitle: siteConfig.trainer.jobTitle[locale] || siteConfig.trainer.jobTitle.es,
    url: absoluteUrl(locale, "/sobre-mi"),
    worksFor: { "@id": `${siteConfig.siteUrl}/#business` },
    sameAs: sameAsLinks(),
  };
}

export function localBusinessSchema(locale) {
  return {
    "@type": ["LocalBusiness", "SportsActivityLocation"],
    "@id": `${siteConfig.siteUrl}/#business`,
    name: siteConfig.legalName,
    url: absoluteUrl(locale, "/"),
    image: absoluteUrl(locale, "/icon-512.png"),
    telephone: `+${siteConfig.whatsappNumber}`,
    email: siteConfig.contactEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.location.addressLocality,
      addressRegion: siteConfig.location.addressRegion,
      addressCountry: siteConfig.location.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.location.latitude,
      longitude: siteConfig.location.longitude,
    },
    areaServed: [
      { "@type": "City", name: siteConfig.location.city },
      { "@type": "AdministrativeArea", name: siteConfig.location.region },
    ],
    priceRange: "$$",
    sameAs: sameAsLinks(),
  };
}

export function websiteSchema(locale) {
  return {
    "@type": "WebSite",
    "@id": `${siteConfig.siteUrl}/#website`,
    name: siteConfig.brandName,
    url: absoluteUrl(locale, "/"),
    inLanguage: locale,
    publisher: { "@id": `${siteConfig.siteUrl}/#business` },
  };
}

export function faqSchema(items) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(locale, items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(locale, item.path),
    })),
  };
}

export function blogPostingSchema(locale, post) {
  return {
    "@type": "BlogPosting",
    "@id": absoluteUrl(locale, `/blog/${post.slug}`),
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage?.url ? [post.coverImage.url] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    inLanguage: locale,
    author: { "@id": `${siteConfig.siteUrl}/#trainer` },
    publisher: { "@id": `${siteConfig.siteUrl}/#business` },
    mainEntityOfPage: absoluteUrl(locale, `/blog/${post.slug}`),
    workTranslation: (post.translations || [])
      .filter((translation) => translation.status === "published")
      .map((translation) => ({
        "@type": "BlogPosting",
        "@id": absoluteUrl(translation.locale, `/blog/${translation.slug}`),
        inLanguage: translation.locale,
      })),
  };
}

export function withGraph(...nodes) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}
