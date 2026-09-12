import { defineRouting } from "next-intl/routing";
import { siteConfig } from "../site.config.js";

export const routing = defineRouting({
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  localePrefix: "as-needed",
});
