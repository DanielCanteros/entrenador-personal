"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Títulos entre los que viaja la mancuerna (dentro del contenedor padre).
const INICIO = ".testimonials .section-title";
const FIN = ".cta-final__title";

// Ancho de la mancuerna: el máximo, y el mínimo por debajo del cual se oculta.
const ANCHO_MAX = 360;
const ANCHO_MIN = 180;
// Aire entre el final del texto de los títulos y la mancuerna.
const SEPARACION = 40;
// Levantarla (solo en la posición final): cuánto sube como máximo y cuánto
// cuesta. Cuanto más tirás, menos sube: así parece pesada.
const ALTURA_MAX = 140;
const RESISTENCIA = 120;

// Posición vertical sin contar transform (las animaciones de entrada los usan).
function pageTop(el) {
  let top = 0;
  for (let node = el; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}

// Dónde termina el texto de un título (no su caja, que puede ser más ancha).
function finDelTexto(el) {
  const rango = document.createRange();
  rango.selectNodeContents(el);
  return Math.max(...[...rango.getClientRects()].map((r) => r.right));
}

/**
 * Mancuerna que acompaña el scroll en línea recta: arranca junto al título de
 * Testimonios y termina junto al del CTA final. La "pista" va del centro de un
 * título al centro del otro y la mancuerna, con position: sticky, se queda en
 * el medio de la pantalla mientras recorre la pista. El JS solo mide dónde
 * empieza y termina la pista y marca si la mancuerna está cayendo (el giro lo
 * hace una transición de CSS).
 *
 * En la posición final se puede "levantar" arrastrando hacia arriba con el
 * mouse o el dedo: sube con resistencia, tiembla por el esfuerzo y al soltarla
 * cae acelerando y rebota contra el piso.
 */
export default function MancuernaViaje() {
  const pistaRef = useRef(null);

  useEffect(() => {
    const pista = pistaRef.current;
    const contenedor = pista?.parentElement;
    if (!contenedor) return undefined;

    const carril = pista.firstElementChild;
    const mancuerna = carril.firstElementChild;
    const levante = mancuerna.firstElementChild;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Centros de los dos títulos, relativos al contenedor (los actualiza medir).
    // Relativos y no a la página: así no quedan viejos si cambia algo más arriba.
    let desde = 0;
    let hasta = 0;
    // Mientras se levanta: { id, x0, y0, alto, dx }
    let agarre = null;
    let cuadro = 0;

    // Temblor por el esfuerzo: más fuerte cuanto más alto está.
    const temblar = () => {
      if (!agarre) return;
      const amplitud = 0.5 + 2.5 * (agarre.alto / ALTURA_MAX);
      const sacudida = () => (Math.random() * 2 - 1) * amplitud;
      levante.style.transform = `translate(${agarre.dx + sacudida()}px, ${sacudida() - agarre.alto}px) rotate(${sacudida() * 0.4}deg)`;
      cuadro = requestAnimationFrame(temblar);
    };

    // Tocó el piso: rebote. (El giro de la imagen también avisa "transitionend"
    // y sube hasta acá, por eso se filtra por elemento.)
    const alCaer = (e) => {
      if (e.target !== levante) return;
      levante.removeEventListener("transitionend", alCaer);
      levante.style.transition = "";
      levante.style.transform = "";
      levante.dataset.golpe = "";
    };

    // Al soltarla cae acelerando (como con gravedad) y rebota al tocar el piso.
    const soltar = (sinAnimacion = false) => {
      if (!agarre) return;
      cancelAnimationFrame(cuadro);
      const { alto } = agarre;
      agarre = null;
      delete mancuerna.dataset.levantando;
      if (sinAnimacion || alto < 2) {
        levante.style.transition = "";
        levante.style.transform = "";
        return;
      }
      const duracion = 0.12 + 0.28 * Math.sqrt(alto / ALTURA_MAX);
      levante.style.transition = `transform ${duracion}s cubic-bezier(0.55, 0, 1, 0.45)`;
      levante.style.transform = "translate(0px, 0px)";
      levante.addEventListener("transitionend", alCaer);
    };

    const alPresionar = (e) => {
      if (!mancuerna.hasAttribute("data-final")) return;
      e.preventDefault();
      mancuerna.setPointerCapture(e.pointerId);
      // Si la agarra mientras todavía cae, la caída se corta
      levante.removeEventListener("transitionend", alCaer);
      delete levante.dataset.golpe;
      levante.style.transition = "none";
      agarre = { id: e.pointerId, x0: e.clientX, y0: e.clientY, alto: 0, dx: 0 };
      mancuerna.dataset.levantando = "";
      cuadro = requestAnimationFrame(temblar);
    };

    const alMover = (e) => {
      if (!agarre || e.pointerId !== agarre.id) return;
      const tirada = Math.max(0, agarre.y0 - e.clientY);
      agarre.alto = ALTURA_MAX * (1 - Math.exp(-tirada / RESISTENCIA));
      agarre.dx = Math.max(-24, Math.min(24, (e.clientX - agarre.x0) * 0.15));
    };

    const alSoltar = (e) => {
      if (agarre && e.pointerId === agarre.id) soltar();
    };

    const alTerminarGolpe = () => delete levante.dataset.golpe;

    // Cae mientras está pegada al centro de la pantalla: entre que el centro del
    // primer título pasa por el medio de la pantalla y que llega el del segundo.
    // Pasado el segundo está en su posición final y se puede levantar.
    const actualizar = () => {
      const medio = window.scrollY + window.innerHeight / 2 - pageTop(contenedor);
      const cayendo = medio > desde + 1 && medio < hasta - 1;
      const final = medio >= hasta - 1 && !reducido.matches;
      if (cayendo !== mancuerna.hasAttribute("data-cayendo")) {
        mancuerna.toggleAttribute("data-cayendo", cayendo);
      }
      if (final !== mancuerna.hasAttribute("data-final")) {
        mancuerna.toggleAttribute("data-final", final);
        if (!final) soltar(true);
      }
    };

    const medir = () => {
      // Se buscan en cada medición: si React reemplaza una sección (recarga en
      // caliente, cambio de idioma) un título guardado de antes ya no está en la
      // página y mediría 0, y la pista arrancaría miles de px más arriba.
      const inicio = contenedor.querySelector(INICIO);
      const fin = contenedor.querySelector(FIN);
      if (!inicio || !fin) {
        delete pista.dataset.listo;
        return;
      }

      // Ancho: lo que queda libre a la derecha de los dos títulos. Si no entra, no se muestra.
      const borde =
        carril.getBoundingClientRect().right -
        parseFloat(getComputedStyle(carril).paddingRight) -
        parseFloat(getComputedStyle(mancuerna).marginRight);
      const libre = borde - Math.max(finDelTexto(inicio), finDelTexto(fin)) - SEPARACION;
      const ancho = Math.min(ANCHO_MAX, window.innerWidth * 0.24, libre);
      if (ancho < ANCHO_MIN) {
        delete pista.dataset.listo;
        return;
      }

      const base = pageTop(contenedor);
      const centro = (el) => pageTop(el) - base + el.offsetHeight / 2;
      pista.style.setProperty("--viaje-alto", `${ancho / 1.5}px`);
      pista.style.setProperty("--viaje-inicio", `${centro(inicio)}px`);
      pista.style.setProperty("--viaje-largo", `${Math.max(0, centro(fin) - centro(inicio))}px`);
      pista.dataset.listo = "";
      desde = centro(inicio);
      hasta = centro(fin);
      actualizar();
    };

    medir();
    // La fuente de los títulos cambia su ancho y su alto al terminar de cargar.
    document.fonts?.ready.then(medir);
    // Cambia la altura al abrir una pregunta del FAQ, cargar fuentes o imágenes, etc.
    const ro = new ResizeObserver(medir);
    ro.observe(contenedor);
    // Si se reemplaza el contenido de alguna sección (sin cambiar de tamaño), se vuelve a medir.
    let pendiente = 0;
    const mo = new MutationObserver(() => {
      if (!pendiente) pendiente = requestAnimationFrame(() => ((pendiente = 0), medir()));
    });
    mo.observe(contenedor, { childList: true, subtree: true });
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", actualizar, { passive: true });
    mancuerna.addEventListener("pointerdown", alPresionar);
    mancuerna.addEventListener("pointermove", alMover);
    mancuerna.addEventListener("pointerup", alSoltar);
    mancuerna.addEventListener("pointercancel", alSoltar);
    mancuerna.addEventListener("lostpointercapture", alSoltar);
    levante.addEventListener("animationend", alTerminarGolpe);
    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(pendiente);
      cancelAnimationFrame(cuadro);
      levante.removeEventListener("transitionend", alCaer);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", actualizar);
      mancuerna.removeEventListener("pointerdown", alPresionar);
      mancuerna.removeEventListener("pointermove", alMover);
      mancuerna.removeEventListener("pointerup", alSoltar);
      mancuerna.removeEventListener("pointercancel", alSoltar);
      mancuerna.removeEventListener("lostpointercapture", alSoltar);
      levante.removeEventListener("animationend", alTerminarGolpe);
    };
  }, []);

  return (
    <div ref={pistaRef} className="viaje" aria-hidden="true">
      <div className="container viaje__carril">
        <div className="viaje__mancuerna">
          {/* El contenedor sube y tiembla al levantarla; la imagen hace el giro de la caída */}
          <div className="viaje__levante">
            <Image
              src="/images/Mancuerna ajustable de hierro y cromo.png"
              alt=""
              width={1536}
              height={1024}
              sizes="360px"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
