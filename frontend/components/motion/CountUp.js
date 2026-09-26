"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cuenta de 0 al valor final cuando el número entra en pantalla.
 * El HTML del servidor ya trae el valor final (SEO / sin JS) y los lectores
 * de pantalla leen siempre el valor final, nunca los intermedios.
 */
export default function CountUp({ value, prefix = "", suffix = "", duration = 1800, delay = 0 }) {
  const ref = useRef(null);
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let raf = 0;
    let timer = 0;
    setCurrent(0);

    const run = () => {
      let start = 0;
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCurrent(Math.round(value * eased));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          timer = window.setTimeout(run, delay);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className="count-up">
      <span aria-hidden="true">
        {prefix}
        {current}
        {suffix}
      </span>
      <span className="visually-hidden">
        {prefix}
        {value}
        {suffix}
      </span>
    </span>
  );
}
