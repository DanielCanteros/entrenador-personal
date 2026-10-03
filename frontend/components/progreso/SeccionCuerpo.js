"use client";

import { useMemo, useState } from "react";
import BodyScan from "./BodyScan.js";
import { CINTAS } from "./anatomia.js";
import Delta from "./Delta.js";
import { PERIMETROS_EXTREMIDADES, PERIMETROS_TRONCO, direccionPeso, ladoLabel } from "../../lib/composicion.js";
import { fmt } from "../../lib/formato.js";

// Dirección de progreso por zona: en el tronco se busca reducir, en brazos y
// piernas ganar músculo. El muslo depende de si el objetivo es bajar o subir de peso.
const MEJORA = {
  torax: 1,
  cintura: -1,
  abdomen: -1,
  cadera: -1,
  brazo: 1,
  antebrazo: 1,
  muslo: "objetivo",
  pantorrilla: 1,
};

// Dónde se toma cada perímetro (la misma referencia que dibuja la figura).
const SITIOS = Object.fromEntries(CINTAS.map((c) => [c.zona, c.sitio]));

function valoresZona(serie, key) {
  return serie.map((p) => p.perimetros?.[key] ?? null);
}

function ultimoNoNulo(valores, hasta = valores.length) {
  for (let i = hasta - 1; i >= 0; i -= 1) if (valores[i] !== null) return valores[i];
  return null;
}

export function calcularZonas(serie, evaluacion, modo) {
  const dirPeso = direccionPeso(serie, evaluacion?.objetivos);

  const defs = [
    ...PERIMETROS_TRONCO.map((p) => ({ key: p.key, label: p.label, grupo: p.key, lado: null })),
    ...PERIMETROS_EXTREMIDADES.flatMap((p) => [
      { key: `${p.key}_der`, label: p.label, grupo: p.key, lado: "der", femenino: p.femenino },
      { key: `${p.key}_izq`, label: p.label, grupo: p.key, lado: "izq", femenino: p.femenino },
    ]),
  ];

  const zonas = {};
  defs.forEach((def) => {
    const valores = valoresZona(serie, def.key);
    const actual = valores[valores.length - 1];
    if (actual === null || actual === undefined) return;
    const inicio = valores.find((v) => v !== null);
    const anterior = ultimoNoNulo(valores, valores.length - 1);
    const base = modo === "inicio" ? inicio : anterior;
    const delta = base === null || base === undefined ? null : actual - base;
    const dir = MEJORA[def.grupo] === "objetivo" ? dirPeso : MEJORA[def.grupo];
    zonas[def.key] = {
      ...def,
      actual,
      delta,
      dir,
      mejoro: delta !== null && dir !== 0 && delta * dir >= 0.05,
      historial: valores.filter((v) => v !== null),
    };
  });

  // Brillo proporcional a la mejora, relativo a la mejor zona.
  const mejoras = Object.values(zonas).filter((z) => z.mejoro);
  const max = Math.max(...mejoras.map((z) => Math.abs(z.delta)), 0.1);
  mejoras.forEach((z) => {
    z.intensidad = 0.35 + 0.65 * (Math.abs(z.delta) / max);
  });
  return zonas;
}

function Sparkline({ valores }) {
  if (valores.length < 2) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;
  const pts = valores.map((v, i) => [(i / (valores.length - 1)) * (w - 8) + 4, h - 4 - ((v - min) / span) * (h - 8)]);
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" />
    </svg>
  );
}

function largoDetalle(z) {
  return SITIOS[z.grupo].length + (z.lado ? 12 : 0) + z.label.length;
}

function DetalleZona({ z, comparable, modo }) {
  return (
    <>
      <p className="prog-zona-detalle__label">
        {z.label}
        {z.lado && <span> · {ladoLabel(z.lado, z.femenino)}</span>}
      </p>
      <div className="prog-zona-detalle__row">
        <strong>
          {fmt(z.actual, 1)} <small>cm</small>
        </strong>
        {comparable && (
          <Delta value={z.delta} dir={z.dir} unidad="cm" sufijo={modo === "inicio" ? "desde el inicio" : "vs. anterior"} />
        )}
        <Sparkline valores={z.historial} />
      </div>
      <p className="prog-zona-detalle__sitio">Se mide en: {SITIOS[z.grupo]}</p>
    </>
  );
}

