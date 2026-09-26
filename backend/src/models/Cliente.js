import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const clienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    // El admin solo carga nombre y email al invitar; el resto lo completa
    // el propio cliente desde el link de registro.
    apellido: { type: String, trim: true, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    pais: { type: String, trim: true, default: "" },
    ciudad: { type: String, trim: true, default: "" },
    passwordHash: { type: String, default: null },
    idioma: { type: String, enum: ["es", "pt"], default: "es" },
    fechaIngreso: { type: Date, default: null },
    clienteActivo: { type: Boolean, default: false },
    // Identificador numérico de 5 dígitos, estable y legible, que usan otras
    // colecciones (p. ej. evaluaciones.id_user) para referenciar al usuario
    // en vez del ObjectId interno de Mongo. Se autogenera al crear el cliente.
    id_user: { type: Number, min: 10000, max: 99999, unique: true },
    registrationToken: { type: String, default: null, select: false },
    registrationTokenExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

clienteSchema.index({ registrationToken: 1 });

clienteSchema.pre("validate", async function assignIdUser(next) {
  if (this.id_user !== undefined && this.id_user !== null) return next();

  const Cliente = this.constructor;
  let candidate;
  let attempts = 0;
  do {
    candidate = Math.floor(10000 + Math.random() * 90000);
    attempts += 1;
    // eslint-disable-next-line no-await-in-loop
  } while (attempts < 20 && (await Cliente.exists({ id_user: candidate })));

  this.id_user = candidate;
  next();
});

clienteSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

clienteSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

clienteSchema.statics.generateRegistrationToken = function generateRegistrationToken() {
  return crypto.randomBytes(32).toString("hex");
};

clienteSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.registrationToken;
    delete ret.registrationTokenExpires;
    return ret;
  },
});

export const Cliente = mongoose.model("Cliente", clienteSchema);
