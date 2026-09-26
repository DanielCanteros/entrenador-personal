import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectDB, disconnectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import postsRoutes from "./routes/posts.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import clienteAuthRoutes from "./routes/clienteAuth.routes.js";
import evaluacionesRoutes from "./routes/evaluaciones.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(",") || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Las imágenes subidas nunca cambian una vez creadas (nombre con UUID
// aleatorio), así que se pueden cachear "para siempre" sin riesgo de servir
// contenido desactualizado.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    maxAge: "1y",
    immutable: true,
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "entrenador-personal-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/cliente-auth", clienteAuthRoutes);
app.use("/api/evaluaciones", evaluacionesRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`[server] API escuchando en http://localhost:${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`[server] ${signal} recibido, cerrando...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  })
  .catch((err) => {
    console.error("[server] No se pudo conectar a MongoDB:", err.message);
    process.exit(1);
  });
