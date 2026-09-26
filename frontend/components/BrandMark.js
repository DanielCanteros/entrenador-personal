import { siteConfig } from "../site.config.js";

/** Nombre de marca en dos tonos: la primera palabra en blanco, el resto en rojo. */
export default function BrandMark({ name = siteConfig.brandName }) {
  const [first, ...rest] = name.trim().split(/\s+/);

  return (
    <span className="brand-mark">
      {first}
      {rest.length > 0 && <span className="brand-mark__accent"> {rest.join(" ")}</span>}
    </span>
  );
}
