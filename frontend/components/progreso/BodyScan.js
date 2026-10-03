"use client";

import { useId } from "react";
import { CENTRO, CINTAS, CONECTIVO, CONECTIVO_CENTRO, MUSCULOS } from "./anatomia.js";

/**
 * Figura anatómica (vista frontal) con una cinta métrica en el punto exacto
 * donde se toma cada perímetro (ver CINTAS en anatomia.js). Los músculos que
 * quedan bajo la cinta se iluminan en naranja si esa medida mejoró, con una
 * intensidad proporcional al cambio.
 *
 * La geometría es de la mitad izquierda del dibujo (lado DERECHO del cliente,
 * porque la figura lo mira de frente) y se espeja para el lado izquierdo.
 */

const ESPEJO = "matrix(-1 0 0 1 240 0)";
// Músculos que cruza cada cinta: las del tronco pasan por el tronco (y la de
// la cadera, por el nacimiento de los muslos); las demás, por su segmento.
const SEGMENTOS_TRONCO = new Set(["tronco", "muslo"]);

const NOMBRES = {
  torax: "Tórax",
  cintura: "Cintura",
  abdomen: "Abdomen",
  cadera: "Cadera",
  brazo: "Brazo",
  antebrazo: "Antebrazo",
  muslo: "Muslo",
  pantorrilla: "Pantorrilla",
};

function Musculos({ segmentos }) {
  const partes = segmentos ? MUSCULOS.filter((m) => segmentos.has(m.segmento)) : MUSCULOS;
  return partes.map((m) => <path key={m.id} d={m.d} />);
}

/** Músculos de las dos mitades, o de una sola si se indica el `lado`. */
function Cuerpo({ segmentos, lado }) {
  return (
    <>
      {lado !== "izq" && <Musculos segmentos={segmentos} />}
      {lado !== "der" && (
        <g transform={ESPEJO}>
          <Musculos segmentos={segmentos} />
        </g>
      )}
    </>
  );
}

/** Contorno completo: músculos + tejido conectivo (rótula, tibia, codo...). */
function Silueta() {
  const conectivo = CONECTIVO.map((c) => <path key={c.id} d={c.d} />);
  return (
    <>
      <Cuerpo />
      {conectivo}
      <g transform={ESPEJO}>{conectivo}</g>
      {CENTRO.map((c) => (
        <path key={c.id} d={c.d} />
      ))}
      {CONECTIVO_CENTRO.map((c) => (
        <path key={c.id} d={c.d} />
      ))}
    </>
  );
}

// Una entrada por perímetro: las cintas de brazos y piernas se duplican para
// el lado derecho (tal cual) y el izquierdo (espejadas).
const MEDIDAS = CINTAS.flatMap((cinta) =>
  cinta.tronco
    ? [{ ...cinta, key: cinta.zona, segmentos: SEGMENTOS_TRONCO }]
    : ["der", "izq"].map((lado) => ({
        ...cinta,
        key: `${cinta.zona}_${lado}`,
        lado,
        transform: lado === "izq" ? ESPEJO : undefined,
        segmentos: new Set([cinta.zona]),
      }))
);

export default function BodyScan({ zonas = {}, activa = null, onSelect = () => {}, label }) {
  const uid = useId().replace(/:/g, "");
  const maskId = `scan-mask-${uid}`;
  const glowId = `scan-glow-${uid}`;
  const beamId = `scan-beam-${uid}`;
  const sheenId = `scan-sheen-${uid}`;

  // Solo se dibujan las cintas de los perímetros que tienen medida.
  const medidas = MEDIDAS.filter((m) => zonas[m.key]);

  return (
    <div className="scan" onPointerLeave={() => onSelect(null)}>
      <svg viewBox="-10 4 260 506" className="scan__svg" role="img" aria-label={label}>
        <defs>
          <radialGradient id={glowId} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ff7100" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#ff7100" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#ff7100" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={beamId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb583" stopOpacity="0" />
            <stop offset="85%" stopColor="#ffb583" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f2f2f2" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>
          {/* El haz de escaneo y el brillo solo se ven sobre el cuerpo. */}
          <mask id={maskId}>
            <g className="scan__mask">
              <Silueta />
            </g>
          </mask>
          {medidas.map((m) => (
            <clipPath key={m.key} id={`${uid}-${m.key}`}>
              <path d={m.franja} transform={m.transform} />
            </clipPath>
          ))}
        </defs>

        <ellipse cx="120" cy="250" rx="125" ry="250" fill={`url(#${glowId})`} />
        <ellipse className="scan__floor" cx="120" cy="503" rx="44" ry="4.5" />

        <g className="scan__silueta">
          <Silueta />
        </g>
        <g className="scan__musculos">
          <Cuerpo />
          {CENTRO.map((c) => (
            <path key={c.id} d={c.d} />
          ))}
        </g>

        {/* Músculos bajo cada cinta: se iluminan si la medida mejoró. */}
        {medidas.map((m) => {
          const info = zonas[m.key];
          const activo = activa === m.key;
          if (!info.mejoro && !activo) return null;
          return (
            <g
              key={m.key}
              clipPath={`url(#${uid}-${m.key})`}
              className={`scan__glow${activo ? " is-active" : ""}${activa && !activo ? " is-dim" : ""}`}
              style={{ "--i": (info.intensidad ?? 0).toFixed(3) }}
            >
              <Cuerpo segmentos={m.segmentos} lado={m.lado} />
            </g>
          );
        })}

        <g mask={`url(#${maskId})`} className="scan__overlay" aria-hidden="true">
          <rect x="-10" y="4" width="260" height="506" fill={`url(#${sheenId})`} />
          <rect className="scan__beam" x="-10" y="-56" width="260" height="60" fill={`url(#${beamId})`} />
        </g>

        {medidas.map((m) => {
          const info = zonas[m.key];
          const activo = activa === m.key;
          return (
            <g key={m.key} transform={m.transform}>
              <path
                d={m.linea}
                className={`scan__cinta${info.mejoro ? " is-up" : ""}${activo ? " is-active" : ""}`}
              />
              {m.marcas && (
                <path
                  d={m.marcas}
                  className={`scan__marca${info.mejoro ? " is-up" : ""}${activo ? " is-active" : ""}`}
                />
              )}
              <path
                d={m.area}
                className="scan__hit"
                onPointerEnter={() => onSelect(m.key)}
                onClick={() => onSelect(m.key)}
              >
                <title>{`${NOMBRES[m.zona]}: ${m.sitio}`}</title>
              </path>
            </g>
          );
        })}

        <text className="scan__side" x="12" y="496">
          D
        </text>
        <text className="scan__side" x="228" y="496" textAnchor="end">
          I
        </text>
      </svg>
    </div>
  );
}
