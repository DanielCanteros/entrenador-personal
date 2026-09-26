import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.js";
import { ArrowRight } from "./icons.js";

export default function BlogCard({ post, featured = false }) {
  const t = useTranslations("blog");
  const tPosts = useTranslations("latestPosts");
  const tag = post.tags?.[0] || tPosts("fallbackTag");
  const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
  const date = publishedAt
    ? publishedAt.toLocaleDateString(post.locale === "pt" ? "pt-BR" : "es-PY", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <article className={`blog-card${featured ? " is-featured" : ""}`}>
      <div className="blog-card__media">
        {post.coverImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage.url}
            alt={post.coverImage.alt || post.title}
            className="blog-card__image"
            loading="lazy"
          />
        ) : (
          <div className="blog-card__placeholder" aria-hidden="true">
            <span>{tag}</span>
          </div>
        )}
      </div>

      <div className="blog-card__body">
        <span className="blog-card__tag">{tag}</span>
        <h3 className="blog-card__title">
          {/* El ::after de este enlace cubre toda la tarjeta (clic en cualquier parte). */}
          <Link href={`/blog/${post.slug}`} className="blog-card__link">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="blog-card__excerpt">{post.excerpt}</p>}

        <div className="blog-card__footer">
          {date && (
            <time className="blog-card__date" dateTime={publishedAt.toISOString()}>
              {date}
            </time>
          )}
          <span className="blog-card__more" aria-hidden="true">
            {t("readMore")}
            <ArrowRight />
          </span>
        </div>
      </div>
    </article>
  );
}
