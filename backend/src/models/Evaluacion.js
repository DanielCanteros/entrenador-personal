import mongoose from "mongoose";

// Claves de los pliegues cutáneos (mm) del protocolo de Jackson & Pollock
// de 7 pliegues y de los perímetros (cm). Las comparte la ruta para sanear
// lo que llega en el body; el frontend usa las mismas claves
// (ver frontend/lib/composicion.js).
export const PLIEGUES = [
  "subescapular",
  "tricipital",
  "pectoral",
  "axilar_media",
  "suprailiaca",
  "abdominal",
  "muslo",
];

export const PERIMETROS = [
  "torax",
  "cintura",
  "abdomen",
  "cadera",
  "brazo_der",
  "brazo_izq",
  "antebrazo_der",
  "antebrazo_izq",
  "muslo_der",
  "muslo_izq",
  "pantorrilla_der",
  "pantorrilla_izq",
];

function numberFields(keys) {
  return Object.fromEntries(keys.map((key) => [key, { type: Number, default: null, min: 0 }]));
}

// Un punto en el tiempo dentro del historial de evaluaciones de un cliente.
// Solo se guardan las medidas crudas: % de grasa, masa magra, peso ideal, etc.
// se calculan a partir de ellas (así una corrección de edad o sexo se refleja
// en todo el histórico sin migraciones).
const historicoEntrySchema = new mongoose.Schema(
  {
    peso: { type: Number, required: true, min: 0 },
    fecha_evaluacion: { type: Date, required: true },
    // Edad al momento de la evaluación (la fórmula de Pollock la usa). Si
    // falta, se usa la edad del perfil.
    edad: { type: Number, default: null, min: 0 },
    pliegues: { type: new mongoose.Schema(numberFields(PLIEGUES), { _id: false }), default: () => ({}) },
    perimetros: { type: new mongoose.Schema(numberFields(PERIMETROS), { _id: false }), default: () => ({}) },
    // % de grasa medido por otro método (bioimpedancia, etc.). Si se carga,
    // tiene prioridad sobre el cálculo por pliegues.
    porcentaje_grasa_manual: { type: Number, default: null, min: 0, max: 100 },
    // Comentario del entrenador que el cliente ve junto a esta evaluación.
    nota: { type: String, trim: true, default: "", maxlength: 1000 },
  },
  { timestamps: false }
);

historicoEntrySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

const objetivosSchema = new mongoose.Schema(
  {
    peso: { type: Number, default: null, min: 0 },
    porcentaje_grasa: { type: Number, default: null, min: 0, max: 100 },
    masa_magra: { type: Number, default: null, min: 0 },
    cintura: { type: Number, default: null, min: 0 },
    fecha_limite: { type: Date, default: null },
    descripcion: { type: String, trim: true, default: "", maxlength: 280 },
  },
  { _id: false }
);

const evaluacionSchema = new mongoose.Schema(
  {
    // Un solo registro de evaluación por cliente (usuario): los datos que
    // cambian con el tiempo (peso, pliegues, perímetros) viven dentro de
    // historico_evaluacion.
    // Referencia al id_user numérico de 5 dígitos de Cliente (no su ObjectId).
    id_user: {
      type: Number,
      required: true,
      unique: true,
    },
    sexo: { type: String, enum: ["M", "F", null], default: null },
    edad: { type: Number, default: null },
    estatura: { type: Number, default: null },
    // Cada cuántos días se re-evalúa al cliente (cuenta regresiva en su panel).
    frecuencia_dias: { type: Number, default: 30, min: 7, max: 365 },
    objetivos: { type: objetivosSchema, default: () => ({}) },
    historico_evaluacion: { type: [historicoEntrySchema], default: [] },
  },
  { timestamps: true }
);

evaluacionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Evaluacion = mongoose.model("Evaluacion", evaluacionSchema);
