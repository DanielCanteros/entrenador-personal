import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AdminUser } from "../models/AdminUser.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Inténtalo más tarde." },
});

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = signToken({ sub: admin._id.toString() });
    res.cookie("token", token, cookieOptions());
    res.json({ admin });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", { ...cookieOptions(), maxAge: 0 });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;
