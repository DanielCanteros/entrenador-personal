import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Cliente } from "../models/Cliente.js";
import { requireAuth } from "../middleware/auth.js";
import { sendRegistrationEmail } from "../utils/brevo.js";

const router = Router();

const REGISTRATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Inténtalo más tarde." },
});

function buildRegistrationUrl(token) {
  const base = (process.env.FRONTEND_URL || "").split(",")[0]?.trim() || "";
  return `${base}/registro?token=${token}`;
}

function issueRegistrationToken(cliente) {
  const token = Cliente.generateRegistrationToken();
  cliente.registrationToken = token;
  cliente.registrationTokenExpires = new Date(Date.now() + REGISTRATION_TOKEN_TTL_MS);
  return token;
}

// --- Admin: gestión de clientes ---

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const clientes = await Cliente.find().sort({ createdAt: -1 });
    res.json({ clientes });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ cliente });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ error: "Nombre y email son obligatorios" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Cliente.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "Ya existe un cliente con ese email" });
    }

    // El resto de los datos (apellido, país, ciudad, idioma, contraseña) los
    // completa el propio cliente al entrar desde el link del email.
    const cliente = new Cliente({
      nombre,
      email: normalizedEmail,
    });
    const token = issueRegistrationToken(cliente);
    await cliente.save();

    // El cliente ya quedó creado (con su token de invitación) aunque el
    // envío del email falle: el admin puede reintentarlo con "Reenviar".
    let emailError = null;
    try {
      await sendRegistrationEmail({
        to: cliente.email,
        nombre: cliente.nombre,
        registrationUrl: buildRegistrationUrl(token),
      });
    } catch (err) {
      emailError = err.message;
    }

    res.status(201).json({ cliente, emailError });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reenviar", requireAuth, async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    if (cliente.clienteActivo) {
      return res.status(400).json({ error: "Este cliente ya completó su registro" });
    }

    const token = issueRegistrationToken(cliente);
    await cliente.save();

    await sendRegistrationEmail({
      to: cliente.email,
      nombre: cliente.nombre,
      registrationUrl: buildRegistrationUrl(token),
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { nombre, apellido, pais, ciudad, idioma, clienteActivo } = req.body;
    const update = {};
    if (nombre !== undefined) update.nombre = nombre;
    if (apellido !== undefined) update.apellido = apellido;
    if (pais !== undefined) update.pais = pais;
    if (ciudad !== undefined) update.ciudad = ciudad;
    if (idioma !== undefined) update.idioma = idioma === "pt" ? "pt" : "es";
    if (clienteActivo !== undefined) update.clienteActivo = Boolean(clienteActivo);

    const cliente = await Cliente.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ cliente });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- Público: completar registro desde el link del email ---

router.get("/registro/:token", registroLimiter, async (req, res, next) => {
  try {
    const cliente = await Cliente.findOne({ registrationToken: req.params.token }).select(
      "+registrationToken +registrationTokenExpires"
    );

    if (!cliente || !cliente.registrationTokenExpires || cliente.registrationTokenExpires < new Date()) {
      return res.status(404).json({ error: "El enlace de registro no es válido o expiró" });
    }

    res.json({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      pais: cliente.pais,
      ciudad: cliente.ciudad,
      idioma: cliente.idioma,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/registro/:token", registroLimiter, async (req, res, next) => {
  try {
    const { nombre, apellido, password, pais, ciudad, idioma } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    if (!apellido) {
      return res.status(400).json({ error: "El apellido es obligatorio" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const cliente = await Cliente.findOne({ registrationToken: req.params.token }).select(
      "+registrationToken +registrationTokenExpires"
    );

    if (!cliente || !cliente.registrationTokenExpires || cliente.registrationTokenExpires < new Date()) {
      return res.status(404).json({ error: "El enlace de registro no es válido o expiró" });
    }

    cliente.nombre = nombre;
    cliente.apellido = apellido;
    cliente.passwordHash = await Cliente.hashPassword(password);
    if (pais !== undefined) cliente.pais = pais;
    if (ciudad !== undefined) cliente.ciudad = ciudad;
    if (idioma !== undefined) cliente.idioma = idioma === "pt" ? "pt" : "es";
    cliente.fechaIngreso = new Date();
    cliente.clienteActivo = true;
    cliente.registrationToken = null;
    cliente.registrationTokenExpires = null;
    await cliente.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
