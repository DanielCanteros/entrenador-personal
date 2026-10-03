"use client";

import { useMemo } from "react";
import AnimatedNumber from "./AnimatedNumber.js";
import Delta from "./Delta.js";
import Ring from "./Ring.js";
import SeccionComparar from "./SeccionComparar.js";
import SeccionCuerpo from "./SeccionCuerpo.js";
import SeccionEvolucion from "./SeccionEvolucion.js";
import SeccionObjetivos from "./SeccionObjetivos.js";
import SeccionSalud from "./SeccionSalud.js";
import { construirSerie, describirMeta, direccionPeso, metaPrincipal, rangosGrasa } from "../../lib/composicion.js";
import { fmt, fmtFecha } from "../../lib/formato.js";

const DIA = 86400000;

// Une frases como "a, b y c" (cada parte es un nodo de React).
function unirFrases(partes) {
  return partes.map((parte, i) => (
    <span key={i}>
      {i === 0 ? "" : i === partes.length - 1 ? " y " : ", "}
      {parte}
    </span>
  ));
}

/**
 * Cambio de una medida entre la primera evaluación que la tiene y la última
 * (si la última no la tiene, no hay cambio "actual" que mostrar).
 */
function cambio(serie, get) {
  const ultimo = get(serie[serie.length - 1]);
  const primero = serie.map(get).find((v) => v !== null && v !== undefined);
  if (ultimo === null || ultimo === undefined || primero === undefined || serie.filter((p) => get(p) != null).length < 2) {
    return null;
  }
  return ultimo - primero;
}

function resumen(serie) {
  if (serie.length < 2) {
    return "Esta es tu línea de partida. Desde tu próxima evaluación vas a ver acá cómo cambia tu cuerpo mes a mes.";
  }
  const partes = [];
  const dGrasa = cambio(serie, (p) => p.c.masaGrasa);
  const dMagra = cambio(serie, (p) => p.c.masaMagra);
  const dCintura = cambio(serie, (p) => p.perimetros?.cintura);
  if (dGrasa !== null && dGrasa <= -0.2) {
    partes.push(<>bajaste <b>{fmt(-dGrasa, 1)} kg de grasa</b></>);
  }
  if (dMagra !== null && dMagra >= 0.2) {
    partes.push(<>ganaste <b>{fmt(dMagra, 1)} kg de masa magra</b></>);
  }
  if (dCintura !== null && dCintura <= -0.5) {
    partes.push(<>redujiste <b>{fmt(-dCintura, 1)} cm de cintura</b></>);
  }

  if (!partes.length) {
    return "Cada evaluación suma. Los cambios se construyen mes a mes: seguí el plan y los números van a acompañar.";
  }
  return <>Desde tu primera evaluación {unirFrases(partes)}.</>;
}

function FatGauge({ c, sexo, meta }) {
  const rangos = rangosGrasa(sexo);
  if (!rangos || c.porcentajeGrasa === null) return null;
  const tope = sexo === "M" ? 35 : 45;
  const pos = (v) => `${(Math.min(tope, Math.max(0, v)) / tope) * 100}%`;
  let desde = 0;

  return (
    <div className="gauge">
      <div className="gauge__head">
        <p className="prog-kicker">% de grasa corporal</p>
        <span className="prog-chip prog-chip--accent">{c.clasificacionGrasa?.label}</span>
      </div>
      <p className="gauge__value">
        <AnimatedNumber value={c.porcentajeGrasa} decimales={1} />
        <small>%</small>
      </p>
      <div className="gauge__track">
        {rangos.map((r, i) => {
          const hasta = Math.min(r.max, tope);
          const seg = (
            <span
              key={r.id}
              className={`gauge__seg${i === c.clasificacionGrasa?.index ? " is-current" : ""}`}
              style={{ left: pos(desde), width: `calc(${pos(hasta)} - ${pos(desde)} - 2px)` }}
            >
              <em>{r.label}</em>
            </span>
          );
          desde = hasta;
          return seg;
        })}
        {meta !== null && meta !== undefined && (
          <span className="gauge__goal" style={{ left: pos(meta) }}>
            <em>Meta {fmt(meta, 0)} %</em>
          </span>
        )}
        <span className="gauge__marker" style={{ "--x": pos(c.porcentajeGrasa) }} aria-hidden="true" />
      </div>
    </div>
  );
}

