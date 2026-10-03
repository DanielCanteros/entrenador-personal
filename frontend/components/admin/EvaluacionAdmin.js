"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminAddHistoricoEvaluacion,
  adminCreateEvaluacion,
  adminDeleteHistoricoEvaluacion,
  adminGetCliente,
  adminGetEvaluacionByCliente,
  adminImportHistoricoEvaluacion,
  adminUpdateEvaluacion,
  adminUpdateHistoricoEvaluacion,
} from "../../lib/api.js";
import {
  PERIMETROS_EXTREMIDADES,
  PERIMETROS_TRONCO,
  OBJETIVOS,
  PLIEGUES,
  calcularComposicion,
  construirSerie,
  describirMeta,
  evaluarObjetivo,
  ladoLabel,
} from "../../lib/composicion.js";
import { fmt, fmtFecha, toDateInputValue } from "../../lib/formato.js";
import EvaluacionCsvImport from "./EvaluacionCsvImport.js";
import "../../styles/evaluacion-admin.css";

// --- Conversión formulario <-> API ------------------------------------------

const PERIMETRO_KEYS = [
  ...PERIMETROS_TRONCO.map((p) => p.key),
  ...PERIMETROS_EXTREMIDADES.flatMap((p) => [`${p.key}_der`, `${p.key}_izq`]),
];

function str(value) {
  return value === null || value === undefined ? "" : String(value);
}

function numOrNull(value) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}

function emptyEntryForm(edad) {
  return {
    fecha_evaluacion: toDateInputValue(new Date().toISOString()),
    peso: "",
    edad: str(edad),
    porcentaje_grasa_manual: "",
    nota: "",
    pliegues: Object.fromEntries(PLIEGUES.map((p) => [p.key, ""])),
    perimetros: Object.fromEntries(PERIMETRO_KEYS.map((k) => [k, ""])),
  };
}

function entryToForm(entry) {
  return {
    fecha_evaluacion: toDateInputValue(entry.fecha_evaluacion),
    peso: str(entry.peso),
    edad: str(entry.edad),
    porcentaje_grasa_manual: str(entry.porcentaje_grasa_manual),
    nota: entry.nota || "",
    pliegues: Object.fromEntries(PLIEGUES.map((p) => [p.key, str(entry.pliegues?.[p.key])])),
    perimetros: Object.fromEntries(PERIMETRO_KEYS.map((k) => [k, str(entry.perimetros?.[k])])),
  };
}

// Vuelca una fila del CSV sobre el formulario: pisa solo lo que trae el archivo.
function mergeCsvIntoForm(form, entry) {
  const pick = (value, actual) => (value === null || value === undefined ? actual : str(value));
  const mergeGroup = (group) =>
    Object.fromEntries(Object.entries(form[group]).map(([k, v]) => [k, pick(entry[group]?.[k], v)]));
  return {
    fecha_evaluacion: entry.fecha_evaluacion || form.fecha_evaluacion,
    peso: pick(entry.peso, form.peso),
    edad: pick(entry.edad, form.edad),
    porcentaje_grasa_manual: pick(entry.porcentaje_grasa_manual, form.porcentaje_grasa_manual),
    nota: entry.nota || form.nota,
    pliegues: mergeGroup("pliegues"),
    perimetros: mergeGroup("perimetros"),
  };
}

// Datos de perfil que trae el CSV (sexo, edad, estatura, % grasa ideal).
// El % de grasa ideal es el objetivo de % de grasa del cliente.
function mergeCsvIntoPerfilForm(form, perfil) {
  const pick = (value, actual) => (value === null || value === undefined ? actual : str(value));
  return {
    ...form,
    sexo: perfil.sexo || form.sexo,
    edad: pick(perfil.edad, form.edad),
    estatura: pick(perfil.estatura, form.estatura),
    objetivos: { ...form.objetivos, porcentaje_grasa: pick(perfil.grasa_ideal, form.objetivos.porcentaje_grasa) },
  };
}

function csvPerfilToPayload(perfil) {
  const payload = {};
  if (perfil.sexo) payload.sexo = perfil.sexo;
  if (perfil.edad != null) payload.edad = perfil.edad;
  if (perfil.estatura != null) payload.estatura = perfil.estatura;
  if (perfil.grasa_ideal != null) payload.objetivos = { porcentaje_grasa: perfil.grasa_ideal };
  return payload;
}