export default function SeccionCuerpo({ serie, evaluacion }) {
  const [modo, setModo] = useState(serie.length > 1 ? "inicio" : "anterior");
  const [activa, setActiva] = useState(null);
  const zonas = useMemo(() => calcularZonas(serie, evaluacion, modo), [serie, evaluacion, modo]);

  const tronco = PERIMETROS_TRONCO.filter((p) => zonas[p.key]);
  const extremidades = PERIMETROS_EXTREMIDADES.filter((p) => zonas[`${p.key}_der`] || zonas[`${p.key}_izq`]);
  const hayMedidas = tronco.length || extremidades.length;
  const mejoradas = Object.values(zonas).filter((z) => z.mejoro).length;
  const detalle = activa ? zonas[activa] : null;
  // Zona con el texto más largo: define el alto fijo de la tarjeta de detalle.
  const referencia = Object.values(zonas).reduce(
    (max, z) => (!max || largoDetalle(z) > largoDetalle(max) ? z : max),
    null
  );
  const comparable = serie.length > 1;

  const fila = (key, colSpan = 1) => {
    const z = zonas[key];
    if (!z) return <td className="prog-zonas__empty">–</td>;
    return (
      <td colSpan={colSpan}>
        <span className="prog-zonas__valor">{fmt(z.actual, 1)}</span>
        {comparable && <Delta value={z.delta} dir={z.dir} unidad="cm" />}
      </td>
    );
  };

  const rowProps = (keys) => ({
    className: keys.includes(activa) ? "is-active" : "",
    onPointerEnter: () => setActiva(keys.find((k) => zonas[k]) || null),
    onPointerLeave: () => setActiva(null),
    onFocus: () => setActiva(keys.find((k) => zonas[k]) || null),
    onBlur: () => setActiva(null),
    tabIndex: 0,
  });

  return (
    <section className="prog-section" aria-labelledby="prog-cuerpo">
      <header className="prog-section__head">
        <div>
          <p className="eyebrow">Escaneo corporal</p>
          <h2 id="prog-cuerpo" className="prog-section__title">
            Tu cuerpo, zona por zona
          </h2>
        </div>
        {comparable && (
          <div className="prog-toggle" role="group" aria-label="Comparar medidas con">
            <button type="button" aria-pressed={modo === "inicio"} onClick={() => setModo("inicio")}>
              Desde el inicio
            </button>
            <button type="button" aria-pressed={modo === "anterior"} onClick={() => setModo("anterior")}>
              Vs. evaluación anterior
            </button>
          </div>
        )}
      </header>

      <div className="prog-cuerpo">
        <div className="prog-cuerpo__figure">
          <BodyScan
            zonas={zonas}
            activa={activa}
            onSelect={setActiva}
            label="Figura del cuerpo con una cinta en el punto donde se mide cada perímetro. Las medidas que mejoraron se iluminan en naranja."
          />
          <div className="prog-cuerpo__legend">
            <span className="prog-cuerpo__item">
              <span className="prog-cuerpo__swatch prog-cuerpo__swatch--cinta" /> Punto de medición
            </span>
            <span className="prog-cuerpo__item">
              <span className="prog-cuerpo__swatch is-up" /> Mejoró
            </span>
            <span className="prog-cuerpo__item">
              <span className="prog-cuerpo__swatch" /> Sin cambios o en proceso
            </span>
          </div>
        </div>

        <div className="prog-cuerpo__panel">
          {/* Dos capas en la misma celda: la invisible reserva el alto del
              detalle más largo, así la tarjeta no cambia de tamaño al pasar el
              mouse y la tabla de abajo no se mueve. */}
          <div className={`prog-zona-detalle${detalle ? " is-visible" : ""}`}>
            {referencia && (
              <div className="prog-zona-detalle__capa is-reserva" aria-hidden="true">
                <DetalleZona z={referencia} comparable={comparable} modo={modo} />
              </div>
            )}
            <div className="prog-zona-detalle__capa" aria-live="polite">
              {detalle ? (
                <DetalleZona z={detalle} comparable={comparable} modo={modo} />
              ) : (
                <p className="prog-zona-detalle__hint">
                  {comparable && mejoradas > 0 ? (
                    <>
                      <strong>{mejoradas}</strong> {mejoradas === 1 ? "zona mejoró" : "zonas mejoraron"}{" "}
                      {modo === "inicio" ? "desde tu primera evaluación" : "desde tu evaluación anterior"}. Pasá el
                      mouse o tocá una cinta para ver el detalle.
                    </>
                  ) : (
                    "Cada cinta marca dónde se mide un perímetro. Pasá el mouse o tocá una para ver su medida."
                  )}
                </p>
              )}
            </div>
          </div>

          {hayMedidas ? (
            <table className="prog-zonas">
              <caption className="visually-hidden">Perímetros en centímetros</caption>
              {tronco.length > 0 && (
                <tbody>
                  <tr className="prog-zonas__grupo">
                    <th scope="col" colSpan={3}>
                      Tronco (cm)
                    </th>
                  </tr>
                  {tronco.map((p) => (
                    <tr key={p.key} {...rowProps([p.key])}>
                      <th scope="row">{p.label}</th>
                      {fila(p.key, 2)}
                    </tr>
                  ))}
                </tbody>
              )}
              {extremidades.length > 0 && (
                <tbody>
                  <tr className="prog-zonas__grupo">
                    <th scope="col">Extremidades (cm)</th>
                    <th scope="col">Derecho</th>
                    <th scope="col">Izquierdo</th>
                  </tr>
                  {extremidades.map((p) => (
                    <tr key={p.key} {...rowProps([`${p.key}_der`, `${p.key}_izq`])}>
                      <th scope="row">{p.label}</th>
                      {fila(`${p.key}_der`)}
                      {fila(`${p.key}_izq`)}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          ) : (
            <p className="prog-empty">Tu entrenador todavía no cargó perímetros en tus evaluaciones.</p>
          )}
        </div>
      </div>
    </section>
  );
}
