import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Cliente } from "../models/Cliente.js";
import { Evaluacion } from "../models/Evaluacion.js";
import { signToken } from "../utils/jwt.js";
import { requireClienteAuth } from "../middleware/clienteAuth.js";

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
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const cliente = await Cliente.findOne({ email: email.toLowerCase().trim() });
    if (!cliente || !cliente.clienteActivo || !(await cliente.comparePassword(password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = signToken({ sub: cliente._id.toString() });
    res.cookie("clienteToken", token, cookieOptions());
    res.json({ cliente });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("clienteToken", { ...cookieOptions(), maxAge: 0 });
  res.json({ ok: true });
});

router.get("/me", requireClienteAuth, (req, res) => {
  res.json({ cliente: req.cliente });
});

router.patch("/me", requireClienteAuth, async (req, res, next) => {
  try {
    const { nombre, apellido, pais, ciudad, idioma } = req.body;
    const cliente = req.cliente;

    if (nombre !== undefined) cliente.nombre = nombre;
    if (apellido !== undefined) cliente.apellido = apellido;
    if (pais !== undefined) cliente.pais = pais;
    if (ciudad !== undefined) cliente.ciudad = ciudad;
    if (idioma !== undefined) cliente.idioma = idioma === "pt" ? "pt" : "es";

    await cliente.save();
    res.json({ cliente });
  } catch (err) {
    next(err);
  }
});

// Datos de evaluación: el admin es el único que los crea/edita (ver
// evaluaciones.routes.js); el cliente solo puede leer los suyos.
router.get("/evaluacion", requireClienteAuth, async (req, res, next) => {
  try {
    const evaluacion = await Evaluacion.findOne({ id_user: req.cliente.id_user });
    res.json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.patch("/password", requireClienteAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const cliente = req.cliente;
    if (!(await cliente.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "La contraseña actual no es correcta" });
    }

    cliente.passwordHash = await Cliente.hashPassword(newPassword);
    await cliente.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
