/**
 * Cálculos de composición corporal a partir de las medidas crudas de una
 * evaluación. Es la única fuente de estos números: la usan el panel del
 * entrenador (resultados en vivo mientras carga) y el panel del cliente.
 *
 * Protocolo: Jackson & Pollock 7 pliegues -> densidad corporal -> % de grasa
 * con la ecuación de Siri. Peso residual según Würch. Son los mismos cálculos
 * que hace el software de evaluación que usa el entrenador.
 */

import { fmt, redondear } from "./formato.js";

export const PLIEGUES = [
  { key: "subescapular", label: "Subescapular" },
  { key: "tricipital", label: "Tricipital" },
  { key: "pectoral", label: "Pectoral" },
  { key: "axilar_media", label: "Axilar media" },
  { key: "suprailiaca", label: "Suprailíaca" },
  { key: "abdominal", label: "Abdominal" },
  { key: "muslo", label: "Muslo" },
];

export const PERIMETROS_TRONCO = [
  { key: "torax", label: "Tórax" },
  { key: "cintura", label: "Cintura" },
  { key: "abdomen", label: "Abdomen" },
  { key: "cadera", label: "Cadera" },
];

// Perímetros bilaterales: cada uno tiene su versión _der y _izq.
export const PERIMETROS_EXTREMIDADES = [
  { key: "brazo", label: "Brazo" },
  { key: "antebrazo", label: "Antebrazo" },
  { key: "muslo", label: "Muslo" },
  { key: "pantorrilla", label: "Pantorrilla", femenino: true },
];

export function ladoLabel(lado, femenino = false) {
  if (lado === "der") return femenino ? "derecha" : "derecho";
  return femenino ? "izquierda" : "izquierdo";
}

export const PERIMETROS = [
  ...PERIMETROS_TRONCO,
  ...PERIMETROS_EXTREMIDADES.flatMap(({ key, label, femenino }) => [
    { key: `${key}_der`, label: `${label} ${ladoLabel("der", femenino)}`, grupo: key },
    { key: `${key}_izq`, label: `${label} ${ladoLabel("izq", femenino)}`, grupo: key },
  ]),
];

// Rangos de % de grasa (American Council on Exercise).
const RANGOS_GRASA = {
  M: [
    { max: 6, id: "esencial", label: "Esencial" },
    { max: 14, id: "atleta", label: "Atlético" },
    { max: 18, id: "fitness", label: "Fitness" },
    { max: 25, id: "promedio", label: "Promedio" },
    { max: Infinity, id: "elevado", label: "Elevado" },
  ],
  F: [
    { max: 14, id: "esencial", label: "Esencial" },
    { max: 21, id: "atleta", label: "Atlético" },
    { max: 25, id: "fitness", label: "Fitness" },
    { max: 32, id: "promedio", label: "Promedio" },
    { max: Infinity, id: "elevado", label: "Elevado" },
  ],
};

// Proporción del peso que es "peso residual" (órganos, fluidos) según Würch.
const RESIDUAL = { M: 0.241, F: 0.209 };

// % de grasa ideal por defecto cuando el entrenador no fijó uno.
export const GRASA_IDEAL_DEFECTO = { M: 15, F: 23 };

function num(value) {
  return value === null || value === undefined || value === "" || !Number.isFinite(Number(value))
    ? null
    : Number(value);
}

export function rangosGrasa(sexo) {
  return RANGOS_GRASA[sexo] || null;
}

export function clasificarGrasa(porcentaje, sexo) {
  const rangos = RANGOS_GRASA[sexo];
  if (!rangos || porcentaje === null) return null;
  const index = rangos.findIndex((r) => porcentaje < r.max);
  return { ...rangos[index], index };
}

export function clasificarImc(imc) {
  if (imc === null) return null;
  if (imc < 18.5) return { id: "bajo", label: "Bajo peso", nivel: "warn" };
  if (imc < 25) return { id: "normal", label: "Normal", nivel: "good" };
  if (imc < 30) return { id: "sobrepeso", label: "Sobrepeso", nivel: "warn" };
  return { id: "obesidad", label: "Obesidad", nivel: "bad" };
}

