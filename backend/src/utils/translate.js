/**
 * Traducción automática gratuita usando el endpoint público (no oficial) de
 * Google Translate. No requiere cuenta ni API key, pero no es un servicio
 * documentado/soportado oficialmente: puede fallar o cambiar sin aviso. Por
 * eso quien la usa (posts.routes.js) siempre debe tratar los errores como
 * recuperables y no bloquear la creación del borrador de traducción.
 */

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const MAX_CHUNK_LENGTH = 1800;
const DELAY_BETWEEN_REQUESTS_MS = 150;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitIntoChunks(text, maxLength) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let current = "";
  for (const line of text.split("\n")) {
    if ((current + "\n" + line).length > maxLength && current) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(text, from, to) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: from,
    tl: to,
    dt: "t",
    q: text,
  });

  const res = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Google Translate respondió ${res.status}`);
  }

  const data = await res.json();
  const segments = data?.[0];
  if (!Array.isArray(segments)) {
    throw new Error("Respuesta inesperada de Google Translate");
  }

  return segments.map((segment) => segment?.[0] ?? "").join("");
}

async function translateText(text, from, to) {
  if (!text || !text.trim()) return text || "";

  const paragraphs = text.split(/\n\n+/);
  const translatedParagraphs = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      translatedParagraphs.push(paragraph);
      continue;
    }

    const chunks = splitIntoChunks(paragraph, MAX_CHUNK_LENGTH);
    const translatedChunks = [];
    for (const chunk of chunks) {
      // eslint-disable-next-line no-await-in-loop
      translatedChunks.push(await translateChunk(chunk, from, to));
      // eslint-disable-next-line no-await-in-loop
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
    translatedParagraphs.push(translatedChunks.join("\n"));
  }

  return translatedParagraphs.join("\n\n");
}

export async function translatePost(post, fromLocale, toLocale) {
  const [title, excerpt, content, seoTitle, seoDescription] = await Promise.all([
    translateText(post.title, fromLocale, toLocale),
    translateText(post.excerpt, fromLocale, toLocale),
    translateText(post.content, fromLocale, toLocale),
    post.seoTitle ? translateText(post.seoTitle, fromLocale, toLocale) : Promise.resolve(""),
    post.seoDescription ? translateText(post.seoDescription, fromLocale, toLocale) : Promise.resolve(""),
  ]);

  const tags = [];
  for (const tag of post.tags || []) {
    // eslint-disable-next-line no-await-in-loop
    tags.push(await translateText(tag, fromLocale, toLocale));
    // eslint-disable-next-line no-await-in-loop
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  return { title, excerpt, content, seoTitle, seoDescription, tags };
}
