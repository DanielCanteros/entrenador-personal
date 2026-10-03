"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "../../lib/formato.js";

/**
 * Número que se anima hasta su valor: desde 0 la primera vez que entra en
 * pantalla y desde el valor anterior cuando cambia (p. ej. al cambiar de
 * métrica o de evaluación a comparar). Los lectores de pantalla leen siempre
 * el valor final. Ver también motion/CountUp (enteros, secciones públicas).
 */
export default function AnimatedNumber({ value, decimales = 1, duration = 1400 }) {
  const ref = useRef(null);
  // Último valor mostrado (null = todavía no se animó nunca).
  const shownRef = useRef(null);
  // Arranca en 0 (el panel se monta ya con datos, en el cliente) para que
  // no se vea un salto del valor final a 0 antes de animar.
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (value === null || value === undefined) return undefined;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(value);
      shownRef.current = value;
      return undefined;
    }

    let raf = 0;
    const from = shownRef.current ?? 0;
    const run = () => {
      let start = 0;
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        shownRef.current = from + (value - from) * eased;
        setCurrent(shownRef.current);
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (shownRef.current !== null) {
      run();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  if (value === null || value === undefined) return <span>–</span>;

  return (
    <span ref={ref} className="anim-number">
      <span aria-hidden="true">{fmt(current, decimales)}</span>
      <span className="visually-hidden">{fmt(value, decimales)}</span>
    </span>
  );
}
