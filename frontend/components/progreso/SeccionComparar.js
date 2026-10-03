"use client";

import { useState } from "react";
import Delta from "./Delta.js";
import { PERIMETROS, PLIEGUES, direccionPeso } from "../../lib/composicion.js";
import { fmt, fmtFecha } from "../../lib/formato.js";

// Filas de la comparación: [etiqueta, getter, unidad, decimales, dir de mejora]
const FILAS = [
  { grupo: "Composición" },
  ["Peso", (p) => p.c.peso, "kg", 1, 0],
  ["% Grasa", (p) => p.c.porcentajeGrasa, "%", 1, -1],
  ["Masa magra", (p) => p.c.masaMagra, "kg", 1, 1],
  ["Masa grasa", (p) => p.c.masaGrasa, "kg", 1, -1],
  ["Σ Pliegues", (p) => p.c.sumaPliegues, "mm", 0, -1],
  { grupo: "Perímetros" },
  ...PERIMETROS.map((per) => [
    per.label,
    (p) => p.perimetros?.[per.key] ?? null,
    "cm",
    1,
    ["cintura", "abdomen", "cadera"].includes(per.key) ? -1 : per.grupo === "muslo" ? 0 : 1,
  ]),
  { grupo: "Pliegues cutáneos" },
  ...PLIEGUES.map((pl) => [pl.label, (p) => p.pliegues?.[pl.key] ?? null, "mm", 1, -1]),
];

export default function SeccionComparar({ serie, objetivos }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(serie.length - 1);
  if (serie.length < 2) return null;

  const A = serie[a];
  const B = serie[b];
  const dirPeso = direccionPeso(serie, objetivos);
  const dias = Math.round(Math.abs(B.fecha - A.fecha) / 86400000);

  // Oculta grupos sin ningún dato en las dos evaluaciones elegidas.
  const filas = [];
  let grupoActual = null;
  FILAS.forEach((f) => {
    if (!Array.isArray(f)) {
      grupoActual = { titulo: f.grupo, filas: [] };
      filas.push(grupoActual);
      return;
    }
    const [label, get, unidad, dec, dirBase] = f;
    // Peso y muslo: progreso según si la meta de peso es bajar o subir.
    const dir = dirBase === 0 ? dirPeso : dirBase;
    const va = get(A);
    const vb = get(B);
    if ((va === null || va === undefined) && (vb === null || vb === undefined)) return;
    grupoActual.filas.push({ label, va, vb, unidad, dec, dir });
  });

  const opcion = (p, i) => (
    <option key={p.id} value={i}>
      N° {p.numero} · {fmtFecha(p.fecha)}
    </option>
  );

  return (
    <section className="prog-section" aria-labelledby="prog-comparar">
      <header className="prog-section__head">
        <div>
          <p className="eyebrow">Antes y después</p>
          <h2 id="prog-comparar" className="prog-section__title">
            Compará tus evaluaciones
          </h2>
        </div>
      </header>

      <div className="prog-comparar card">
        <div className="prog-comparar__pickers">
          <label className="field">
            <span>Desde</span>
            <select value={a} onChange={(e) => setA(Number(e.target.value))}>
              {serie.map(opcion)}
            </select>
          </label>
          <span className="prog-comparar__dias">{dias} días</span>
          <label className="field">
            <span>Hasta</span>
            <select value={b} onChange={(e) => setB(Number(e.target.value))}>
              {serie.map(opcion)}
            </select>
          </label>
        </div>

        <div className="prog-comparar__table">
          <table>
            <thead>
              <tr>
                <th scope="col">Medida</th>
                <th scope="col">N° {A.numero}</th>
                <th scope="col">N° {B.numero}</th>
                <th scope="col">Cambio</th>
              </tr>
            </thead>
            {filas
              .filter((g) => g.filas.length)
              .map((g) => (
                <tbody key={g.titulo}>
                  <tr className="prog-comparar__grupo">
                    <th colSpan={4} scope="colgroup">
                      {g.titulo}
                    </th>
                  </tr>
                  {g.filas.map((f) => (
                    <tr key={f.label}>
                      <th scope="row">{f.label}</th>
                      <td>{f.va !== null && f.va !== undefined ? `${fmt(f.va, f.dec)} ${f.unidad}` : "–"}</td>
                      <td>{f.vb !== null && f.vb !== undefined ? `${fmt(f.vb, f.dec)} ${f.unidad}` : "–"}</td>
                      <td>
                        {f.va !== null && f.vb !== null && f.va !== undefined && f.vb !== undefined ? (
                          <Delta value={f.vb - f.va} dir={b >= a ? f.dir : -f.dir} decimales={f.dec} unidad={f.unidad} />
                        ) : (
                          "–"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
          </table>
        </div>
      </div>
    </section>
  );
}
