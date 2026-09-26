import { verifyToken } from "../utils/jwt.js";
import { AdminUser } from "../models/AdminUser.js";
import { SAFE_METHODS, hasTrustedOrigin } from "../utils/csrf.js";

export async function requireAuth(req, res, next) {
  try {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const cookieToken = req.cookies?.token || null;

    // El chequeo de origen solo aplica a la cookie: un navegador la adjunta
    // solo (de ahí el riesgo de CSRF), mientras que un header Authorization
    // lo agrega el propio cliente a propósito y no es forjable así.
    if (!bearerToken && cookieToken && !SAFE_METHODS.has(req.method) && !hasTrustedOrigin(req)) {
      return res.status(403).json({ error: "Origen no permitido" });
    }

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const payload = verifyToken(token);
    const admin = await AdminUser.findById(payload.sub);

    if (!admin) {
      return res.status(401).json({ error: "No autenticado" });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}
