/**
 * Importación de evaluaciones desde CSV.
 *
 * Formato esperado: una fila por evaluación y una columna por medida (ver
 * plantillaCsv). También acepta el formato "vertical" que exportan algunas
 * planillas: una fila por medida y una columna por evaluación.
 *
 * Reconoce los campos del informe "Composição Corporal" del software de
 * evaluación (Terrazul, en portugués) y sus equivalentes en español:
 * - medidas de la evaluación: fecha, peso, edad, 7 pliegues, 12 perímetros;
 * - datos del perfil: sexo, estatura/altura, % de grasa ideal;
 * - resultados (% grasa, peso graso, magro, deseable, residual): se aceptan
 *   pero no se importan porque la app los recalcula. El % de grasa solo se
 *   usa como "% grasa manual" si la fila no trae los 7 pliegues.
 * - datos de identificación (nombre, código, N°): se ignoran; el nombre se
 *   usa para avisar si el archivo parece ser de otro cliente.
 *
 * Es tolerante con lo que produce Excel en español: separador ";" o ",",
 * coma decimal, fechas dd/mm/aaaa, encabezados con tildes, mayúsculas o
 * unidades ("Peso (kg)", "Tricipital mm").
 */

import { PERIMETROS_EXTREMIDADES, PLIEGUES } from "./composicion.js";

// --- Encabezados -------------------------------------------------------------

