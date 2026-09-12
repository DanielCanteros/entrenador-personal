import { verifyToken } from "../utils/jwt.js";
import { AdminUser } from "../models/AdminUser.js";

export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

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
