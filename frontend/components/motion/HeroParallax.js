"use client";

import { useEffect, useRef } from "react";

/**
 * Contenedor del hero que expone la posición del puntero y el progreso de
 * scroll como variables CSS (--mx, --my en [-1, 1] y --sy en [0, 1]).
 * Las capas del hero las usan en su `transform` para moverse a distinta
 * profundidad. El movimiento se interpola con rAF para que sea suave.
 */
export default function HeroParallax({ as: Tag = "section", className = "", children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const pointerQuery = window.matchMedia("(pointer: fine) and (min-width: 900px)");
    let raf = 0;
    let target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    function render() {
      raf = 0;
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;

      const height = el.offsetHeight || 1;
      const scroll = Math.min(Math.max(window.scrollY / height, 0), 1);

      el.style.setProperty("--mx", current.x.toFixed(4));
      el.style.setProperty("--my", current.y.toFixed(4));
      el.style.setProperty("--sy", scroll.toFixed(4));

      if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
        schedule();
      }
    }

    const onPointerMove = (event) => {
      if (!pointerQuery.matches) return;
      const rect = el.getBoundingClientRect();
      target = {
        x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      };
      schedule();
    };

    const onPointerLeave = () => {
      target = { x: 0, y: 0 };
      schedule();
    };

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
