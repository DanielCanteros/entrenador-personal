"use client";

import { useEffect, useState } from "react";
import {
  adminAddHistoricoEvaluacion,
  adminCreateEvaluacion,
  adminGetCliente,
  adminGetEvaluacionByCliente,
  adminUpdateEvaluacion,
  adminUpdateHistoricoEvaluacion,
} from "../../lib/api.js";

function toDateInputValue(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toISOString().slice(0, 10);
}

function HistoricoRow({ entry, evaluacionId, onSaved }) {
  const [peso, setPeso] = useState(entry.peso);
  const [fecha, setFecha] = useState(toDateInputValue(entry.fecha_evaluacion));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const { evaluacion } = await adminUpdateHistoricoEvaluacion(evaluacionId, entry.id, {
        peso: Number(peso),
        fecha_evaluacion: fecha,
      });
      onSaved(evaluacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </td>
      <td>
        <input
          type="number"
          step="0.1"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          style={{ width: "90px" }}
        />{" "}
        kg
      </td>
      <td>
        <button type="button" className="btn btn-outline" disabled={saving} onClick={handleSave}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {error && <p className="contact-form__status is-error">{error}</p>}
      </td>
    </tr>
  );
}

function NuevaEvaluacionRow({ evaluacionId, onAdded }) {
  const [peso, setPeso] = useState("");
  const [fecha, setFecha] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!peso || !fecha) {
      setError("Completá peso y fecha");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { evaluacion } = await adminAddHistoricoEvaluacion(evaluacionId, {
        peso: Number(peso),
        fecha_evaluacion: fecha,
      });
      onAdded(evaluacion);
      setPeso("");
      setFecha("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </td>
      <td>
        <input
          type="number"
          step="0.1"
          placeholder="Peso (kg)"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          style={{ width: "90px" }}
        />
      </td>
      <td>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={handleAdd}>
          {saving ? "Agregando…" : "+ Agregar evaluación"}
        </button>
        {error && <p className="contact-form__status is-error">{error}</p>}
      </td>
    </tr>
  );
}

function DatosBasicosForm({ evaluacion, onSaved }) {
  const [edad, setEdad] = useState(evaluacion.edad ?? "");
  const [estatura, setEstatura] = useState(evaluacion.estatura ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { evaluacion: updated } = await adminUpdateEvaluacion(evaluacion.id, {
        edad: edad === "" ? null : Number(edad),
        estatura: estatura === "" ? null : Number(estatura),
      });
      onSaved(updated);
      setSuccess("Guardado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card admin-post-form" onSubmit={handleSubmit}>
      <div className="grid grid-2">
        <label className="field">
          <span>Edad</span>
          <input type="number" value={edad} onChange={(e) => setEdad(e.target.value)} />
        </label>
        <label className="field">
          <span>Estatura (cm)</span>
          <input type="number" value={estatura} onChange={(e) => setEstatura(e.target.value)} />
        </label>
      </div>

      {error && <p className="contact-form__status is-error">{error}</p>}
      {success && <p className="contact-form__status is-success">{success}</p>}

      <div className="admin-post-form__actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function CrearEvaluacionForm({ clienteId, onCreated }) {
  const [form, setForm] = useState({ edad: "", estatura: "", peso: "", fecha_evaluacion: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { evaluacion } = await adminCreateEvaluacion({
        clienteId,
        edad: form.edad === "" ? null : Number(form.edad),
        estatura: form.estatura === "" ? null : Number(form.estatura),
        peso: Number(form.peso),
        fecha_evaluacion: form.fecha_evaluacion,
      });
      onCreated(evaluacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card admin-post-form" onSubmit={handleSubmit}>
      <p className="section-subtitle">Este cliente todavía no tiene una evaluación. Cargá la primera.</p>

      <div className="grid grid-2">
        <label className="field">
          <span>Edad</span>
          <input type="number" name="edad" value={form.edad} onChange={handleChange} />
        </label>
        <label className="field">
          <span>Estatura (cm)</span>
          <input type="number" name="estatura" value={form.estatura} onChange={handleChange} />
        </label>
      </div>

      <div className="grid grid-2">
        <label className="field">
          <span>Peso (kg)</span>
          <input type="number" step="0.1" name="peso" value={form.peso} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>Fecha de evaluación</span>
          <input
            type="date"
            name="fecha_evaluacion"
            value={form.fecha_evaluacion}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      {error && <p className="contact-form__status is-error">{error}</p>}

      <div className="admin-post-form__actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Creando…" : "Crear evaluación"}
        </button>
      </div>
    </form>
  );
}

export default function EvaluacionAdmin({ clienteId }) {
  const [cliente, setCliente] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready
  const [error, setError] = useState("");

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

  if (status === "loading") return <p>Cargando…</p>;
  if (error) return <p className="contact-form__status is-error">{error}</p>;

  const historico = [...(evaluacion?.historico_evaluacion || [])].sort(
    (a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion)
  );

  return (
    <>
      <p className="section-subtitle">
        {cliente?.nombre} {cliente?.apellido} · {cliente?.email}
      </p>

      {!evaluacion && <CrearEvaluacionForm clienteId={clienteId} onCreated={setEvaluacion} />}

      {evaluacion && (
        <>
          <DatosBasicosForm evaluacion={evaluacion} onSaved={setEvaluacion} />

          <div className="card admin-post-form" style={{ marginTop: "1.5rem" }}>
            <h2>Histórico de peso</h2>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha de evaluación</th>
                    <th>Peso</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {historico.map((entry) => (
                    <HistoricoRow key={entry.id} entry={entry} evaluacionId={evaluacion.id} onSaved={setEvaluacion} />
                  ))}
                  <NuevaEvaluacionRow evaluacionId={evaluacion.id} onAdded={setEvaluacion} />
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
