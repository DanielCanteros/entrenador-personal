"use client";

import { useMemo, useState } from "react";
import TrendChart from "./TrendChart.js";
import AnimatedNumber from "./AnimatedNumber.js";
import Delta from "./Delta.js";
import {
  METRICAS,
  OBJETIVOS,
  describirMeta,
  direccionMejora,
  evaluarMeta,
  proyectar,
  valoresMetrica,
} from "../../lib/composicion.js";
import { fmt, fmtDelta, fmtFecha, fmtMesAnio } from "../../lib/formato.js";

export default function SeccionEvolucion({ serie, evaluacion }) {
  const disponibles = useMemo(
    () =>
      METRICAS.map((m) => ({ metrica: m, valores: valoresMetrica(serie, m) })).filter((x) => x.valores.length > 0),
    [serie]
  );
  const [metricaId, setMetricaId] = useState(disponibles[0]?.metrica.id);
  const [verTabla, setVerTabla] = useState(false);

  const actual = disponibles.find((x) => x.metrica.id === metricaId) || disponibles[0];
  if (!actual) return null;

  const { metrica, valores } = actual;
  const meta = metrica.objetivo ? evaluacion?.objetivos?.[metrica.objetivo] ?? null : null;
  const inicio = valores[0].valor;
  const ultimo = valores[valores.length - 1].valor;
  const objetivo = OBJETIVOS.find((o) => o.key === metrica.objetivo);
  const evalMeta =
    objetivo && meta !== null
      ? { ...objetivo, ...evaluarMeta({ inicio, actual: ultimo, meta, mejora: objetivo.mejora }), meta }
      : null;
  const alcanzar = evalMeta?.tipo === "alcanzar";
  // El peso no tiene una dirección "buena" propia: la marca la meta si es a alcanzar.
  const dir = metrica.mejora === "objetivo" ? (alcanzar ? evalMeta.dir : 0) : direccionMejora(metrica);
  const proy = proyectar(valores, alcanzar ? meta : null);
  const unidad = metrica.unidad;
  const u = unidad === "%" ? " %" : ` ${unidad}`;
  const textoMeta = evalMeta ? describirMeta(evalMeta) : null;
  const metaLabel = { max: "Máximo", min: "Mínimo" }[evalMeta?.limite] || "Meta";

  let proyeccionTexto = null;
  if (evalMeta && valores.length >= 2) {
    if (!alcanzar) proyeccionTexto = textoMeta.estado;
    else if (evalMeta.cumplida) proyeccionTexto = "¡Meta alcanzada! Ahora el desafío es sostenerla.";
    else if (proy?.fechaMeta) proyeccionTexto = `A este ritmo llegás a tu meta en ${fmtMesAnio(proy.fechaMeta)}.`;
    else if (proy && proy.pendientePorMes * dir <= 0)
      proyeccionTexto = "El ritmo reciente no te acerca a la meta: charlalo con tu entrenador para ajustar el plan.";
  }

  return (
    <section className="prog-section" aria-labelledby="prog-evolucion">
      <header className="prog-section__head">
        <div>
          <p className="eyebrow">Evolución</p>
          <h2 id="prog-evolucion" className="prog-section__title">
            Tu progreso en el tiempo
          </h2>
        </div>
        <div className="prog-tabs" role="tablist" aria-label="Métrica">
          {disponibles.map(({ metrica: m }) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.id === metrica.id}
              className="prog-tabs__tab"
              onClick={() => setMetricaId(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="prog-evo card">
        <div className="prog-evo__chart">
          {valores.length === 1 && (
            <p className="prog-evo__single">
              Este es tu punto de partida. Tu curva aparece desde la próxima evaluación.
            </p>
          )}
          {verTabla ? (
            <div className="prog-evo__table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Evaluación</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">{metrica.label}</th>
                    <th scope="col">Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {valores.map((v, i) => (
                    <tr key={v.fecha.getTime()}>
                      <td>N° {v.punto.numero}</td>
                      <td>{fmtFecha(v.fecha)}</td>
                      <td>
                        {fmt(v.valor, metrica.decimales)}
                        {u}
                      </td>
                      <td>{i === 0 ? "–" : `${fmtDelta(v.valor - valores[i - 1].valor, metrica.decimales)}${u}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <TrendChart
              key={metrica.id}
              valores={valores}
              meta={meta}
              metaLabel={metaLabel}
              metrica={metrica}
              fechaProyectada={alcanzar && !evalMeta.cumplida ? proy?.fechaMeta : null}
            />
          )}
          <button type="button" className="prog-link" onClick={() => setVerTabla((v) => !v)}>
            {verTabla ? "Ver gráfico" : "Ver como tabla"}
          </button>
        </div>

        <dl className="prog-evo__stats">
          <div>
            <dt>Actual</dt>
            <dd className="prog-evo__big">
              <AnimatedNumber value={ultimo} decimales={metrica.decimales} />
              <small>{u}</small>
            </dd>
          </div>
          <div>
            <dt>Cambio total</dt>
            <dd>
              {valores.length > 1 ? (
                <Delta value={ultimo - inicio} dir={dir} decimales={metrica.decimales} unidad={unidad} />
              ) : (
                "–"
              )}
            </dd>
          </div>
          <div>
            <dt>Ritmo mensual</dt>
            <dd>
              {proy ? (
                <Delta value={proy.pendientePorMes} dir={dir} decimales={metrica.decimales} unidad={unidad} sufijo="/ mes" />
              ) : (
                "–"
              )}
            </dd>
          </div>
          <div>
            <dt>Punto de partida</dt>
            <dd>
              {fmt(inicio, metrica.decimales)}
              {u}
              <span className="prog-evo__muted"> · {fmtFecha(valores[0].fecha)}</span>
            </dd>
          </div>
          {textoMeta && (
            <div>
              <dt>Tu meta</dt>
              <dd>
                {textoMeta.titulo}
                {alcanzar && !evalMeta.cumplida && (
                  <span className="prog-evo__muted">
                    {" "}
                    · faltan {fmt(evalMeta.restante, metrica.decimales)}
                    {u}
                  </span>
                )}
              </dd>
            </div>
          )}
          {proyeccionTexto && <p className="prog-evo__proy">{proyeccionTexto}</p>}
        </dl>
      </div>
    </section>
  );
}
