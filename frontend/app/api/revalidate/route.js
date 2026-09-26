import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Endpoint interno (servidor a servidor): el backend lo llama cuando un post
// cambia, para limpiar la caché de datos de Next.js al instante en vez de
// esperar a que expire la revalidación por tiempo. Protegido con un secreto
// compartido (REVALIDATE_SECRET), nunca expuesto al navegador.
export async function POST(request) {
  const secret = request.headers.get("x-revalidate-secret");

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  revalidateTag("posts");
  return NextResponse.json({ revalidated: true });
}
