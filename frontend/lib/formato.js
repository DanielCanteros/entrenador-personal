// Formato de números y fechas para las evaluaciones (coma decimal, es-PY).

const LOCALE = "es-PY";
const formatters = new Map();

function formatter(decimales) {
  if (!formatters.has(decimales)) {
    formatters.set(
      decimales,
      new Intl.NumberFormat(LOCALE, { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
    );
  }
  return formatters.get(decimales);
}

/**
 * Redondeo "mitad hacia afuera", igual que Intl.NumberFormat: así un valor
 * redondeado y su texto formateado coinciden siempre (69,25 -> 69,3).
 */
export function redondear(value, decimales = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return value ?? null;
  const f = 10 ** decimales;
  return (Math.sign(value) * Math.round(Math.abs(value) * f + 1e-9)) / f;
}

export function fmt(value, decimales = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  return formatter(decimales).format(value);
}

/** Con signo explícito: +1,2 / −0,8 (signo menos tipográfico). */
export function fmtDelta(value, decimales = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  const rounded = Number(value.toFixed(decimales));
  if (rounded === 0) return fmt(0, decimales);
  return `${rounded > 0 ? "+" : "−"}${fmt(Math.abs(rounded), decimales)}`;
}

export function fmtFecha(date) {
  return new Date(date).toLocaleDateString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

export function fmtFechaCorta(date) {
  return new Date(date).toLocaleDateString(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
}

export function fmtMesAnio(date) {
  return new Date(date).toLocaleDateString(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });
}

export function toDateInputValue(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toISOString().slice(0, 10);
}
