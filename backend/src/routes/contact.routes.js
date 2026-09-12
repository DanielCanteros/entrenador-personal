import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados mensajes enviados. Inténtalo más tarde o escribe por WhatsApp." },
});

router.post("/", contactLimiter, async (req, res, next) => {
  try {
    const { name, email, phone, modality, message, locale } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios" });
    }

    const submission = await ContactSubmission.create({
      name,
      email,
      phone,
      modality,
      message,
      locale: locale === "pt" ? "pt" : "es",
    });

    res.status(201).json({ ok: true, id: submission._id });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const submissions = await ContactSubmission.find().sort({ createdAt: -1 }).limit(200);
    res.json({ submissions });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["new", "read"].includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const submission = await ContactSubmission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: "Mensaje no encontrado" });

    res.json({ submission });
  } catch (err) {
    next(err);
  }
});

export default router;
