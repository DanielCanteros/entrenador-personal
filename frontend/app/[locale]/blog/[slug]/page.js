import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "../../../../i18n/navigation.js";
import JsonLd from "../../../../components/JsonLd.js";
import MarkdownContent from "../../../../components/MarkdownContent.js";
import BlogLocaleSync from "../../../../components/BlogLocaleSync.js";
import { getPost } from "../../../../lib/api.js";
import { blogPostingSchema, breadcrumbSchema, withGraph } from "../../../../lib/schema.js";
import { absoluteUrl, buildPostAlternates, buildPostLanguagePaths } from "../../../../lib/seo.js";

async function fetchPost(slug, locale) {
  try {
    const { post } = await getPost(slug, locale);
    return post;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const post = await fetchPost(slug, locale);

  if (!post) {
    return {};
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(locale, `/blog/${slug}`),
      languages: buildPostAlternates(locale, post),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(locale, `/blog/${slug}`),
      locale: locale === "pt" ? "pt_BR" : "es_PY",
      type: "article",
      publishedTime: post.publishedAt,
      images: post.coverImage?.url ? [post.coverImage.url] : undefined,
    },
    twitter: {
      card: post.coverImage?.url ? "summary_large_image" : "summary",
      title,
      description,
      images: post.coverImage?.url ? [post.coverImage.url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { locale, slug } = await params;
  const post = await fetchPost(slug, locale);

  if (!post) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "blog" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tLang = await getTranslations({ locale, namespace: "languageSwitcher" });
  const languagePaths = buildPostLanguagePaths(locale, post);
  const otherTranslations = (post.translations || []).filter((tr) => tr.status === "published");

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "es-PY", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="section blog-post">
      <div className="container blog-post__container">
        <JsonLd
          data={withGraph(
            blogPostingSchema(locale, post),
            breadcrumbSchema(locale, [
              { name: tNav("home"), path: "/" },
              { name: tNav("blog"), path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ])
          )}
        />
        <BlogLocaleSync alternates={languagePaths} />

        <Link href="/blog" className="blog-post__back">
          ← {t("backToBlog")}
        </Link>

        {date && <p className="blog-card__date">{t("publishedOn")} {date}</p>}
        <h1>{post.title}</h1>

        {otherTranslations.length > 0 && (
          <p className="blog-post__translations">
            {t("alsoAvailable")}{" "}
            {otherTranslations.map((tr, index) => (
              <span key={tr.locale}>
                {index > 0 && " · "}
                <a href={languagePaths[tr.locale]}>{tLang(tr.locale)}</a>
              </span>
            ))}
          </p>
        )}

        {post.coverImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage.url}
            alt={post.coverImage.alt || post.title}
            className="blog-post__cover"
          />
        )}

        <MarkdownContent content={post.content} />

        {post.tags?.length > 0 && (
          <ul className="blog-post__tags">
            {post.tags.map((tag) => (
              <li key={tag} className="badge">{tag}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
