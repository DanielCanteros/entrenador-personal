/**
 * Configuración central del sitio. Edita estos valores para personalizar
 * la marca sin tocar componentes ni páginas.
 */
export const siteConfig = {
  brandName: "Tu Entrenador",
  legalName: "Tu Entrenador Personal",
  tagline: {
    es: "Entrenador personal online y presencial",
    pt: "Personal trainer online e presencial",
  },
  domain: "tudominio.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",

  // Contacto
  whatsappNumber: "595981000000", // formato internacional sin '+' ni espacios
  contactEmail: "hola@tudominio.com",

  // Ubicación (SEO local / GEO)
  location: {
    city: "Ciudad del Este",
    region: "Alto Paraná",
    country: "Paraguay",
    countryCode: "PY",
    addressLocality: "Ciudad del Este",
    addressRegion: "Alto Paraná",
    // Código ISO 3166-2 aproximado del departamento (Alto Paraná = PY-10). Verifícalo si lo usas en integraciones críticas.
    geoRegionCode: "PY-10",
    postalCode: "",
    latitude: -25.5095,
    longitude: -54.6118,
  },

  // Redes sociales (deja vacío "" lo que no uses)
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
  },

  // Datos del entrenador (usados en JSON-LD Person / E-E-A-T)
  trainer: {
    name: "Nombre Apellido",
    jobTitle: {
      es: "Entrenador personal",
      pt: "Personal trainer",
    },
  },

  googleReviewsUrl: "",

  locales: ["es", "pt"],
  defaultLocale: "es",
};

export function whatsappLink(message) {
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${siteConfig.whatsappNumber}${text ? `?text=${text}` : ""}`;
}
