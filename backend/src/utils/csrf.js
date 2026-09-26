/**
 * Verificación de origen compartida entre los middlewares de auth (admin y
 * cliente). La cookie de sesión se manda cross-site (sameSite: "none" en
 * producción), así que para métodos que cambian estado no alcanza con la
 * cookie: hay que verificar que el pedido venga realmente del frontend. Las
 * rutas con Content-Type: application/json ya quedan cubiertas por el
 * preflight CORS, pero multipart/form-data (ej. subida de imágenes) no
 * dispara preflight y sería vulnerable a CSRF sin esta verificación.
 */

export const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function hasTrustedOrigin(req) {
  const allowed = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true; // sin FRONTEND_URL configurado, no se puede validar

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return false;

  return allowed.some((base) => origin === base || origin.startsWith(`${base}/`));
}