// Índice cintura / cadera: riesgo cardiovascular (OMS).
export function clasificarRcc(rcc, sexo) {
  if (rcc === null || !sexo) return null;
  const limite = sexo === "M" ? 0.9 : 0.85;
  return rcc < limite
    ? { label: "Riesgo bajo", nivel: "good" }
    : { label: "Riesgo elevado", nivel: "bad" };
}

// Índice cintura / estatura: por debajo de 0,5 se considera saludable.
export function clasificarIca(ica) {
  if (ica === null) return null;
  if (ica < 0.5) return { label: "Saludable", nivel: "good" };
  if (ica < 0.6) return { label: "Atención", nivel: "warn" };
  return { label: "Riesgo elevado", nivel: "bad" };
}

export function sumaPliegues(pliegues) {
  if (!pliegues) return null;
  const valores = PLIEGUES.map(({ key }) => num(pliegues[key]));
  if (valores.some((v) => v === null)) return null;
  return valores.reduce((a, b) => a + b, 0);
}

export function densidadPollock7(suma, edad, sexo) {
  if (suma === null || edad === null || !sexo) return null;
  if (sexo === "M") {
    return 1.112 - 0.00043499 * suma + 0.00000055 * suma * suma - 0.00028826 * edad;
  }
  return 1.097 - 0.00046971 * suma + 0.00000056 * suma * suma - 0.00012828 * edad;
}

export function siri(densidad) {
  if (!densidad) return null;
  return (4.95 / densidad - 4.5) * 100;
}

/**
 * Resultado completo de una evaluación.
 * @param entry   registro de historico_evaluacion
 * @param perfil  { sexo, edad, estatura, objetivos }
 */
export function calcularComposicion(entry, perfil = {}) {
  const sexo = perfil.sexo || null;
  const peso = num(entry?.peso);
  const edad = num(entry?.edad) ?? num(perfil.edad);
  const estatura = num(perfil.estatura);
  const estaturaM = estatura ? estatura / 100 : null;
  const perimetros = entry?.perimetros || {};

  const suma = sumaPliegues(entry?.pliegues);
  const densidad = densidadPollock7(suma, edad, sexo);
  const manual = num(entry?.porcentaje_grasa_manual);

  let porcentajeGrasa = null;
  let metodo = null;
  if (manual !== null) {
    porcentajeGrasa = manual;
    metodo = "manual";
  } else if (densidad) {
    porcentajeGrasa = siri(densidad);
    metodo = "pollock7";
  }
  if (porcentajeGrasa !== null) porcentajeGrasa = Math.max(0, porcentajeGrasa);

  const masaGrasa = peso !== null && porcentajeGrasa !== null ? (peso * porcentajeGrasa) / 100 : null;
  const masaMagra = peso !== null && masaGrasa !== null ? peso - masaGrasa : null;

  const grasaIdeal = num(perfil.objetivos?.porcentaje_grasa) ?? (sexo ? GRASA_IDEAL_DEFECTO[sexo] : null);
  const pesoIdeal = masaMagra !== null && grasaIdeal !== null ? masaMagra / (1 - grasaIdeal / 100) : null;
  const pesoResidual = peso !== null && sexo ? peso * RESIDUAL[sexo] : null;

  const imc = peso !== null && estaturaM ? peso / (estaturaM * estaturaM) : null;
  const cintura = num(perimetros.cintura);
  const cadera = num(perimetros.cadera);
  const rcc = cintura && cadera ? cintura / cadera : null;
  const ica = cintura && estatura ? cintura / estatura : null;

  // Índice de masa libre de grasa (normalizado a 1,80 m): referencia de
  // desarrollo muscular independiente de la altura.
  const ffmi = masaMagra !== null && estaturaM ? masaMagra / (estaturaM * estaturaM) + 6.1 * (1.8 - estaturaM) : null;
  // Metabolismo basal (Katch-McArdle): energía diaria en reposo.
  const tmb = masaMagra !== null ? 370 + 21.6 * masaMagra : null;

  return {
    peso,
    edad,
    sumaPliegues: suma,
    densidad,
    metodo,
    porcentajeGrasa,
    clasificacionGrasa: clasificarGrasa(porcentajeGrasa, sexo),
    masaGrasa,
    masaMagra,
    grasaIdeal,
    pesoIdeal,
    pesoResidual,
    imc,
    clasificacionImc: clasificarImc(imc),
    rcc,
    clasificacionRcc: clasificarRcc(rcc, sexo),
    ica,
    clasificacionIca: clasificarIca(ica),
    ffmi,
    tmb,
    perimetros,
  };
}