function aplicarPerfilCsv(perfil, csv) {
  if (!csv) return perfil;
  const extra = csvPerfilToPayload(csv);
  return { ...perfil, ...extra, objetivos: { ...perfil.objetivos, ...extra.objetivos } };
}

function formToPayload(form) {
  return {
    fecha_evaluacion: form.fecha_evaluacion,
    peso: numOrNull(form.peso),
    edad: numOrNull(form.edad),
    porcentaje_grasa_manual: numOrNull(form.porcentaje_grasa_manual),
    nota: form.nota,
    pliegues: Object.fromEntries(Object.entries(form.pliegues).map(([k, v]) => [k, numOrNull(v)])),
    perimetros: Object.fromEntries(Object.entries(form.perimetros).map(([k, v]) => [k, numOrNull(v)])),
  };
}

function perfilToForm(evaluacion) {
  const o = evaluacion?.objetivos || {};
  return {
    sexo: evaluacion?.sexo || "",
    edad: str(evaluacion?.edad),
    estatura: str(evaluacion?.estatura),
    frecuencia_dias: str(evaluacion?.frecuencia_dias ?? 30),
    objetivos: {
      peso: str(o.peso),
      porcentaje_grasa: str(o.porcentaje_grasa),
      masa_magra: str(o.masa_magra),
      cintura: str(o.cintura),
      fecha_limite: toDateInputValue(o.fecha_limite),
      descripcion: o.descripcion || "",
    },
  };
}

function perfilToPayload(form) {
  return {
    sexo: form.sexo || null,
    edad: numOrNull(form.edad),
    estatura: numOrNull(form.estatura),
    frecuencia_dias: numOrNull(form.frecuencia_dias) ?? 30,
    objetivos: {
      peso: numOrNull(form.objetivos.peso),
      porcentaje_grasa: numOrNull(form.objetivos.porcentaje_grasa),
      masa_magra: numOrNull(form.objetivos.masa_magra),
      cintura: numOrNull(form.objetivos.cintura),
      fecha_limite: form.objetivos.fecha_limite || null,
      descripcion: form.objetivos.descripcion,
    },
  };
}

// --- Piezas de formulario ----------------------------------------------------

// step "any": acepta cualquier cantidad de decimales (p. ej. 69,25 kg). Con
// un step fijo el navegador bloquea el envío sin avisar bien por qué.
function NumberField({ label, unit, value, onChange, placeholder, step = "any", required = false }) {
  return (
    <label className="field eval-field">
      <span>{label}</span>
      <span className="eval-field__control">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
        {unit && <span className="eval-field__unit">{unit}</span>}
      </span>
    </label>
  );
}

