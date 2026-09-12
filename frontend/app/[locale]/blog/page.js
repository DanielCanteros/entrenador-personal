import { getTranslations } from "next-intl/server";
import { Link } from "../../../i18n/navigation.js";
import BlogCard from "../../../components/BlogCard.js";
import JsonLd from "../../../components/JsonLd.js";
import { getPosts } from "../../../lib/api.js";
import { breadcrumbSchema, withGraph } from "../../../lib/schema.js";
import { absoluteUrl, buildAlternates } from "../../../lib/seo.js";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    alternates: {
      canonical: absoluteUrl(locale, "/blog"),
      languages: buildAlternates("/blog"),
    },
    openGraph: {
      title: t("blogTitle"),
      description: t("blogDescription"),
      url: absoluteUrl(locale, "/blog"),
      locale: locale === "pt" ? "pt_BR" : "es_PY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("blogTitle"),
      description: t("blogDescription"),
    },
  };
}

export default async function BlogPage({ params, searchParams }) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(parseInt(pageParam, 10) || 1, 1);

  const t = await getTranslations({ locale, namespace: "blog" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  let posts = [];
  let pagination = { page: 1, pages: 1 };

  try {
    const data = await getPosts({ locale, page });
    posts = data.posts;
    pagination = data.pagination;
  } catch {
    posts = [];
  }

  return (
    <section className="section">
      <div className="container">
        <JsonLd
          data={withGraph(
            breadcrumbSchema(locale, [
              { name: tNav("home"), path: "/" },
              { name: tNav("blog"), path: "/blog" },
            ])
          )}
        />

        <div className="section-header">
          <span className="eyebrow">{tNav("blog")}</span>
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>

        {posts.length === 0 ? (
          <p className="blog-empty">{t("empty")}</p>
        ) : (
          <div className="grid grid-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <nav className="blog-pagination" aria-label="Paginación del blog">
            {Array.from({ length: pagination.pages }).map((_, index) => {
              const p = index + 1;
              return (
                <Link
                  key={p}
                  href={`/blog?page=${p}`}
                  className={`blog-pagination__link${p === pagination.page ? " is-active" : ""}`}
                >
                  {p}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </section>
  );
}
