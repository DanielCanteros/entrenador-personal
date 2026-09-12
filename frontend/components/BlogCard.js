import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.js";

export default function BlogCard({ post }) {
  const t = useTranslations("blog");
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(post.locale === "pt" ? "pt-BR" : "es-PY", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="card blog-card">
      {post.coverImage?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage.url}
          alt={post.coverImage.alt || post.title}
          className="blog-card__image"
          loading="lazy"
        />
      )}
      <div className="blog-card__body">
        {date && <p className="blog-card__date">{date}</p>}
        <h3>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="blog-card__link">
          {t("readMore")} →
        </Link>
      </div>
    </article>
  );
}
