import { OBJETIVOS, describirMeta, evaluarObjetivo } from "../../lib/composicion.js";
import { fmt, fmtFecha } from "../../lib/formato.js";

export default function SeccionObjetivos({ serie, objetivos }) {
  const items = OBJETIVOS.map((o) => evaluarObjetivo(serie, o, objetivos?.[o.key])).filter(Boolean);

  if (!items.length) return null;

  const limite = objetivos?.fecha_limite ? new Date(objetivos.fecha_limite) : null;
  const diasRestantes = limite ? Math.ceil((limite - Date.now()) / 86400000) : null;

  return (
    <section className="prog-section" aria-labelledby="prog-objetivos">
      <header className="prog-section__head">
        <div>
          <p className="eyebrow">Tus metas</p>
          <h2 id="prog-objetivos" className="prog-section__title">
            Camino al objetivo
          </h2>
          {objetivos?.descripcion && <p className="prog-objetivos__why">“{objetivos.descripcion}”</p>}
        </div>
        {limite && (
          <p className="prog-objetivos__limite">
            <span>Fecha objetivo</span>
            <strong>{fmtFecha(limite)}</strong>
            {diasRestantes > 0 && <em>Faltan {diasRestantes} días</em>}
          </p>
        )}
      </header>

      <ul className="prog-objetivos">
        {items.map((o) => {
          const u = o.unidad === "%" ? " %" : ` ${o.unidad}`;
          const texto = describirMeta(o);
          const alcanzar = o.tipo === "alcanzar";
          const estado = o.cumplida ? " is-done" : alcanzar ? "" : " is-off";
          return (
            <li key={o.key} className={`prog-objetivo card${estado}`}>
              <div className="prog-objetivo__top">
                <div>
                  <p className="prog-objetivo__label">{o.label}</p>
                  <p className="prog-objetivo__titulo">{texto.titulo}</p>
                </div>
                {alcanzar ? (
                  <p className="prog-objetivo__pct">{Math.round(o.progreso * 100)} %</p>
                ) : (
                  <span className={`prog-chip prog-chip--${o.cumplida ? "good" : "warn"}`}>
                    <span aria-hidden="true">{o.cumplida ? "✓" : "!"}</span> {o.cumplida ? "En meta" : "Fuera"}
                  </span>
                )}
              </div>
              {alcanzar && (
                <div
                  className="prog-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(o.progreso * 100)}
                  aria-label={`Progreso de ${o.label}`}
                >
                  <span style={{ "--p": o.progreso }} />
                </div>
              )}
              <div className="prog-objetivo__scale">
                <span>
                  Inicio <strong>{fmt(o.inicio, 1)}{u}</strong>
                </span>
                <span>
                  Hoy <strong>{fmt(o.actual, 1)}{u}</strong>
                </span>
                <span>
                  {o.limite === "max" ? "Máximo" : o.limite === "min" ? "Mínimo" : "Meta"}{" "}
                  <strong>{fmt(o.meta, 1)}{u}</strong>
                </span>
              </div>
              <p className="prog-objetivo__msg">{texto.estado}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
