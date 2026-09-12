"use client";

import { useEffect } from "react";
import { useSetLocaleAlternates } from "../context/LocaleAlternatesContext.js";

// Componente sin salida visual: al montarse en la página de un post,
// informa al header qué ruta usar por idioma en el selector de idioma;
// al desmontarse, restaura el comportamiento por defecto del selector.
export default function BlogLocaleSync({ alternates }) {
  const setAlternates = useSetLocaleAlternates();

  useEffect(() => {
    setAlternates(alternates);
    return () => setAlternates(null);
  }, [alternates, setAlternates]);

  return null;
}
