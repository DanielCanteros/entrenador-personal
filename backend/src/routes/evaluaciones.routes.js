import { Router } from "express";
import { Evaluacion } from "../models/Evaluacion.js";
import { Cliente } from "../models/Cliente.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/cliente/:clienteId", requireAuth, async (req, res, next) => {
  try {
    const cliente = await Cliente.findById(req.params.clienteId);
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

    const evaluacion = await Evaluacion.findOne({ id_user: cliente.id_user });
    res.json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { clienteId, edad, estatura, peso, fecha_evaluacion } = req.body;
    if (!clienteId) {
      return res.status(400).json({ error: "El cliente es obligatorio" });
    }
    if (peso === undefined || peso === null || !fecha_evaluacion) {
      return res.status(400).json({ error: "Peso y fecha de evaluación son obligatorios" });
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const existing = await Evaluacion.findOne({ id_user: cliente.id_user });
    if (existing) {
      return res.status(409).json({ error: "Este cliente ya tiene una evaluación creada" });
    }

    const evaluacion = await Evaluacion.create({
      id_user: cliente.id_user,
      edad,
      estatura,
      historico_evaluacion: [{ peso, fecha_evaluacion }],
    });

    res.status(201).json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { edad, estatura } = req.body;
    const update = {};
    if (edad !== undefined) update.edad = edad;
    if (estatura !== undefined) update.estatura = estatura;

    const evaluacion = await Evaluacion.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });
    res.json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/historico", requireAuth, async (req, res, next) => {
  try {
    const { peso, fecha_evaluacion } = req.body;
    if (peso === undefined || peso === null || !fecha_evaluacion) {
      return res.status(400).json({ error: "Peso y fecha de evaluación son obligatorios" });
    }

    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    evaluacion.historico_evaluacion.push({ peso, fecha_evaluacion });
    await evaluacion.save();

    res.status(201).json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/historico/:entryId", requireAuth, async (req, res, next) => {
  try {
    const { peso, fecha_evaluacion } = req.body;

    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    const entry = evaluacion.historico_evaluacion.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: "Registro histórico no encontrado" });

    if (peso !== undefined) entry.peso = peso;
    if (fecha_evaluacion !== undefined) entry.fecha_evaluacion = fecha_evaluacion;
    await evaluacion.save();

    res.json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

export default router;
