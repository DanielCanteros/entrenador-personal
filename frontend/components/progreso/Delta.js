import { fmtDelta } from "../../lib/formato.js";

/**
 * Variación con flecha + texto (el color nunca es la única señal).
 * `dir`: +1 si subir es progreso, -1 si bajar es progreso, 0 neutro.
 */
export default function Delta({ value, dir = 0, decimales = 1, unidad = "", sufijo = "" }) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const rounded = Number(value.toFixed(decimales));
  const tono = rounded === 0 || dir === 0 ? "neutral" : rounded * dir > 0 ? "good" : "bad";
  const flecha = rounded > 0 ? "▲" : rounded < 0 ? "▼" : "•";
  const unit = unidad ? ` ${unidad}` : "";

  return (
    <span className={`delta delta--${tono}`}>
      <span className="delta__arrow" aria-hidden="true">
        {flecha}
      </span>
      {fmtDelta(value, decimales)}
      {unit}
      {sufijo && <span className="delta__suffix"> {sufijo}</span>}
    </span>
  );
}
