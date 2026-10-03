"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fmt, fmtDelta, fmtFecha, fmtFechaCorta } from "../../lib/formato.js";

const M = { top: 28, right: 20, bottom: 34, left: 48 };
const DIA = 86400000;

// Curva monótona (Fritsch–Carlson): suave pero sin "pasarse" de los datos,
// así la línea nunca sugiere un valor que no se midió.
function monotonePath(pts) {
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const n = pts.length;
  const dx = [];
  const m = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1));
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i += 1) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i += 1) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const k = 3 / Math.sqrt(s);
        t[i] = k * a * m[i];
        t[i + 1] = k * b * m[i];
      }
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  // Sin pasos de 2,5: así cada marca se escribe exacta con un decimal (68,25 se
  // mostraría como "68,3", un valor que no está en el eje).
  const step = [1, 2, 5, 10].map((s) => s * pow).find((s) => s >= raw) || raw;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export default function TrendChart({ valores, meta = null, metaLabel = "Meta", metrica, fechaProyectada = null, height = 300 }) {
  const wrapRef = useRef(null);
  const uid = useId().replace(/:/g, "");
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const innerW = width - M.left - M.right;
    if (innerW < 60 || !valores.length) return null;
    const innerH = height - M.top - M.bottom;

    const first = valores[0].fecha.getTime();
    const last = valores[valores.length - 1].fecha.getTime();
    let x0 = first;
    let x1 = last;
    if (x0 === x1) {
      x0 -= 15 * DIA;
      x1 += 15 * DIA;
    }
    // La proyección solo se dibuja si cae dentro de los próximos 6 meses.
    const proy = fechaProyectada && fechaProyectada.getTime() - last < 183 * DIA ? fechaProyectada.getTime() : null;
    if (proy) x1 = Math.max(x1, proy);
    const xPad = (x1 - x0) * 0.04;
    x0 -= valores.length > 1 ? xPad : 0;
    x1 += xPad;

    const ys = valores.map((v) => v.valor);
    if (meta !== null) ys.push(meta);
    let y0 = Math.min(...ys);
    let y1 = Math.max(...ys);
    const minSpan = metrica.unidad === "mm" ? 10 : 2;
    if (y1 - y0 < minSpan) {
      const mid = (y0 + y1) / 2;
      y0 = mid - minSpan / 2;
      y1 = mid + minSpan / 2;
    }
    const yPad = (y1 - y0) * 0.18;
    y0 -= yPad;
    y1 += yPad;

    const sx = (t) => M.left + ((t - x0) / (x1 - x0)) * innerW;
    const sy = (v) => M.top + (1 - (v - y0) / (y1 - y0)) * innerH;
    const pts = valores.map((v) => [sx(v.fecha.getTime()), sy(v.valor)]);
    const line = monotonePath(pts);
    const base = M.top + innerH;
    const area = `${line} L${pts[pts.length - 1][0]},${base} L${pts[0][0]},${base} Z`;

    const yTicks = niceTicks(y0 + yPad * 0.5, y1 - yPad * 0.5);
    const maxXTicks = Math.max(2, Math.floor(innerW / 90));
    const stride = Math.ceil(valores.length / maxXTicks);
    const xTicks = valores.filter((_, i) => (valores.length - 1 - i) % stride === 0);

    return {
      innerW,
      innerH,
      pts,
      line,
      area,
      base,
      sx,
      sy,
      yTicks,
      xTicks,
      proy: proy && meta !== null ? [sx(proy), sy(meta)] : null,
    };
  }, [width, height, valores, meta, metrica.unidad, fechaProyectada]);

  function handlePointer(e) {
    if (!geo) return;
    const x = e.clientX - e.currentTarget.ownerSVGElement.getBoundingClientRect().left;
    let best = 0;
    geo.pts.forEach((p, i) => {
      if (Math.abs(p[0] - x) < Math.abs(geo.pts[best][0] - x)) best = i;
    });
    setActive(best);
  }

  function handleKey(e) {
    if (!valores.length) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      setActive((prev) => Math.min(valores.length - 1, Math.max(0, (prev ?? valores.length - 1) + dir)));
    }
    if (e.key === "Escape") setActive(null);
  }

  const lastIndex = valores.length - 1;
  const shownIndex = active ?? lastIndex;
  const tooltip = geo && active !== null ? { p: geo.pts[active], v: valores[active], prev: valores[active - 1] } : null;
  const unidad = metrica.unidad === "%" ? " %" : ` ${metrica.unidad}`;

  return (
    <div
      ref={wrapRef}
      className="trend"
      style={{ height }}
      tabIndex={0}
      role="group"
      aria-label={`Gráfico de ${metrica.label}. Usá las flechas para recorrer las evaluaciones.`}
      onKeyDown={handleKey}
      onBlur={() => setActive(null)}
    >
      {geo && (
        <svg width={width} height={height} className="trend__svg" aria-hidden="true">
          <defs>
            <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7100" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#ff7100" stopOpacity="0" />
            </linearGradient>
          </defs>

          {geo.yTicks.map((t) => (
            <g key={t} className="trend__grid">
              <line x1={M.left} x2={width - M.right} y1={geo.sy(t)} y2={geo.sy(t)} />
              <text x={M.left - 10} y={geo.sy(t)} dy="0.32em" textAnchor="end">
                {fmt(t, Number.isInteger(t) ? 0 : 1)}
              </text>
            </g>
          ))}

          {geo.xTicks.map((v) => (
            <text
              key={v.fecha.getTime()}
              className="trend__xlabel"
              x={geo.sx(v.fecha.getTime())}
              y={height - 10}
              textAnchor="middle"
            >
              {fmtFechaCorta(v.fecha)}
            </text>
          ))}

          {meta !== null && (
            <g className="trend__goal">
              <line x1={M.left} x2={width - M.right} y1={geo.sy(meta)} y2={geo.sy(meta)} />
              <text x={width - M.right} y={geo.sy(meta) - 8} textAnchor="end">
                {metaLabel} · {fmt(meta, metrica.decimales)}
                {unidad}
              </text>
            </g>
          )}

          <path key={`a-${metrica.id}`} className="trend__area" d={geo.area} fill={`url(#area-${uid})`} />
          <path key={`l-${metrica.id}`} className="trend__line" d={geo.line} pathLength="1" />

          {geo.proy && (
            <g className="trend__proy">
              <line x1={geo.pts[lastIndex][0]} y1={geo.pts[lastIndex][1]} x2={geo.proy[0]} y2={geo.proy[1]} />
              <circle cx={geo.proy[0]} cy={geo.proy[1]} r="5" />
            </g>
          )}

          {tooltip && (
            <line className="trend__cursor" x1={tooltip.p[0]} x2={tooltip.p[0]} y1={M.top} y2={geo.base} />
          )}

          {geo.pts.map((p, i) => (
            <circle
              key={`${metrica.id}-${valores[i].fecha.getTime()}`}
              className={`trend__dot${i === shownIndex ? " is-active" : ""}${i === lastIndex ? " is-last" : ""}`}
              cx={p[0]}
              cy={p[1]}
              r={i === shownIndex ? 6 : 4}
              style={{ "--d": `${300 + (i / Math.max(1, lastIndex)) * 900}ms` }}
            />
          ))}

          <rect
            x={M.left}
            y={0}
            width={geo.innerW}
            height={height}
            fill="transparent"
            onPointerMove={handlePointer}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
      )}

      {tooltip && (
        <div
          className={`trend__tip${tooltip.p[0] > width * 0.62 ? " is-left" : ""}`}
          style={{ left: tooltip.p[0], top: tooltip.p[1] }}
        >
          <span className="trend__tip-date">
            Evaluación N° {tooltip.v.punto.numero} · {fmtFecha(tooltip.v.fecha)}
          </span>
          <strong>
            {fmt(tooltip.v.valor, metrica.decimales)}
            {unidad}
          </strong>
          {tooltip.prev && (
            <span className="trend__tip-delta">
              {fmtDelta(tooltip.v.valor - tooltip.prev.valor, metrica.decimales)}
              {unidad} vs. anterior
            </span>
          )}
        </div>
      )}
    </div>
  );
}
