"use client";

import { useRef, useState } from "react";
import { PERIMETROS, PLIEGUES } from "../../lib/composicion.js";
import { entryParaApi, leerEvaluacionesCsv, nombreCoincide, plantillaCsv } from "../../lib/evaluacionCsv.js";
import { fmt, fmtFecha } from "../../lib/formato.js";

// Excel en Windows guarda los CSV en Windows-1252 salvo que se elija
// "CSV UTF-8": se prueba UTF-8 y, si no es válido, se cae a 1252.
async function leerTexto(file) {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function descargarPlantilla() {
  const blob = new Blob(["﻿", plantillaCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla-evaluaciones.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function contar(obj) {
  return Object.values(obj).filter((v) => v !== null && v !== undefined).length;
}

function describirPerfil(perfil) {
  const partes = [];
  if (perfil.sexo) partes.push(perfil.sexo === "M" ? "sexo masculino" : "sexo femenino");
  if (perfil.edad != null) partes.push(`edad ${fmt(perfil.edad, 0)} años`);
  if (perfil.estatura != null) partes.push(`estatura ${fmt(perfil.estatura, 0)} cm`);
  if (perfil.grasa_ideal != null) partes.push(`% grasa ideal ${fmt(perfil.grasa_ideal, 1)} %`);
  return partes.join(", ");
}

// Avisos comunes a la carga de una fila o de varias.
function avisosArchivo(leido, cliente) {
  const avisos = [];
  const ajenos = leido.nombres.filter((n) => !nombreCoincide(n, cliente));
  if (ajenos.length) avisos.push(`El archivo es de ${ajenos.join(", ")}: verificá que sea de este cliente.`);
  const perfil = describirPerfil(leido.perfil);
  if (perfil) avisos.push(`Perfil del cliente: ${perfil} (se guarda junto con la evaluación).`);
  if (leido.calculadas.length) {
    avisos.push(`Se recalculan a partir de las medidas: ${leido.calculadas.join(", ")}.`);
  }
  if (leido.ignoradas.length) avisos.push(`Columnas ignoradas: ${leido.ignoradas.join(", ")}.`);
  return avisos;
}

/**
 * Carga de evaluaciones desde un CSV.
 * - `onPrefill(entry)`: vuelca una fila en el formulario para revisarla.
 * - `onImportMany(entries)`: guarda varias filas de una vez (opcional).
 * - `onPerfil(perfil)`: sexo, edad, estatura y % grasa ideal del archivo.
 * - `existentes`: fechas (AAAA-MM-DD) ya cargadas; esas filas se omiten al
 *   importar en lote para no duplicar el historial.
 * - `cliente`: para avisar si el nombre del archivo es de otra persona.
 */
export default function EvaluacionCsvImport({ onPrefill, onImportMany, onPerfil, existentes, cliente }) {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [aviso, setAviso] = useState("");
  const [notas, setNotas] = useState([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  function reset() {
    setArchivo("");
    setResultado(null);
    setAviso("");
    setNotas([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function usarFila(entry) {
    onPrefill(entry);
    setResultado(null);
    const problemas = entry.problemas.length ? ` Atención: ${entry.problemas.join("; ")}.` : "";
    setAviso(`Datos cargados desde ${archivo || "el archivo"} (fila ${entry.fila}). Revisalos y guardá.${problemas}`);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAviso("");
    setNotas([]);
    setError("");
    setArchivo(file.name);
    try {
      const leido = leerEvaluacionesCsv(await leerTexto(file));
      if (leido.errores.length) {
        setError(leido.errores.join(" "));
        setResultado(null);
        return;
      }
      if (leido.entries.length === 0) {
        setError("El archivo no tiene filas con medidas.");
        setResultado(null);
        return;
      }
      if (onPerfil && Object.keys(leido.perfil).length) onPerfil(leido.perfil);
      setNotas(avisosArchivo(leido, cliente));
      // Una sola fila: directo al formulario, así se ven los resultados en vivo.
      if (leido.entries.length === 1) {
        onPrefill(leido.entries[0]);
        const problemas = leido.entries[0].problemas;
        setAviso(
          `Datos cargados desde ${file.name}. Revisalos y guardá.` +
            (problemas.length ? ` Atención: ${problemas.join("; ")}.` : "")
        );
        setResultado(null);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      setResultado(leido);
    } catch (err) {
      setError(`No se pudo leer el archivo: ${err.message}`);
    }
  }

  const filas = (resultado?.entries || []).map((entry) => {
    const duplicada = entry.fecha_evaluacion && existentes?.has(entry.fecha_evaluacion);
    return { entry, duplicada, importable: !entry.problemas.length && !duplicada };
  });
  const importables = filas.filter((f) => f.importable).map((f) => f.entry);

  async function handleImport() {
    setImporting(true);
    setError("");
    try {
      await onImportMany(importables.map(entryParaApi));
    } catch (err) {
      setError(err.message);
      setImporting(false);
    }
  }

  return (
    <div className="eval-csv">
      <div className="eval-csv__bar">
        <div>
          <p className="eval-csv__title">¿Tenés los resultados en un CSV?</p>
          <p className="eval-hint eval-csv__sub">
            Una fila por evaluación. Con una sola fila se completa el formulario; con varias se
            importan todas juntas.
          </p>
        </div>
        <div className="eval-csv__actions">
          <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()}>
            Subir CSV
          </button>
          <button type="button" className="eval-csv__link" onClick={descargarPlantilla}>
            Descargar plantilla
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="visually-hidden"
            tabIndex={-1}
            onChange={handleFile}
          />
        </div>
      </div>

      {aviso && <p className="contact-form__status is-success">{aviso}</p>}
      {notas.length > 0 && (
        <ul className="eval-csv__notas">
          {notas.map((nota) => (
            <li key={nota}>{nota}</li>
          ))}
        </ul>
      )}
      {error && <p className="contact-form__status is-error">{error}</p>}

      {resultado && (
        <div className="eval-csv__preview">
          <p className="eval-hint eval-hint--lead">
            <strong>{archivo}</strong>: {filas.length} evaluaciones encontradas.
          </p>
          <div className="admin-table-wrapper">
            <table className="admin-table eval-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Fecha</th>
                  <th>Peso</th>
                  <th>Pliegues</th>
                  <th>Perímetros</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {filas.map(({ entry, duplicada, importable }) => (
                  <tr key={entry.fila}>
                    <td>{entry.fila}</td>
                    <td>{entry.fecha_evaluacion ? fmtFecha(entry.fecha_evaluacion) : "–"}</td>
                    <td>{entry.peso !== null ? `${fmt(entry.peso, 1)} kg` : "–"}</td>
                    <td>
                      {contar(entry.pliegues)}/{PLIEGUES.length}
                    </td>
                    <td>
                      {contar(entry.perimetros)}/{PERIMETROS.length}
                    </td>
                    <td className={importable ? "eval-csv__ok" : "eval-csv__skip"}>
                      {entry.problemas.length
                        ? `Se omite: ${entry.problemas.join("; ")}`
                        : duplicada
                        ? "Se omite: ya hay una evaluación en esa fecha"
                        : "Lista"}
                    </td>
                    <td className="admin-table__actions">
                      <button type="button" className="btn btn-outline" onClick={() => usarFila(entry)}>
                        Usar en el formulario
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-post-form__actions">
            {onImportMany && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={importing || importables.length === 0}
                onClick={handleImport}
              >
                {importing
                  ? "Importando…"
                  : `Importar ${importables.length} ${importables.length === 1 ? "evaluación" : "evaluaciones"}`}
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={reset} disabled={importing}>
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
