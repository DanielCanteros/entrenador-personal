/**
 * Avisa al frontend (Next.js) que invalide la caché de posts cuando cambia
 * algo en el blog. Es "best effort": si falla (frontend caído, secreto mal
 * configurado, etc.) no debe romper la operación que lo disparó, la caché
 * simplemente se autocorrige con su revalidación por tiempo de respaldo.
 */
export async function triggerPostsRevalidate() {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
    });
    if (!res.ok) {
      console.error(`[revalidate] El frontend respondió ${res.status}`);
    }
  } catch (err) {
    console.error("[revalidate] No se pudo avisar al frontend:", err.message);
  }
}
