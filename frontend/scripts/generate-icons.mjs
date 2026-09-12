/**
 * Genera favicon.ico, apple-touch-icon.png, icon-192.png e icon-512.png
 * como placeholders simples (iniciales de la marca) a partir de site.config.js.
 * Reemplázalos más adelante por el logo real del entrenador.
 *
 * Uso: npm run generate:icons
 */
import sharp from "sharp";
import pngToIco from "png-to-ico";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "../site.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const appDir = path.join(__dirname, "..", "app");

const initials = siteConfig.brandName
  .split(" ")
  .filter(Boolean)
  .map((word) => word[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

function svgIcon(size) {
  const fontSize = Math.round(size * 0.42);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#10141a" />
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="#c8ff3d">${initials}</text>
  </svg>`;
}

async function main() {
  await fs.mkdir(publicDir, { recursive: true });

  const targets = [
    { size: 512, file: "icon-512.png" },
    { size: 192, file: "icon-192.png" },
    { size: 180, file: "apple-touch-icon.png" },
  ];

  for (const { size, file } of targets) {
    await sharp(Buffer.from(svgIcon(size))).png().toFile(path.join(publicDir, file));
    console.log(`[icons] Generado public/${file}`);
  }

  const icoSizes = [16, 32, 48];
  const buffers = await Promise.all(
    icoSizes.map((size) => sharp(Buffer.from(svgIcon(size))).png().toBuffer())
  );
  const icoBuffer = await pngToIco(buffers);
  await fs.writeFile(path.join(appDir, "favicon.ico"), icoBuffer);
  console.log("[icons] Generado app/favicon.ico");
}

main().catch((err) => {
  console.error("[icons] Error generando iconos:", err);
  process.exit(1);
});