function redondearGrupo(grupo) {
  return Object.fromEntries(Object.entries(grupo || {}).map(([k, v]) => [k, redondear(num(v), 1)]));
}

/**
 * Composición redondeada a la precisión con la que se muestra al cliente.
 * Todo lo que se deriva después (diferencias, metas, rangos) usa
 * estos valores, así un cambio siempre coincide con la resta de los números
 * que se ven (10,0 -> 11,0 es +1,0 y no +0,9) y el rango de % de grasa
 * corresponde al valor mostrado.
 */
function redondearComposicion(c, sexo) {
  const peso = redondear(c.peso, 1);
  const porcentajeGrasa = redondear(c.porcentajeGrasa, 1);
  const masaMagra = redondear(c.masaMagra, 1);
  // Grasa = peso - magra con los valores mostrados: las partes suman el total.
  const masaGrasa = masaMagra !== null && peso !== null ? redondear(peso - masaMagra, 1) : null;
  const imc = redondear(c.imc, 1);
  const rcc = redondear(c.rcc, 2);
  const ica = redondear(c.ica, 2);
  return {
    ...c,
    peso,
    porcentajeGrasa,
    clasificacionGrasa: clasificarGrasa(porcentajeGrasa, sexo),
    masaMagra,
    masaGrasa,
    pesoIdeal: redondear(c.pesoIdeal, 1),
    sumaPliegues: redondear(c.sumaPliegues, 1),
    imc,
    clasificacionImc: clasificarImc(imc),
    rcc,
    clasificacionRcc: clasificarRcc(rcc, sexo),
    ica,
    clasificacionIca: clasificarIca(ica),
    ffmi: redondear(c.ffmi, 1),
    tmb: redondear(c.tmb, 0),
    perimetros: redondearGrupo(c.perimetros),
  };
}

/**
 * Historial ordenado de más antiguo a más reciente, con la composición de
 * cada evaluación ya calculada y redondeada para mostrar (panel del cliente).
 */
export function construirSerie(evaluacion) {
  if (!evaluacion) return [];
  return [...(evaluacion.historico_evaluacion || [])]
    .sort((a, b) => new Date(a.fecha_evaluacion) - new Date(b.fecha_evaluacion))
    .map((entry, index) => {
      const c = redondearComposicion(calcularComposicion(entry, evaluacion), evaluacion.sexo);
      return {
        ...entry,
        pliegues: redondearGrupo(entry.pliegues),
        perimetros: c.perimetros,
        numero: index + 1,
        fecha: new Date(entry.fecha_evaluacion),
        c,
      };
    });
}

// --- Métricas que se pueden graficar ---------------------------------------

// `mejora`: dirección que cuenta como progreso. "objetivo" = depende de si
// la meta está por encima o por debajo del valor inicial.
export const METRICAS = [
  { id: "peso", label: "Peso", unidad: "kg", decimales: 1, mejora: "objetivo", get: (p) => p.c.peso, objetivo: "peso" },
  { id: "grasa", label: "% Grasa", unidad: "%", decimales: 1, mejora: "baja", get: (p) => p.c.porcentajeGrasa, objetivo: "porcentaje_grasa" },
  { id: "magra", label: "Masa magra", unidad: "kg", decimales: 1, mejora: "sube", get: (p) => p.c.masaMagra, objetivo: "masa_magra" },
  { id: "masaGrasa", label: "Masa grasa", unidad: "kg", decimales: 1, mejora: "baja", get: (p) => p.c.masaGrasa },
  { id: "cintura", label: "Cintura", unidad: "cm", decimales: 1, mejora: "baja", get: (p) => num(p.perimetros?.cintura), objetivo: "cintura" },
  { id: "pliegues", label: "Σ Pliegues", unidad: "mm", decimales: 0, mejora: "baja", get: (p) => p.c.sumaPliegues },
];

