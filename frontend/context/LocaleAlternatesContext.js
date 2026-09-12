"use client";

import { createContext, useContext, useState } from "react";

const AlternatesContext = createContext(null);
const SetAlternatesContext = createContext(null);

/**
 * Permite que una página (p. ej. el detalle de un post de blog, donde el
 * slug cambia según el idioma) le indique al selector de idioma del header
 * a qué ruta concreta debe llevar cada idioma, en lugar del comportamiento
 * por defecto (mantener el mismo pathname).
 */
export function LocaleAlternatesProvider({ children }) {
  const [alternates, setAlternates] = useState(null);

  return (
    <AlternatesContext.Provider value={alternates}>
      <SetAlternatesContext.Provider value={setAlternates}>{children}</SetAlternatesContext.Provider>
    </AlternatesContext.Provider>
  );
}

export function useLocaleAlternates() {
  return useContext(AlternatesContext);
}

export function useSetLocaleAlternates() {
  return useContext(SetAlternatesContext);
}