export function normalizarTexto(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function normalizarEncabezado(text) {
  return normalizarTexto(text)
    .replace(/%/g, " porcentaje ")
    .replace(/\((a|o|kg|cm|mm|anos)\)/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_(kg|cm|mm|anos)$/g, "")
    .replace(/^_+|_+$/g, "");
}

const ALIAS_ENTRADA = {
  fecha_evaluacion: [
    "fecha",
    "fecha_evaluacion",
    "fecha_de_evaluacion",
    "fecha_de_la_evaluacion",
    "data",
    "data_avaliacao",
    "data_da_avaliacao",
    "date",
  ],
  peso: ["peso", "peso_actual", "peso_atual", "peso_corporal", "masa_corporal"],
  edad: ["edad", "idade"],
  porcentaje_grasa_manual: [
    "porcentaje_grasa_manual",
    "grasa_manual",
    "porcentaje_grasa_bioimpedancia",
    "grasa_bioimpedancia",
    "bioimpedancia",
  ],
  nota: ["nota", "notas", "comentario", "comentarios", "observaciones", "observacion", "observacoes"],
};

// Datos del perfil del cliente (no de una evaluación puntual).
const ALIAS_PERFIL = {
  sexo: ["sexo", "genero"],
  estatura: ["estatura", "altura", "talla"],
  grasa_ideal: [
    "porcentaje_grasa_ideal",
    "grasa_ideal",
    "porcentaje_gordura_ideal",
    "gordura_ideal",
    "porcentaje_grasa_objetivo",
    "grasa_objetivo",
  ],
};

// Resultados calculados: la app los recalcula a partir de las medidas.
const GRASA_CALCULADA = [
  "porcentaje_grasa",
  "porcentaje_de_grasa",
  "porcentaje_grasa_actual",
  "grasa",
  "grasa_actual",
  "grasa_porcentaje",
  "porcentaje_gordura",
  "porcentaje_gordura_atual",
  "gordura",
  "gordura_atual",
];
const CALCULADOS = [
  "peso_graso",
  "peso_gordo",
  "masa_grasa",
  "peso_magro",
  "masa_magra",
  "peso_deseable",
  "peso_desejavel",
  "peso_ideal",
  "peso_residual",
  "densidad",
  "densidad_corporal",
  "densidade",
  "densidade_corporal",
  "imc",
  "suma_pliegues",
  "suma_7_pliegues",
  "sumatoria_pliegues",
  "soma_dobras",
];

// Identificación y datos del informe que no se guardan.
const META = [
  "nombre",
  "nome",
  "nombre_completo",
  "apellido",
  "cliente",
  "avaliado",
  "codigo",
  "codigo_do_avaliado",
  "codigo_avaliado",
  "id",
  "email",
  "n",
  "no",
  "nro",
  "numero",
  "protocolo",
  "padrao_de_pontos_anatomicos",
  "puntos_anatomicos",
];
const NOMBRE = ["nombre", "nome", "nombre_completo", "cliente", "avaliado"];

const ALIAS_PLIEGUES = {
  subescapular: ["subescapular", "subscapular", "sub_escapular"],
  tricipital: ["tricipital", "triceps", "tricep"],
  pectoral: ["pectoral", "peitoral", "pecho", "toracico"],
  axilar_media: ["axilar_media", "axilar", "medio_axilar", "axilar_medio"],
  suprailiaca: ["suprailiaca", "supra_iliaca", "suprailiaco", "cresta_iliaca"],
  abdominal: ["abdominal"],
  muslo: ["muslo", "muslo_anterior", "muslo_frontal", "coxa"],
};

const ALIAS_PERIMETROS = {
  torax: ["torax", "pecho"],
  cintura: ["cintura"],
  abdomen: ["abdomen", "abdome"],
  cadera: ["cadera", "quadril", "gluteo", "gluteos"],
};

const ALIAS_EXTREMIDADES = {
  brazo: ["brazo", "brazos", "braco", "bracos"],
  antebrazo: ["antebrazo", "antebrazos", "antebraco", "antebracos"],
  muslo: ["muslo", "muslos", "coxa", "coxas"],
  pantorrilla: ["pantorrilla", "pantorrillas", "gemelo", "gemelos", "panturrilha", "panturrilhas"],
};

const LADOS = {
  der: ["der", "derecho", "derecha", "d", "dcho", "dcha", "dir", "direito", "direita"],
  izq: ["izq", "izquierdo", "izquierda", "i", "izdo", "izda", "e", "esq", "esquerdo", "esquerda"],
};

// Mapa encabezado normalizado -> { grupo, key }. grupo: null | "pliegues" |
// "perimetros" | "perfil" | "calculado" | "meta".
const COLUMNAS = new Map();

function registrar(nombres, destino) {
  nombres.forEach((nombre) => {
    if (!COLUMNAS.has(nombre)) COLUMNAS.set(nombre, destino);
  });
}

Object.entries(ALIAS_ENTRADA).forEach(([key, nombres]) => registrar(nombres, { grupo: null, key }));
Object.entries(ALIAS_PERFIL).forEach(([key, nombres]) => registrar(nombres, { grupo: "perfil", key }));
registrar(GRASA_CALCULADA, { grupo: "calculado", key: "grasa" });
registrar(CALCULADOS, { grupo: "calculado", key: null });
registrar(META, { grupo: "meta", key: null });
NOMBRE.forEach((n) => COLUMNAS.set(n, { grupo: "meta", key: "nombre" }));

// Los prefijos explícitos van primero: "pliegue_muslo" y "perimetro_muslo_der"
// no son ambiguos. "muslo"/"coxa" a secas es el pliegue.
const PREFIJOS_PLIEGUE = ["pliegue", "pl", "dobra", "dobra_cutanea"];
const PREFIJOS_PERIMETRO = ["perimetro", "per", "circunferencia"];
const conPrefijos = (prefijos, nombres) => nombres.flatMap((n) => prefijos.map((p) => `${p}_${n}`));

Object.entries(ALIAS_PLIEGUES).forEach(([key, nombres]) =>
  registrar(conPrefijos(PREFIJOS_PLIEGUE, nombres), { grupo: "pliegues", key })
);
Object.entries(ALIAS_PERIMETROS).forEach(([key, nombres]) =>
  registrar(conPrefijos(PREFIJOS_PERIMETRO, nombres), { grupo: "perimetros", key })
);
PERIMETROS_EXTREMIDADES.forEach(({ key }) => {
  Object.entries(LADOS).forEach(([lado, sufijos]) => {
    const nombres = ALIAS_EXTREMIDADES[key].flatMap((n) => sufijos.map((s) => `${n}_${s}`));
    registrar([...nombres, ...conPrefijos(PREFIJOS_PERIMETRO, nombres)], {
      grupo: "perimetros",
      key: `${key}_${lado}`,
    });
  });
});
Object.entries(ALIAS_PLIEGUES).forEach(([key, nombres]) => registrar(nombres, { grupo: "pliegues", key }));
Object.entries(ALIAS_PERIMETROS).forEach(([key, nombres]) => registrar(nombres, { grupo: "perimetros", key }));

function columnaDe(encabezado) {
  return COLUMNAS.get(normalizarEncabezado(encabezado)) || null;
}

// --- CSV crudo -----------------------------------------------------------------

function detectarSeparador(texto) {
  const primeraLinea = texto.split(/\r?\n/).find((l) => l.trim()) || "";
  const candidatos = [";", ",", "\t"];
  let mejor = ",";
  let max = 0;
  candidatos.forEach((sep) => {
    const n = primeraLinea.split(sep).length - 1;
    if (n > max) {
      max = n;
      mejor = sep;
    }
  });
  return mejor;
}

/** Parser CSV con soporte de comillas ("a;b", comillas escapadas ""). */
export function parseCsv(texto) {
  const limpio = texto.replace(/^﻿/, "");
  const sep = detectarSeparador(limpio);
  const filas = [];
  let fila = [];
  let celda = "";
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i += 1) {
    const ch = limpio[i];
    if (entreComillas) {
      if (ch === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i += 1;
      } else if (ch === '"') {
        entreComillas = false;
      } else {
        celda += ch;
      }
    } else if (ch === '"') {
      entreComillas = true;
    } else if (ch === sep) {
      fila.push(celda);
      celda = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && limpio[i + 1] === "\n") i += 1;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else {
      celda += ch;
    }
  }
  fila.push(celda);
  filas.push(fila);

  return filas.map((f) => f.map((c) => c.trim())).filter((f) => f.some((c) => c !== ""));
}

