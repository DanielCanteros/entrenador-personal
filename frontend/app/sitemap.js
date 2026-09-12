import { routing } from "../i18n/routing.js";
import { absoluteUrl, buildAlternates } from "../lib/seo.js";
import { getPosts } from "../lib/api.js";

const staticPaths = ["/", "/servicios", "/sobre-mi", "/blog", "/contacto"];

export default async function sitemap() {
  const entries = [];

  staticPaths.forEach((path) => {
    routing.locales.forEach((locale) => {
      entries.push({
        url: absoluteUrl(locale, path),
        lastModified: new Date(),
        changeFrequency: path === "/blog" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.7,
        alternates: { languages: buildAlternates(path) },
      });
    });
  });

  for (const locale of routing.locales) {
    try {
      let page = 1;
      let pages = 1;

      do {
        // eslint-disable-next-line no-await-in-loop
        const data = await getPosts({ locale, page, limit: 50 });
        data.posts.forEach((post) => {
          entries.push({
            url: absoluteUrl(locale, `/blog/${post.slug}`),
            lastModified: post.updatedAt || post.publishedAt,
            changeFrequency: "monthly",
            priority: 0.6,
          });
        });
        pages = data.pagination?.pages || 1;
        page += 1;
      } while (page <= pages);
    } catch {
      // El backend no está disponible en este momento (p. ej. durante el build):
      // se omiten los posts del sitemap en esta generación, sin romper el build.
    }
  }

  return entries;
}