export function valoresMetrica(serie, metrica) {
  return serie
    .map((p) => ({ fecha: p.fecha, valor: metrica.get(p), punto: p }))
    .filter((v) => v.valor !== null && v.valor !== undefined);
}

/** +1 si subir es progreso, -1 si bajar es progreso, 0 si depende de la meta (peso). */
export function direccionMejora(metrica) {
  if (metrica.mejora === "sube") return 1;
  if (metrica.mejora === "baja") return -1;
  return 0;
}

// --- Metas ------------------------------------------------------------------

// Objetivos que puede fijar el entrenador. `mejora`: +1 si subir es
// progreso, -1 si bajar es progreso, 0 si depende de la meta (peso).
export const OBJETIVOS = [
  { key: "peso", label: "Peso", nombre: "peso", unidad: "kg", mejora: 0, get: (p) => p.c.peso },
  { key: "porcentaje_grasa", label: "% de grasa", nombre: "% de grasa", unidad: "%", mejora: -1, get: (p) => p.c.porcentajeGrasa },
  { key: "masa_magra", label: "Masa magra", nombre: "masa magra", unidad: "kg", mejora: 1, get: (p) => p.c.masaMagra },
  { key: "cintura", label: "Cintura", nombre: "cintura", unidad: "cm", mejora: -1, get: (p) => num(p.perimetros?.cintura) },
];

/**
 * Interpreta una meta según dónde está respecto del punto de partida:
 * - "alcanzar": la meta está del lado del progreso (bajar a 78 kg desde 84).
 *   El avance va de 0 a 1 entre el inicio y la meta.
 * - "mantener": la meta es igual al inicio o está del otro lado (grasa en
 *   12,8 % con meta 16 %). Se cumple mientras el valor no cruce el límite
 *   (o, para el peso, mientras quede dentro de un margen de ± 1,5 %).
 * Así nunca se premia ir en la dirección contraria (p. ej. perder músculo).
 */
export function evaluarMeta({ inicio, actual, meta, mejora }) {
  if ([inicio, actual, meta].some((v) => v === null || v === undefined)) return null;
  const tolerancia = redondear(Math.max(0.5, Math.abs(meta) * 0.015), 1);
  const dir = mejora !== 0 ? mejora : Math.sign(meta - inicio);

  if (dir !== 0 && (meta - inicio) * dir > tolerancia) {
    const cumplida = (actual - meta) * dir >= 0;
    return {
      tipo: "alcanzar",
      dir,
      cumplida,
      progreso: Math.min(1, Math.max(0, (actual - inicio) / (meta - inicio))),
      restante: cumplida ? 0 : redondear(Math.abs(meta - actual), 1),
    };
  }

  if (mejora === 0) {
    const desvio = Math.abs(actual - meta);
    const cumplida = desvio <= tolerancia;
    return { tipo: "mantener", limite: "rango", dir: 0, tolerancia, cumplida, progreso: cumplida ? 1 : 0, restante: cumplida ? 0 : redondear(desvio - tolerancia, 1) };
  }

  const cumplida = (actual - meta) * mejora >= 0;
  return {
    tipo: "mantener",
    limite: mejora < 0 ? "max" : "min",
    dir: mejora,
    cumplida,
    progreso: cumplida ? 1 : 0,
    margen: redondear(Math.abs(actual - meta), 1),
    restante: cumplida ? 0 : redondear(Math.abs(actual - meta), 1),
  };
}

