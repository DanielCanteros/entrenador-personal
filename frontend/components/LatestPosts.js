import { getTranslations } from "next-intl/server";
import { Link } from "../i18n/navigation.js";
import BlogCard from "./BlogCard.js";
import SectionHeading from "./SectionHeading.js";
import { ArrowRight } from "./icons.js";
import { getPosts } from "../lib/api.js";

const FEATURED_INDEX = 2;

export default async function LatestPosts({ locale }) {
  let posts = [];
  try {
    const data = await getPosts({ locale, limit: 3 });
    posts = data?.posts || [];
  } catch {
    posts = [];
  }

  // Sin artículos (o sin backend) la sección no se muestra: mejor eso que
  // una grilla vacía en la home.
  if (posts.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "latestPosts" });

  return (
    <section className="section latest-posts" id="blog" aria-labelledby="latest-posts-title">
      <div className="container">
        <SectionHeading
          id="latest-posts-title"
          className="section-heading--center"
          eyebrow={t("eyebrow")}
          title={t.raw("titleLines")}
          aside={
            <Link href="/blog" className="btn btn-outline">
              {t("cta")}
              <ArrowRight />
            </Link>
          }
        />

        <div className="posts-grid">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="posts-grid__item"
              data-reveal
              style={{ "--reveal-delay": `${index * 110}ms` }}
            >
              <BlogCard post={post} featured={index === FEATURED_INDEX} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
