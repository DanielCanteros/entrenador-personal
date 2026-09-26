import fs from "node:fs";
import path from "node:path";

// Foto del entrenador para el hero. Basta con dejar uno de estos archivos en
// public/images/ (idealmente PNG/WebP con fondo transparente, recortado a la
// altura de la cintura, ~1200px de alto). Si no existe, el hero muestra un
// monograma con las iniciales en su lugar.
const CANDIDATES = ["entrenador-hero.webp", "entrenador-hero.png", "entrenador-hero.jpg"];

export function getHeroImage() {
  const dir = path.join(process.cwd(), "public", "images");
  const file = CANDIDATES.find((name) => fs.existsSync(path.join(dir, name)));
  return file ? `/images/${file}` : null;
}
