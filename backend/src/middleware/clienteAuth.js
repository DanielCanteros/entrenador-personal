import { verifyToken } from "../utils/jwt.js";
import { Cliente } from "../models/Cliente.js";
import { SAFE_METHODS, hasTrustedOrigin } from "../utils/csrf.js";

export async function requireClienteAuth(req, res, next) {
  try {
    const token = req.cookies?.clienteToken || null;

    if (token && !SAFE_METHODS.has(req.method) && !hasTrustedOrigin(req)) {
      return res.status(403).json({ error: "Origen no permitido" });
    }

    if (!token) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const payload = verifyToken(token);
    const cliente = await Cliente.findById(payload.sub);

    if (!cliente || !cliente.clienteActivo) {
      return res.status(401).json({ error: "No autenticado" });
    }

    req.cliente = cliente;
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}
