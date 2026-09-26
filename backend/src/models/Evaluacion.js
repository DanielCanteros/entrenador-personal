import mongoose from "mongoose";

// Un punto en el tiempo dentro del historial de evaluaciones de un cliente.
// Por ahora solo peso + fecha, pero se van a sumar más métricas más adelante.
const historicoEntrySchema = new mongoose.Schema(
  {
    peso: { type: Number, required: true },
    fecha_evaluacion: { type: Date, required: true },
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

const evaluacionSchema = new mongoose.Schema(
  {
    // Un solo registro de evaluación por cliente (usuario): los datos que
    // cambian con el tiempo (peso, fecha) viven dentro de historico_evaluacion.
    // Referencia al id_user numérico de 5 dígitos de Cliente (no su ObjectId).
    id_user: {
      type: Number,
      required: true,
      unique: true,
    },
    edad: { type: Number, default: null },
    estatura: { type: Number, default: null },
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
