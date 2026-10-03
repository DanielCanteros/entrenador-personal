import Image from "next/image";
import { siteConfig } from "../site.config.js";

/** Logo de la marca (public/images/logo.webp, fondo transparente). */
export default function BrandMark({ name = siteConfig.brandName }) {
  return (
    <Image
      className="brand-mark"
      src="/images/logo.webp"
      alt={name}
      width={640}
      height={644}
      sizes="140px"
      priority
    />
  );
}
