import { Router } from "express";
import { Evaluacion, PERIMETROS, PLIEGUES } from "../models/Evaluacion.js";
import { Cliente } from "../models/Cliente.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// "" y null borran el valor; undefined significa "no tocar" (PATCH parcial).
function toNumber(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickNumbers(source, keys) {
  if (!source || typeof source !== "object") return undefined;
  const out = {};
  keys.forEach((key) => {
    const value = toNumber(source[key]);
    if (value !== undefined) out[key] = value;
  });
  return out;
}

// Campos de un registro del histórico que acepta la API.
function pickEntry(body) {
  const entry = {};
  const peso = toNumber(body.peso);
  if (peso !== undefined) entry.peso = peso;
  if (body.fecha_evaluacion !== undefined) entry.fecha_evaluacion = body.fecha_evaluacion;
  const edad = toNumber(body.edad);
  if (edad !== undefined) entry.edad = edad;
  const grasa = toNumber(body.porcentaje_grasa_manual);
  if (grasa !== undefined) entry.porcentaje_grasa_manual = grasa;
  if (body.nota !== undefined) entry.nota = String(body.nota ?? "");
  const pliegues = pickNumbers(body.pliegues, PLIEGUES);
  if (pliegues) entry.pliegues = pliegues;
  const perimetros = pickNumbers(body.perimetros, PERIMETROS);
  if (perimetros) entry.perimetros = perimetros;
  return entry;
}

function pickObjetivos(source) {
  if (!source || typeof source !== "object") return undefined;
  const out = pickNumbers(source, ["peso", "porcentaje_grasa", "masa_magra", "cintura"]);
  if (source.fecha_limite !== undefined) out.fecha_limite = source.fecha_limite || null;
  if (source.descripcion !== undefined) out.descripcion = String(source.descripcion ?? "");
  return out;
}

function pickPerfil(body) {
  const update = {};
  const edad = toNumber(body.edad);
  if (edad !== undefined) update.edad = edad;
  const estatura = toNumber(body.estatura);
  if (estatura !== undefined) update.estatura = estatura;
  const frecuencia = toNumber(body.frecuencia_dias);
  if (frecuencia !== undefined && frecuencia !== null) update.frecuencia_dias = frecuencia;
  if (body.sexo !== undefined) update.sexo = body.sexo === "M" || body.sexo === "F" ? body.sexo : null;
  return update;
}

function requirePesoYFecha(entry, res) {
  if (entry.peso === undefined || entry.peso === null || !entry.fecha_evaluacion) {
    res.status(400).json({ error: "Peso y fecha de evaluación son obligatorios" });
    return false;
  }
  return true;
}

// Importación en lote (CSV): tope para no inflar el documento por error.
const MAX_LOTE = 200;

// Sanea un array de registros del histórico. Devuelve null (y responde 400)
// si alguno es inválido: el lote se guarda entero o no se guarda.
function pickLote(entries, res) {
  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ error: "No hay evaluaciones para importar" });
    return null;
  }
  if (entries.length > MAX_LOTE) {
    res.status(400).json({ error: `Se pueden importar hasta ${MAX_LOTE} evaluaciones a la vez` });
    return null;
  }
  const picked = entries.map((raw) => pickEntry(raw && typeof raw === "object" ? raw : {}));
  const invalida = picked.findIndex(
    (entry) => entry.peso === undefined || entry.peso === null || !entry.fecha_evaluacion
  );
  if (invalida !== -1) {
    res.status(400).json({ error: `La evaluación ${invalida + 1} del lote no tiene peso o fecha` });
    return null;
  }
  return picked;
}

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
    const { clienteId } = req.body;
    if (!clienteId) {
      return res.status(400).json({ error: "El cliente es obligatorio" });
    }
    // Una evaluación (formulario) o varias (importación CSV en `historico`).
    let entries;
    if (req.body.historico !== undefined) {
      entries = pickLote(req.body.historico, res);
      if (!entries) return;
    } else {
      const entry = pickEntry(req.body);
      if (!requirePesoYFecha(entry, res)) return;
      entries = [entry];
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const existing = await Evaluacion.findOne({ id_user: cliente.id_user });
    if (existing) {
      return res.status(409).json({ error: "Este cliente ya tiene una evaluación creada" });
    }

    const perfil = pickPerfil(req.body);
    const evaluacion = await Evaluacion.create({
      id_user: cliente.id_user,
      ...perfil,
      objetivos: pickObjetivos(req.body.objetivos) || {},
      historico_evaluacion: entries.map((entry) => ({ ...entry, edad: entry.edad ?? perfil.edad ?? null })),
    });

    res.status(201).json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    Object.assign(evaluacion, pickPerfil(req.body));
    const objetivos = pickObjetivos(req.body.objetivos);
    if (objetivos) {
      if (!evaluacion.objetivos) evaluacion.objetivos = {};
      Object.entries(objetivos).forEach(([key, value]) => {
        evaluacion.objetivos[key] = value;
      });
    }
    await evaluacion.save();

    res.json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/historico", requireAuth, async (req, res, next) => {
  try {
    const entry = pickEntry(req.body);
    if (!requirePesoYFecha(entry, res)) return;

    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    evaluacion.historico_evaluacion.push({ ...entry, edad: entry.edad ?? evaluacion.edad ?? null });
    await evaluacion.save();

    res.status(201).json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/historico/lote", requireAuth, async (req, res, next) => {
  try {
    const entries = pickLote(req.body.entries, res);
    if (!entries) return;

    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    entries.forEach((entry) => {
      evaluacion.historico_evaluacion.push({ ...entry, edad: entry.edad ?? evaluacion.edad ?? null });
    });
    await evaluacion.save();

    res.status(201).json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/historico/:entryId", requireAuth, async (req, res, next) => {
  try {
    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    const entry = evaluacion.historico_evaluacion.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: "Registro histórico no encontrado" });

    const { pliegues, perimetros, ...rest } = pickEntry(req.body);
    if (rest.peso === null) {
      return res.status(400).json({ error: "El peso es obligatorio" });
    }
    Object.assign(entry, rest);
    // Registros creados antes de que existieran pliegues/perímetros.
    if (!entry.pliegues) entry.pliegues = {};
    if (!entry.perimetros) entry.perimetros = {};
    Object.entries(pliegues || {}).forEach(([key, value]) => {
      entry.pliegues[key] = value;
    });
    Object.entries(perimetros || {}).forEach(([key, value]) => {
      entry.perimetros[key] = value;
    });
    await evaluacion.save();

    res.json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/historico/:entryId", requireAuth, async (req, res, next) => {
  try {
    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    const entry = evaluacion.historico_evaluacion.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: "Registro histórico no encontrado" });
    if (evaluacion.historico_evaluacion.length === 1) {
      return res.status(400).json({ error: "No se puede eliminar la única evaluación del cliente" });
    }

    entry.deleteOne();
    await evaluacion.save();

    res.json({ evaluacion });
  } catch (err) {
    next(err);
  }
});

export default router;
