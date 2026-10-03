"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// De la más lejana a la más cercana. Las lejanas son más chicas, más borrosas
// y caen más lento (parallax). La posición, el tamaño, el desenfoque, el tramo
// del scroll en el que caen y el giro se definen en CSS (.caida__mancuerna--*).
const MANCUERNAS = [
  { id: "lejos", src: "/images/Mancuerna hexagonal de goma negra.png", sizes: "110px" },
  { id: "medio", src: "/images/Mancuerna ajustable de hierro y cromo.png", sizes: "170px" },
  { id: "cerca", src: "/images/Mancuerna hexagonal de goma negra.png", sizes: "380px" },
];

/**
 * Mancuernas de fondo que caen dentro de la sección mientras se hace scroll:
 * entran por arriba y salen por abajo. El JS solo informa el avance de la
 * sección por la pantalla (--caida-p, de 0 a 1) y su alto; el movimiento lo
 * calcula el CSS.
 */
export default function MancuernasCaida() {
  const capaRef = useRef(null);

  useEffect(() => {
    const capa = capaRef.current;
    const seccion = capa?.parentElement;
    if (!seccion) return undefined;
    let cuadro = 0;
    let visible = false;

    const actualizar = () => {
      cuadro = 0;
      const r = seccion.getBoundingClientRect();
      const alto = window.innerHeight;
      // 0: la sección asoma por abajo de la pantalla. 1: termina de salir por arriba.
      const p = Math.min(1, Math.max(0, (alto - r.top) / (alto + r.height)));
      capa.style.setProperty("--caida-p", p.toFixed(4));
      capa.style.setProperty("--caida-alto", `${r.height}px`);
    };
    const pedir = () => {
      if (visible && !cuadro) cuadro = requestAnimationFrame(actualizar);
    };

    // Solo se calcula mientras la sección está en pantalla.
    const io = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      pedir();
    });
    io.observe(seccion);
    actualizar();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      io.disconnect();
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, []);

  return (
    <div ref={capaRef} className="caida" aria-hidden="true">
      {MANCUERNAS.map((m) => (
        <div key={m.id} className={`caida__mancuerna caida__mancuerna--${m.id}`}>
          <Image src={m.src} alt="" width={1536} height={1024} sizes={m.sizes} draggable={false} />
        </div>
      ))}
    </div>
  );
}