/** Evalúa la meta de un objetivo sobre el historial (inicio = primera medida). */
export function evaluarObjetivo(serie, objetivo, meta) {
  if (meta === null || meta === undefined) return null;
  const valores = serie.map(objetivo.get).filter((v) => v !== null && v !== undefined);
  if (!valores.length) return null;
  const inicio = valores[0];
  const actual = valores[valores.length - 1];
  // La meta se compara con la precisión con la que se muestra (69,28 -> 69,3).
  const metaR = redondear(Number(meta), 1);
  const res = evaluarMeta({ inicio, actual, meta: metaR, mejora: objetivo.mejora });
  // Historial de la meta evaluada en cada evaluación.
  const historial = valores.map((v) => evaluarMeta({ inicio, actual: v, meta: metaR, mejora: objetivo.mejora }));
  return { ...objetivo, ...res, inicio, actual, meta: metaR, historial };
}

/** Textos de una meta evaluada: qué pide y cómo va. */
export function describirMeta(o) {
  const u = o.unidad === "%" ? " %" : ` ${o.unidad}`;
  const v = (x) => `${fmt(x, 1)}${u}`;
  if (o.tipo === "alcanzar") {
    return {
      titulo: `${o.dir > 0 ? "Subir" : "Bajar"} a ${v(o.meta)}`,
      estado: o.cumplida ? "¡Meta cumplida!" : `Te faltan ${v(o.restante)}`,
      corto: o.cumplida ? "¡Cumplida!" : `Faltan ${v(o.restante)}`,
    };
  }
  if (o.limite === "rango") {
    return {
      titulo: `Mantenerte en ${v(o.meta)} (± ${v(o.tolerancia)})`,
      estado: o.cumplida ? "Dentro de tu rango. ¡Sostenelo!" : `Estás a ${v(o.restante)} del rango`,
      corto: o.cumplida ? "En rango" : `A ${v(o.restante)} del rango`,
    };
  }
  const max = o.limite === "max";
  return {
    titulo: `Mantenerte ${max ? "por debajo" : "por encima"} de ${v(o.meta)}`,
    estado: o.cumplida
      ? `Dentro de tu meta, con ${v(o.margen)} de margen`
      : max
      ? `Te pasaste ${v(o.restante)} del límite`
      : `Te faltan ${v(o.restante)} para volver al mínimo`,
    corto: o.cumplida ? "Dentro de tu meta" : max ? `${v(o.restante)} sobre el límite` : `${v(o.restante)} bajo el mínimo`,
  };
}

/**
 * Dirección de progreso del peso: solo existe si la meta de peso es "a
 * alcanzar" (bajar o subir). Con una meta de mantenimiento o sin meta es 0.
 */
export function direccionPeso(serie, objetivos) {
  const peso = OBJETIVOS[0];
  const res = evaluarObjetivo(serie, peso, objetivos?.peso);
  return res?.tipo === "alcanzar" ? res.dir : 0;
}

/**
 * Tendencia lineal (mínimos cuadrados) de los últimos `ventana` puntos, en
 * unidades por día, y fecha estimada para llegar a la meta a ese ritmo.
 */
export function proyectar(valores, meta, ventana = 4) {
  const puntos = valores.slice(-ventana);
  if (puntos.length < 2) return null;
  const t0 = puntos[0].fecha.getTime();
  const xs = puntos.map((p) => (p.fecha.getTime() - t0) / 86400000);
  const ys = puntos.map((p) => p.valor);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const den = xs.reduce((acc, x) => acc + (x - mx) ** 2, 0);
  if (!den) return null;
  const pendiente = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0) / den;
  const ultimo = valores[valores.length - 1];

  let fechaMeta = null;
  if (meta !== null && meta !== undefined && pendiente !== 0) {
    const dias = (meta - ultimo.valor) / pendiente;
    if (dias > 0 && dias < 365 * 3) fechaMeta = new Date(ultimo.fecha.getTime() + dias * 86400000);
  }
  return { pendientePorMes: pendiente * 30, fechaMeta };
}

/**
 * Meta principal (anillo del inicio): la primera meta "a alcanzar" que haya
 * definido el entrenador (peso, % grasa, masa magra, cintura); si todas son
 * de mantenimiento, la primera de ellas.
 */
export function metaPrincipal(serie, objetivos) {
  const metas = OBJETIVOS.map((o) => evaluarObjetivo(serie, o, objetivos?.[o.key])).filter(Boolean);
  return metas.find((m) => m.tipo === "alcanzar") || metas[0] || null;
}
