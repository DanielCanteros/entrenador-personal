/**
 * Encabezado de sección del sistema visual: eyebrow con punto rojo, título
 * en mayúsculas (string o array de líneas) y, opcionalmente, un bloque
 * lateral (`aside`) alineado a la derecha en escritorio.
 */
export default function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  aside,
  as: Tag = "h2",
  className = "",
}) {
  const lines = Array.isArray(title) ? title : [title];
  const classes = ["section-heading", aside ? "section-heading--split" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="section-heading__main" data-reveal>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className="section-title" id={id}>
          {lines.map((line, index) => (
            <span key={`${line}-${index}`} className="section-title__line">
              {line}
            </span>
          ))}
        </Tag>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>

      {aside && (
        <div className="section-heading__aside" data-reveal style={{ "--reveal-delay": "140ms" }}>
          {aside}
        </div>
      )}
    </div>
  );
}
