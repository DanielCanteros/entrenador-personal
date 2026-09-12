export default function BlogPostLoading() {
  return (
    <article className="section blog-post blog-post--skeleton" aria-busy="true" aria-live="polite">
      <div className="container blog-post__container">
        <div className="skeleton skeleton-text skeleton-text--sm" style={{ width: "120px", marginBottom: "18px" }} />
        <div className="skeleton skeleton-text skeleton-text--sm" />
        <div className="skeleton skeleton-text skeleton-text--title" />
        <div className="skeleton blog-post__cover" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text skeleton-text--lg" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text skeleton-text--lg" />
        <div className="skeleton skeleton-text skeleton-text--sm" />
      </div>
    </article>
  );
}
