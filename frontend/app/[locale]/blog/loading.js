function BlogCardSkeleton() {
  return (
    <div className="card blog-card blog-card--skeleton" aria-hidden="true">
      <div className="skeleton blog-card__image" />
      <div className="blog-card__body">
        <div className="skeleton skeleton-text skeleton-text--sm" />
        <div className="skeleton skeleton-text skeleton-text--lg" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text skeleton-text--sm" />
      </div>
    </div>
  );
}

export default function BlogLoading() {
  return (
    <section className="section" aria-busy="true" aria-live="polite">
      <div className="container">
        <div className="section-header">
          <div className="skeleton skeleton-text skeleton-text--sm" style={{ margin: "0 auto 12px" }} />
          <div className="skeleton skeleton-text--lg" style={{ height: "2rem", margin: "0 auto 12px" }} />
          <div className="skeleton skeleton-text" style={{ width: "60%", margin: "0 auto" }} />
        </div>

        <div className="grid grid-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <BlogCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
