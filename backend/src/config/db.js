import dns from "node:dns";
import mongoose from "mongoose";

// Algunos resolutores DNS locales (p. ej. el stub de Windows en 127.0.0.1)
// no resuelven bien los registros SRV/TXT que usa mongodb+srv://, y la
// conexión falla con "querySrv ECONNREFUSED" aunque la URI sea correcta.
// Forzar DNS públicos evita ese problema, tanto en desarrollo como en la VM.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta la variable de entorno MONGODB_URI");
  }

  mongoose.set("strictQuery", true);

  // Sin esto, si el clúster no responde, mongoose reintenta en silencio
  // hasta 30s por defecto antes de rechazar la promesa: el arranque del
  // servidor parece "colgado" en vez de fallar con un error claro.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`[db] Conectado a MongoDB: ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] Error de conexión MongoDB:", err);
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