// Cómo va a ver el cliente cada meta. Una meta igual al valor inicial o del
// lado contrario (p. ej. masa magra menor a la actual) se muestra como "mantener".
function VistaPreviaMetas({ serie, objetivos }) {
  const metas = OBJETIVOS.map((o) => evaluarObjetivo(serie, o, numOrNull(objetivos[o.key]))).filter(Boolean);
  if (!metas.length) return null;

  return (
    <ul className="eval-metas">
      {metas.map((m) => {
        const u = m.unidad === "%" ? " %" : ` ${m.unidad}`;
        const texto = describirMeta(m);
        const alcanzar = m.tipo === "alcanzar";
        return (
          <li key={m.key} className={alcanzar ? "" : "is-mantener"}>
            <strong>{m.label}:</strong> el cliente ve «{texto.titulo}»
            {alcanzar ? ` · avance ${Math.round(m.progreso * 100)} %` : ` · ${texto.corto.toLowerCase()}`}
            {!alcanzar && (
              <span className="eval-metas__why">
                Es de mantenimiento porque el valor inicial era {fmt(m.inicio, 1)}
                {u}.{" "}
                {m.limite === "rango"
                  ? "Para una meta de bajar o subir de peso, poné un valor distinto."
                  : `Para que sea una meta de progreso tiene que ser ${m.mejora < 0 ? "menor" : "mayor"} a ese valor.`}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PerfilFields({ form, setForm, serie = [] }) {
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setObj = (key) => (value) =>
    setForm((prev) => ({ ...prev, objetivos: { ...prev.objetivos, [key]: value } }));

  return (
    <>
      <fieldset className="eval-fieldset">
        <legend>Datos del cliente</legend>
        <div className="eval-grid eval-grid--4">
          <label className="field eval-field">
            <span>Sexo</span>
            <select value={form.sexo} onChange={(e) => set("sexo")(e.target.value)}>
              <option value="">Sin definir</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </label>
          <NumberField label="Edad" unit="años" step="1" value={form.edad} onChange={set("edad")} />
          <NumberField label="Estatura" unit="cm" value={form.estatura} onChange={set("estatura")} />
          <NumberField
            label="Re-evaluar cada"
            unit="días"
            step="1"
            value={form.frecuencia_dias}
            onChange={set("frecuencia_dias")}
          />
        </div>
        {!form.sexo && (
          <p className="eval-hint">
            El sexo es necesario para calcular el % de grasa con el protocolo de Pollock.
          </p>
        )}
      </fieldset>

      <fieldset className="eval-fieldset">
        <legend>Objetivos</legend>
        <p className="eval-hint">
          Lo que el cliente ve como meta en su panel. Dejá vacío lo que no aplique.
        </p>
        <div className="eval-grid eval-grid--4">
          <NumberField label="Peso objetivo" unit="kg" value={form.objetivos.peso} onChange={setObj("peso")} />
          <NumberField
            label="% grasa objetivo"
            unit="%"
            value={form.objetivos.porcentaje_grasa}
            onChange={setObj("porcentaje_grasa")}
          />
          <NumberField
            label="Masa magra objetivo"
            unit="kg"
            value={form.objetivos.masa_magra}
            onChange={setObj("masa_magra")}
          />
          <NumberField label="Cintura objetivo" unit="cm" value={form.objetivos.cintura} onChange={setObj("cintura")} />
        </div>
        {serie.length > 0 && <VistaPreviaMetas serie={serie} objetivos={form.objetivos} />}
        <div className="eval-grid eval-grid--objetivo">
          <label className="field eval-field">
            <span>Fecha límite</span>
            <input
              type="date"
              value={form.objetivos.fecha_limite}
              onChange={(e) => setObj("fecha_limite")(e.target.value)}
            />
          </label>
          <label className="field eval-field">
            <span>Motivación / descripción del objetivo</span>
            <input
              type="text"
              maxLength={280}
              placeholder="Ej.: Llegar en forma al casamiento de mi hermana"
              value={form.objetivos.descripcion}
              onChange={(e) => setObj("descripcion")(e.target.value)}
            />
          </label>
        </div>
      </fieldset>
    </>
  );
}

function ResultadosPanel({ c, sexo }) {
  const rows = [
    ["Σ 7 pliegues", c.sumaPliegues, "mm", 1],
    ["Densidad corporal", c.densidad, "g/ml", 4],
    ["% Grasa actual", c.porcentajeGrasa, "%", 2],
    ["% Grasa ideal", c.grasaIdeal, "%", 2],
    ["Peso graso", c.masaGrasa, "kg", 2],
    ["Peso magro", c.masaMagra, "kg", 2],
    ["Peso deseable", c.pesoIdeal, "kg", 2],
    ["Peso residual", c.pesoResidual, "kg", 2],
    ["IMC", c.imc, "", 1],
    ["Cintura / cadera", c.rcc, "", 2],
    ["Cintura / estatura", c.ica, "", 2],
  ];

  return (
    <aside className="eval-results" aria-live="polite">
      <p className="eval-results__title">Resultados</p>
      <p className="eval-results__method">
        {c.metodo === "manual"
          ? "% de grasa cargado manualmente"
          : c.metodo === "pollock7"
          ? "Protocolo de Pollock (7 pliegues)"
          : !sexo
          ? "Definí el sexo del cliente para calcular"
          : "Completá los 7 pliegues y la edad"}
      </p>
      <dl>
        {rows.map(([label, value, unit, dec]) => (
          <div key={label} className="eval-results__row">
            <dt>{label}</dt>
            <dd>
              {fmt(value, dec)}
              {value !== null && unit && <small> {unit}</small>}
            </dd>
          </div>
        ))}
      </dl>
      {c.clasificacionGrasa && (
        <p className="eval-results__badge">Rango: {c.clasificacionGrasa.label}</p>
      )}
    </aside>
  );
}

function EvaluacionEntryForm({
  perfil,
  initial,
  previous,
  submitLabel,
  onSubmit,
  onCancel,
  onImportMany,
  onPerfilCsv,
  fechasExistentes,
  cliente,
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Perfil leído del CSV cuando el formulario no tiene campos de perfil
  // propios: se muestra en los resultados y se guarda al guardar.
  const [perfilCsv, setPerfilCsv] = useState(null);

  const payload = formToPayload(form);
  const resultados = calcularComposicion(payload, aplicarPerfilCsv(perfil, perfilCsv));

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setGroup = (group, key) => (value) =>
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  const prev = (group, key) =>
    previous?.[group]?.[key] !== null && previous?.[group]?.[key] !== undefined
      ? `Ant.: ${fmt(previous[group][key], 1)}`
      : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(payload, perfilCsv);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="card eval-entry" onSubmit={handleSubmit}>
      <div className="eval-entry__main">
        <EvaluacionCsvImport
          onPrefill={(entry) => setForm((prev) => mergeCsvIntoForm(prev, entry))}
          onImportMany={onImportMany && ((entries) => onImportMany(entries, perfilCsv))}
          onPerfil={(datos) => {
            // La edad del informe es la del día de la evaluación: Pollock la usa.
            if (datos?.edad !== null && datos?.edad !== undefined) {
              setForm((prev) => ({ ...prev, edad: str(datos.edad) }));
            }
            (onPerfilCsv || setPerfilCsv)(datos);
          }}
          existentes={fechasExistentes}
          cliente={cliente}
        />

        <fieldset className="eval-fieldset">
          <legend>Datos de la evaluación</legend>
          <div className="eval-grid eval-grid--3">
            <label className="field eval-field">
              <span>Fecha</span>
              <input
                type="date"
                value={form.fecha_evaluacion}
                onChange={(e) => set("fecha_evaluacion")(e.target.value)}
                required
              />
            </label>
            <NumberField
              label="Peso"
              unit="kg"
              value={form.peso}
              placeholder={previous?.peso ? `Ant.: ${fmt(previous.peso, 1)}` : ""}
              onChange={set("peso")}
              required
            />
            <NumberField label="Edad" unit="años" step="1" value={form.edad} onChange={set("edad")} />
          </div>
        </fieldset>

        <fieldset className="eval-fieldset">
          <legend>Pliegues cutáneos</legend>
          <div className="eval-grid eval-grid--4">
            {PLIEGUES.map((p) => (
              <NumberField
                key={p.key}
                label={p.label}
                unit="mm"
                value={form.pliegues[p.key]}
                placeholder={prev("pliegues", p.key)}
                onChange={setGroup("pliegues", p.key)}
              />
            ))}
          </div>
          <details className="eval-details">
            <summary>¿Medís el % de grasa con otro método?</summary>
            <div className="eval-grid eval-grid--4">
              <NumberField
                label="% grasa (manual)"
                unit="%"
                value={form.porcentaje_grasa_manual}
                onChange={set("porcentaje_grasa_manual")}
              />
            </div>
            <p className="eval-hint">
              Si lo cargás (bioimpedancia, etc.), reemplaza al cálculo por pliegues.
            </p>
          </details>
        </fieldset>

        <fieldset className="eval-fieldset">
          <legend>Perímetros · tronco</legend>
          <div className="eval-grid eval-grid--4">
            {PERIMETROS_TRONCO.map((p) => (
              <NumberField
                key={p.key}
                label={p.label}
                unit="cm"
                value={form.perimetros[p.key]}
                placeholder={prev("perimetros", p.key)}
                onChange={setGroup("perimetros", p.key)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="eval-fieldset">
          <legend>Perímetros · extremidades</legend>
          <div className="eval-bilateral">
            <span />
            <span className="eval-bilateral__head">Derecho</span>
            <span className="eval-bilateral__head">Izquierdo</span>
            {PERIMETROS_EXTREMIDADES.map((p) => (
              <div key={p.key} className="eval-bilateral__row">
                <span className="eval-bilateral__label">{p.label}</span>
                {["der", "izq"].map((lado) => (
                  <NumberField
                    key={lado}
                    label={`${p.label} ${ladoLabel(lado, p.femenino)}`}
                    unit="cm"
                    value={form.perimetros[`${p.key}_${lado}`]}
                    placeholder={prev("perimetros", `${p.key}_${lado}`)}
                    onChange={setGroup("perimetros", `${p.key}_${lado}`)}
                  />
                ))}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="eval-fieldset">
          <legend>Nota para el cliente</legend>
          <label className="field eval-field">
            <span className="visually-hidden">Nota para el cliente</span>
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Ej.: ¡Excelente mes! Bajaste 2 cm de cintura. Ahora vamos por más fuerza en piernas."
              value={form.nota}
              onChange={(e) => set("nota")(e.target.value)}
            />
          </label>
          <p className="eval-hint">El cliente la ve destacada en su panel de progreso.</p>
        </fieldset>

        {error && <p className="contact-form__status is-error">{error}</p>}

        <div className="admin-post-form__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : submitLabel}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <ResultadosPanel c={resultados} sexo={perfilCsv?.sexo || perfil.sexo} />
    </form>
  );
}

function PerfilForm({ evaluacion, onSaved }) {
  const [form, setForm] = useState(() => perfilToForm(evaluacion));
  const serie = useMemo(() => construirSerie(evaluacion), [evaluacion]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { evaluacion: updated } = await adminUpdateEvaluacion(evaluacion.id, perfilToPayload(form));
      onSaved(updated);
      setSuccess("Guardado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card eval-card" onSubmit={handleSubmit}>
      <PerfilFields form={form} setForm={setForm} serie={serie} />
      {error && <p className="contact-form__status is-error">{error}</p>}
      {success && <p className="contact-form__status is-success">{success}</p>}
      <div className="admin-post-form__actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar perfil y objetivos"}
        </button>
      </div>
    </form>
  );
}

function CrearEvaluacionForm({ clienteId, cliente, onCreated }) {
  const [perfilForm, setPerfilForm] = useState(() => perfilToForm(null));
  const perfil = perfilToPayload(perfilForm);

  async function handleSubmit(entryPayload) {
    const { evaluacion } = await adminCreateEvaluacion({
      clienteId,
      ...perfil,
      ...entryPayload,
      edad: entryPayload.edad ?? perfil.edad,
    });
    onCreated(evaluacion);
  }

  async function handleImportMany(entries) {
    const { evaluacion } = await adminCreateEvaluacion({ clienteId, ...perfil, historico: entries });
    onCreated(evaluacion);
  }

  return (
    <>
      <div className="card eval-card">
        <p className="eval-hint eval-hint--lead">
          Este cliente todavía no tiene evaluaciones. Completá su perfil y cargá la primera.
        </p>
        <PerfilFields form={perfilForm} setForm={setPerfilForm} />
      </div>
      <EvaluacionEntryForm
        perfil={perfil}
        initial={emptyEntryForm("")}
        submitLabel="Crear evaluación"
        onSubmit={handleSubmit}
        onImportMany={handleImportMany}
        onPerfilCsv={(datos) => setPerfilForm((prev) => mergeCsvIntoPerfilForm(prev, datos))}
        cliente={cliente}
      />
    </>
  );
}

function HistoricoTable({ serie, onEdit, onDelete, busyId }) {
  const ordenada = [...serie].reverse();
  return (
    <div className="admin-table-wrapper">
      <table className="admin-table eval-table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Fecha</th>
            <th>Peso</th>
            <th>% Grasa</th>
            <th>Masa magra</th>
            <th>Σ Pliegues</th>
            <th>Cintura</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {ordenada.map((p) => (
            <tr key={p.id}>
              <td>{p.numero}</td>
              <td>{fmtFecha(p.fecha)}</td>
              <td>{fmt(p.c.peso, 1)} kg</td>
              <td>{p.c.porcentajeGrasa !== null ? `${fmt(p.c.porcentajeGrasa, 1)} %` : "–"}</td>
              <td>{p.c.masaMagra !== null ? `${fmt(p.c.masaMagra, 1)} kg` : "–"}</td>
              <td>{p.c.sumaPliegues !== null ? `${fmt(p.c.sumaPliegues, 0)} mm` : "–"}</td>
              <td>{p.perimetros?.cintura ? `${fmt(p.perimetros.cintura, 1)} cm` : "–"}</td>
              <td className="admin-table__actions">
                <button type="button" className="btn btn-outline" onClick={() => onEdit(p)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  disabled={busyId === p.id || serie.length === 1}
                  title={serie.length === 1 ? "Es la única evaluación del cliente" : undefined}
                  onClick={() => onDelete(p)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EvaluacionAdmin({ clienteId }) {
  const [cliente, setCliente] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready
  const [error, setError] = useState("");
  // null = listado; "nueva" = alta; objeto = edición de ese registro.
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [listError, setListError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([adminGetCliente(clienteId), adminGetEvaluacionByCliente(clienteId)])
      .then(([clienteRes, evaluacionRes]) => {
        if (!active) return;
        setCliente(clienteRes.cliente);
        setEvaluacion(evaluacionRes.evaluacion);
        setStatus("ready");
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setStatus("ready");
        }
      });
    return () => {
      active = false;
    };
  }, [clienteId]);

  const serie = useMemo(() => construirSerie(evaluacion), [evaluacion]);
  const fechasExistentes = useMemo(
    () => new Set(serie.map((p) => toDateInputValue(p.fecha_evaluacion))),
    [serie]
  );

  if (status === "loading") return <p>Cargando…</p>;
  if (error) return <p className="contact-form__status is-error">{error}</p>;

  const ultima = serie[serie.length - 1];

  async function handleDelete(punto) {
    if (!window.confirm(`¿Eliminar la evaluación del ${fmtFecha(punto.fecha)}? No se puede deshacer.`)) return;
    setBusyId(punto.id);
    setListError("");
    try {
      const { evaluacion: updated } = await adminDeleteHistoricoEvaluacion(evaluacion.id, punto.id);
      setEvaluacion(updated);
    } catch (err) {
      setListError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Si el CSV traía datos de perfil, se actualizan antes que el historial
  // (la edad del perfil es la que hereda un registro sin edad propia).
  async function guardarPerfilCsv(perfilCsv) {
    if (!perfilCsv || Object.keys(perfilCsv).length === 0) return;
    await adminUpdateEvaluacion(evaluacion.id, csvPerfilToPayload(perfilCsv));
  }

  async function handleImportMany(entries, perfilCsv) {
    await guardarPerfilCsv(perfilCsv);
    const res = await adminImportHistoricoEvaluacion(evaluacion.id, entries);
    setEvaluacion(res.evaluacion);
    setEditing(null);
  }

  async function handleSaveEntry(payload, perfilCsv) {
    await guardarPerfilCsv(perfilCsv);
    const res =
      editing === "nueva"
        ? await adminAddHistoricoEvaluacion(evaluacion.id, payload)
        : await adminUpdateHistoricoEvaluacion(evaluacion.id, editing.id, payload);
    setEvaluacion(res.evaluacion);
    setEditing(null);
  }

  return (
    <>
      <p className="section-subtitle eval-cliente">
        {cliente?.nombre} {cliente?.apellido} · {cliente?.email}
      </p>

      {!evaluacion && <CrearEvaluacionForm clienteId={clienteId} cliente={cliente} onCreated={setEvaluacion} />}

      {evaluacion && editing && (
        <>
          <div className="eval-section-head">
            <h2>
              {editing === "nueva"
                ? `Nueva evaluación (N° ${serie.length + 1})`
                : `Editar evaluación N° ${editing.numero} · ${fmtFecha(editing.fecha)}`}
            </h2>
          </div>
          <EvaluacionEntryForm
            perfil={evaluacion}
            initial={editing === "nueva" ? emptyEntryForm(evaluacion.edad) : entryToForm(editing)}
            previous={
              editing === "nueva" ? ultima : serie[serie.findIndex((p) => p.id === editing.id) - 1]
            }
            submitLabel={editing === "nueva" ? "Guardar evaluación" : "Guardar cambios"}
            onSubmit={handleSaveEntry}
            onCancel={() => setEditing(null)}
            onImportMany={editing === "nueva" ? handleImportMany : undefined}
            fechasExistentes={fechasExistentes}
            cliente={cliente}
          />
        </>
      )}

      {evaluacion && !editing && (
        <>
          <div className="eval-section-head">
            <h2>Evaluaciones</h2>
            <button type="button" className="btn btn-primary" onClick={() => setEditing("nueva")}>
              + Nueva evaluación
            </button>
          </div>
          {listError && <p className="contact-form__status is-error">{listError}</p>}
          <HistoricoTable serie={serie} onEdit={setEditing} onDelete={handleDelete} busyId={busyId} />

          <div className="eval-section-head">
            <h2>Perfil y objetivos</h2>
          </div>
          <PerfilForm key={evaluacion.updatedAt} evaluacion={evaluacion} onSaved={setEvaluacion} />
        </>
      )}
    </>
  );
}
