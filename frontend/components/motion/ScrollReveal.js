"use client";

import { useEffect } from "react";

/**
 * Anima la entrada de cualquier elemento con el atributo `data-reveal` cuando
 * entra en el viewport. Se monta una sola vez (layout raíz) y observa también
 * los nodos que se agregan después (navegación client-side, streaming).
 *
 * Sin JS o con "reducir movimiento" el contenido se ve siempre: los estilos
 * que lo ocultan solo aplican cuando <html data-reveal-ready> está presente.
 * El retraso de cada elemento se controla con la variable CSS --reveal-delay.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const scan = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches("[data-reveal]:not([data-revealed])")) io.observe(node);
      node.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => io.observe(el));
    };

    scan(document.body);
    root.setAttribute("data-reveal-ready", "");

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(scan));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