function Composicion({ serie, evaluacion }) {
  const a = serie[0];
  const b = serie[serie.length - 1];
  const c = b.c;
  const comparable = serie.length > 1;
  const dirPeso = direccionPeso(serie, evaluacion?.objetivos);
  const hayComp = c.masaMagra !== null;
  // Porcentajes enteros que siempre suman 100 (83 + 17, nunca 83 + 18).
  const pctMagra = hayComp ? Math.round((c.masaMagra / c.peso) * 100) : 0;
  const dMagra = cambio(serie, (p) => p.c.masaMagra);
  const dGrasa = cambio(serie, (p) => p.c.masaGrasa);

  return (
    <section className="prog-section" aria-labelledby="prog-composicion">
      <header className="prog-section__head">
        <div>
          <p className="eyebrow">Composición corporal</p>
          <h2 id="prog-composicion" className="prog-section__title">
            De qué está hecho tu peso
          </h2>
        </div>
      </header>

      <div className="prog-comp">
        <div className="prog-comp__peso card">
          <p className="prog-kicker">Peso actual</p>
          <p className="prog-comp__big">
            <AnimatedNumber value={c.peso} decimales={1} />
            <small>kg</small>
          </p>
          {comparable && <Delta value={c.peso - a.c.peso} dir={dirPeso} unidad="kg" sufijo="desde el inicio" />}

          {hayComp ? (
            <>
              <div className="prog-stack" aria-hidden="true">
                <span className="prog-stack__magra" style={{ "--w": `${pctMagra}%` }} />
                <span className="prog-stack__grasa" style={{ "--w": `${100 - pctMagra}%` }} />
              </div>
              <ul className="prog-legend">
                <li>
                  <span className="prog-legend__dot prog-legend__dot--magra" />
                  <span className="prog-legend__label">Masa magra</span>
                  <strong>{fmt(c.masaMagra, 1)} kg</strong>
                  <span className="prog-legend__pct">{fmt(pctMagra, 0)} %</span>
                </li>
                <li>
                  <span className="prog-legend__dot prog-legend__dot--grasa" />
                  <span className="prog-legend__label">Masa grasa</span>
                  <strong>{fmt(c.masaGrasa, 1)} kg</strong>
                  <span className="prog-legend__pct">{fmt(100 - pctMagra, 0)} %</span>
                </li>
              </ul>
            </>
          ) : (
            <p className="prog-empty">
              Cuando tu entrenador cargue tus pliegues cutáneos vas a ver cuánto de tu peso es músculo y cuánto es grasa.
            </p>
          )}
        </div>

        {hayComp && (
          <div className="prog-comp__side">
            <div className="card">
              <FatGauge c={c} sexo={evaluacion.sexo} meta={evaluacion?.objetivos?.porcentaje_grasa} />
            </div>
            <div className="prog-tiles">
              <div className="prog-tile card">
                <p className="prog-kicker">Masa magra</p>
                <p className="prog-tile__value">
                  <AnimatedNumber value={c.masaMagra} decimales={1} /> <small>kg</small>
                </p>
                {dMagra !== null && <Delta value={dMagra} dir={1} unidad="kg" />}
              </div>
              <div className="prog-tile card">
                <p className="prog-kicker">Masa grasa</p>
                <p className="prog-tile__value">
                  <AnimatedNumber value={c.masaGrasa} decimales={1} /> <small>kg</small>
                </p>
                {dGrasa !== null && <Delta value={dGrasa} dir={-1} unidad="kg" />}
              </div>
              {c.pesoIdeal !== null && (
                <div className="prog-tile card">
                  <p className="prog-kicker">Peso ideal</p>
                  <p className="prog-tile__value">
                    <AnimatedNumber value={c.pesoIdeal} decimales={1} /> <small>kg</small>
                  </p>
                  <p className="prog-tile__note">Con {fmt(c.grasaIdeal, 0)} % de grasa y tu masa magra actual</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Hero({ nombre, serie, evaluacion, meta }) {
  const ultima = serie[serie.length - 1];
  const frecuencia = evaluacion.frecuencia_dias || 30;
  const proxima = new Date(ultima.fecha.getTime() + frecuencia * DIA);
  const diasProxima = Math.ceil((proxima - Date.now()) / DIA);
  const transcurrido = 1 - Math.max(0, diasProxima) / frecuencia;
  const textoMeta = meta ? describirMeta(meta) : null;
  const nota = [...serie].reverse().find((p) => p.nota)?.nota;

  return (
    <section className="prog-hero">
      <div className="prog-hero__intro">
        <p className="eyebrow">
          Evaluación N° {ultima.numero} · {fmtFecha(ultima.fecha)}
        </p>
        <h1 className="prog-hero__title">
          Hola, <span className="display-italic">{nombre}</span>
        </h1>
        <p className="prog-hero__summary">{resumen(serie)}</p>
        {nota && (
          <figure className="prog-nota">
            <blockquote>{nota}</blockquote>
            <figcaption>Tu entrenador</figcaption>
          </figure>
        )}
      </div>

      <ul className="prog-hero__rings">
        {meta && (
          <li>
            <Ring value={meta.progreso} label={`Meta de ${meta.nombre}`} tone={meta.cumplida ? "done" : "accent"}>
              {meta.tipo === "alcanzar" ? (
                <strong>{Math.round(meta.progreso * 100)}%</strong>
              ) : (
                <>
                  <strong>{meta.cumplida ? "OK" : "!"}</strong>
                  <small>{meta.cumplida ? "en meta" : "fuera"}</small>
                </>
              )}
            </Ring>
            <p className="prog-hero__ring-label">Meta de {meta.nombre}</p>
            <p className="prog-hero__ring-sub">{textoMeta.corto}</p>
          </li>
        )}
        <li>
          <Ring value={transcurrido} label="Tiempo hasta la próxima evaluación" tone="soft">
            <strong>{Math.max(0, diasProxima)}</strong>
            <small>{diasProxima === 1 ? "día" : "días"}</small>
          </Ring>
          <p className="prog-hero__ring-label">Próxima evaluación</p>
          <p className="prog-hero__ring-sub">{diasProxima > 0 ? fmtFecha(proxima) : "¡Ya te toca! Coordiná con tu entrenador"}</p>
        </li>
      </ul>
    </section>
  );
}

export default function ProgresoView({ cliente, evaluacion }) {
  const serie = useMemo(() => construirSerie(evaluacion), [evaluacion]);
  const meta = useMemo(() => metaPrincipal(serie, evaluacion?.objetivos), [serie, evaluacion]);

  if (!serie.length) {
    return (
      <div className="prog-empty-state card">
        <p className="eyebrow">Mi progreso</p>
        <h1 className="prog-hero__title">
          Hola, <span className="display-italic">{cliente?.nombre}</span>
        </h1>
        <p className="prog-hero__summary">
          Todavía no tenés evaluaciones cargadas. En tu primera evaluación tu entrenador va a medir tu peso, pliegues y
          perímetros: desde ese día vas a ver acá tu composición corporal y tu evolución.
        </p>
      </div>
    );
  }

  const ultima = serie[serie.length - 1];

  return (
    <div className="prog">
      <Hero nombre={cliente?.nombre} serie={serie} evaluacion={evaluacion} meta={meta} />
      <Composicion serie={serie} evaluacion={evaluacion} />
      <SeccionCuerpo serie={serie} evaluacion={evaluacion} />
      <SeccionEvolucion serie={serie} evaluacion={evaluacion} />
      <SeccionObjetivos serie={serie} objetivos={evaluacion.objetivos} />
      <SeccionSalud c={ultima.c} sexo={evaluacion.sexo} />
      <SeccionComparar serie={serie} objetivos={evaluacion.objetivos} />
    </div>
  );
}