// --- Valores -------------------------------------------------------------------

function parseNumero(valor) {
  let v = String(valor ?? "").trim().replace(/\s/g, "").replace(/[a-z%]+$/i, "");
  if (!v || v === "-" || v === "–") return null;
  if (v.includes(",") && v.includes(".")) {
    // 1.234,5 -> 1234.5 ; 1,234.5 -> 1234.5
    v = v.lastIndexOf(",") > v.lastIndexOf(".") ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  } else {
    v = v.replace(",", ".");
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Devuelve "AAAA-MM-DD" o null si no se reconoce la fecha. */
function parseFecha(valor) {
  const v = String(valor ?? "").trim();
  if (!v) return null;
  let d;
  let m;
  let a;
  let match = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    [, a, m, d] = match;
  } else {
    match = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (!match) return null;
    [, d, m, a] = match;
    if (a.length === 2) a = `20${a}`;
  }
  const fecha = new Date(Date.UTC(Number(a), Number(m) - 1, Number(d)));
  if (fecha.getUTCMonth() !== Number(m) - 1 || fecha.getUTCDate() !== Number(d)) return null;
  return `${a}-${pad(m)}-${pad(d)}`;
}

/** "M" | "F" | null ; undefined si el valor no se reconoce. */
function parseSexo(valor) {
  const v = normalizarTexto(valor).trim();
  if (!v) return null;
  if (["m", "masc", "masculino", "hombre", "h", "varon", "homem", "male"].includes(v)) return "M";
  if (["f", "fem", "femenino", "feminino", "mujer", "mulher", "female"].includes(v)) return "F";
  return undefined;
}

// --- Tabla -> evaluaciones -------------------------------------------------------

function contarReconocidas(celdas) {
  return celdas.filter((c) => columnaDe(c)).length;
}

// Si las medidas están en la primera columna (formato vertical), se traspone.
function orientar(filas) {
  const enEncabezado = contarReconocidas(filas[0]);
  const enPrimeraColumna = contarReconocidas(filas.map((f) => f[0]));
  if (enPrimeraColumna <= enEncabezado) return filas;
  const ancho = Math.max(...filas.map((f) => f.length));
  return Array.from({ length: ancho }, (_, col) => filas.map((f) => f[col] ?? ""));
}

function entradaVacia() {
  return {
    fecha_evaluacion: null,
    peso: null,
    edad: null,
    porcentaje_grasa_manual: null,
    nota: "",
    pliegues: {},
    perimetros: {},
  };
}

function tieneMedidas(e) {
  return (
    e.fecha_evaluacion ||
    e.peso !== null ||
    Object.values(e.pliegues).some((v) => v !== null) ||
    Object.values(e.perimetros).some((v) => v !== null)
  );
}

/**
 * Convierte el texto de un CSV en evaluaciones listas para la API.
 * Devuelve { entries, perfil, nombres, calculadas, ignoradas, errores }:
 * - entries: cada una lleva además `fila` (para mensajes) y `problemas`.
 * - perfil: { sexo, estatura, grasa_ideal, edad } tomados de la evaluación
 *   más reciente que los traiga (solo las claves presentes).
 * - nombres: nombres de cliente encontrados en el archivo.
 */
export function leerEvaluacionesCsv(texto) {
  const vacio = { entries: [], perfil: {}, nombres: [], calculadas: [], ignoradas: [] };
  const filas = parseCsv(texto);
  if (filas.length < 2) {
    return { ...vacio, errores: ["El archivo está vacío o solo tiene encabezados."] };
  }

  const tabla = orientar(filas);
  const [encabezados, ...datos] = tabla;
  const columnas = encabezados.map(columnaDe);
  // Sin columna "fecha" pero con fechas en la primera columna (típico del
  // formato vertical, donde las fechas encabezan cada evaluación).
  if (
    !columnas.some((c) => c?.key === "fecha_evaluacion") &&
    !columnas[0] &&
    datos.length &&
    datos.every((celdas) => parseFecha(celdas[0]))
  ) {
    columnas[0] = { grupo: null, key: "fecha_evaluacion" };
  }
  const ignoradas = encabezados.filter((h, i) => h && !columnas[i]);
  const calculadas = encabezados.filter((h, i) => columnas[i]?.grupo === "calculado");

  if (!columnas.some((c) => c && c.grupo !== "meta" && c.grupo !== "calculado")) {
    return {
      ...vacio,
      ignoradas,
      errores: ["No se reconoció ninguna medida. Descargá la plantilla para ver los nombres esperados."],
    };
  }

  const nombres = new Set();
  const entries = datos
    .map((celdas, index) => {
      const entry = entradaVacia();
      const perfil = {};
      const problemas = [];
      let grasaCalculada = null;

      columnas.forEach((col, i) => {
        if (!col) return;
        const crudo = celdas[i] ?? "";
        if (col.grupo === "meta") {
          if (col.key === "nombre" && crudo) nombres.add(crudo);
          return;
        }
        if (col.key === "nota") {
          entry.nota = crudo.slice(0, 1000);
          return;
        }
        if (col.key === "fecha_evaluacion") {
          entry.fecha_evaluacion = parseFecha(crudo);
          if (crudo && !entry.fecha_evaluacion) problemas.push(`fecha "${crudo}" no válida`);
          return;
        }
        if (col.key === "sexo") {
          const sexo = parseSexo(crudo);
          if (sexo === undefined) problemas.push(`sexo "${crudo}" no reconocido (usá M o F)`);
          else if (sexo) perfil.sexo = sexo;
          return;
        }
        if (col.grupo === "calculado" && col.key !== "grasa") return;

        const n = parseNumero(crudo);
        if (Number.isNaN(n) || (n !== null && n < 0)) {
          problemas.push(`${encabezados[i]}: "${crudo}" no es un número válido`);
          return;
        }
        // El software de evaluación exporta 0,00 en lo que no se midió.
        const valor = n === 0 ? null : n;
        if (col.grupo === "calculado") grasaCalculada = valor;
        else if (col.grupo === "perfil") {
          if (valor !== null) perfil[col.key] = valor;
        } else if (col.grupo) entry[col.grupo][col.key] = valor;
        else entry[col.key] = valor;
      });

      if (entry.edad !== null) perfil.edad = entry.edad;
      // Sin los 7 pliegues no hay Pollock: el % de grasa del archivo se usa
      // como medición manual (bioimpedancia u otro método).
      const plieguesCompletos = PLIEGUES.every(({ key }) => entry.pliegues[key] != null);
      if (entry.porcentaje_grasa_manual === null && grasaCalculada !== null && !plieguesCompletos) {
        entry.porcentaje_grasa_manual = grasaCalculada;
      }
      if (entry.porcentaje_grasa_manual !== null && entry.porcentaje_grasa_manual > 100) {
        problemas.push("el % de grasa no puede superar 100");
      }
      if (perfil.grasa_ideal !== undefined && perfil.grasa_ideal > 100) {
        problemas.push("el % de grasa ideal no puede superar 100");
        delete perfil.grasa_ideal;
      }
      return { ...entry, fila: index + 2, problemas, perfil };
    })
    // Filas que no traen ninguna medida (p. ej. una fila de totales vacía).
    .filter(tieneMedidas);

  entries.forEach((e) => {
    if (!e.fecha_evaluacion && !e.problemas.some((p) => p.startsWith("fecha"))) e.problemas.push("falta la fecha");
    if (e.peso === null) e.problemas.push("falta el peso");
  });

  // Perfil: el dato más reciente de cada campo.
  const perfil = {};
  [...entries]
    .sort((a, b) => String(a.fecha_evaluacion || "").localeCompare(String(b.fecha_evaluacion || "")))
    .forEach((e) => Object.assign(perfil, e.perfil));

  return {
    entries: entries.map(({ perfil: _p, ...e }) => e),
    perfil,
    nombres: [...nombres],
    calculadas,
    ignoradas,
    errores: [],
  };
}

/** Quita los campos auxiliares (fila, problemas) antes de mandar a la API. */
export function entryParaApi({ fila, problemas, ...entry }) {
  return entry;
}

/**
 * ¿El nombre del archivo coincide con el cliente? Basta con que aparezca
 * alguna palabra de su nombre o apellido (el informe usa "ALEX BENITEZ").
 */
export function nombreCoincide(nombreArchivo, cliente) {
  if (!cliente) return true;
  const palabras = (t) => normalizarTexto(t).split(/[^a-z]+/).filter((p) => p.length > 2);
  const delCliente = new Set(palabras(`${cliente.nombre || ""} ${cliente.apellido || ""}`));
  if (delCliente.size === 0) return true;
  return palabras(nombreArchivo).some((p) => delCliente.has(p));
}

// --- Plantilla -------------------------------------------------------------------

const PLANTILLA = [
  ["fecha", "21/04/2026"],
  ["peso", "69,25"],
  ["edad", "52"],
  ["sexo", "M"],
  ["estatura", "166"],
  ["subescapular", "16"],
  ["tricipital", "8"],
  ["pectoral", "10"],
  ["axilar_media", "12"],
  ["suprailiaca", "11"],
  ["abdominal", "20"],
  ["pliegue_muslo", "13"],
  ["torax", "96"],
  ["cintura", "80"],
  ["abdomen", "85"],
  ["cadera", "92"],
  ["brazo_der", "30"],
  ["brazo_izq", "30"],
  ["antebrazo_der", "27"],
  ["antebrazo_izq", "27"],
  ["perimetro_muslo_der", "52"],
  ["perimetro_muslo_izq", "52"],
  ["pantorrilla_der", "37"],
  ["pantorrilla_izq", "37"],
  ["porcentaje_grasa_ideal", "16"],
  ["porcentaje_grasa_manual", ""],
  ["nota", ""],
];

export function plantillaCsv() {
  return `${PLANTILLA.map(([c]) => c).join(";")}\n${PLANTILLA.map(([, v]) => v).join(";")}\n`;
}

