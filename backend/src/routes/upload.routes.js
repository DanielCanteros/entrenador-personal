import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireAuth } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads", "covers");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Formato de imagen no soportado (usa JPG, PNG, WEBP o AVIF)"));
    }
    cb(null, true);
  },
});

const router = Router();

router.post("/", requireAuth, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    const filename = `${Date.now()}-${crypto.randomUUID()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(filepath);

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    res.status(201).json({ url: `${baseUrl}/uploads/covers/${filename}` });
  } catch (err) {
    next(err);
  }
});

export default router;
