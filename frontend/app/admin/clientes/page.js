"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "../../../components/admin/AdminGuard.js";
import AdminTopBar from "../../../components/admin/AdminTopBar.js";
import {
  adminDeleteCliente,
  adminListClientes,
  adminResendClienteInvite,
  adminUpdateCliente,
} from "../../../lib/api.js";

function estadoCliente(cliente) {
  if (!cliente.fechaIngreso) return { label: "Pendiente", badge: "draft" };
  if (cliente.clienteActivo) return { label: "Activo", badge: "published" };
  return { label: "Inactivo", badge: "draft" };
}

function ClientesTable({ clientes, onDelete, onToggleActivo, onResend, busyId }) {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>País / Ciudad</th>
            <th>Idioma</th>
            <th>Estado</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => {
            const estado = estadoCliente(cliente);
            const pending = !cliente.fechaIngreso;
            return (
              <tr key={cliente.id}>
                <td>
                  {cliente.nombre} {cliente.apellido}
                </td>
                <td>
                  <a href={`mailto:${cliente.email}`}>{cliente.email}</a>
                </td>
                <td>{[cliente.pais, cliente.ciudad].filter(Boolean).join(" · ") || "—"}</td>
                <td>{cliente.idioma?.toUpperCase()}</td>
                <td>
                  <span className={`admin-badge admin-badge--${estado.badge}`}>{estado.label}</span>
                </td>
                <td className="admin-table__actions">
                  <Link href={`/admin/clientes/${cliente.id}/evaluacion`} className="btn btn-outline">
                    Evaluación
                  </Link>
                  {pending && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busyId === cliente.id}
                      onClick={() => onResend(cliente)}
                    >
                      Reenviar invitación
                    </button>
                  )}
                  {!pending && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busyId === cliente.id}
                      onClick={() => onToggleActivo(cliente)}
                    >
                      {cliente.clienteActivo ? "Desactivar" : "Activar"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-dark"
                    disabled={busyId === cliente.id}
                    onClick={() => onDelete(cliente)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
          {clientes.length === 0 && (
            <tr>
              <td colSpan={6}>Todavía no hay clientes. Crea el primero.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const { clientes } = await adminListClientes();
      setClientes(clientes);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(cliente) {
    if (!confirm(`¿Eliminar a ${cliente.nombre} ${cliente.apellido}? Esta acción no se puede deshacer.`)) return;
    setBusyId(cliente.id);
    try {
      await adminDeleteCliente(cliente.id);
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActivo(cliente) {
    setBusyId(cliente.id);
    try {
      const { cliente: updated } = await adminUpdateCliente(cliente.id, {
        clienteActivo: !cliente.clienteActivo,
      });
      setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleResend(cliente) {
    setBusyId(cliente.id);
    setError("");
    try {
      await adminResendClienteInvite(cliente.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminGuard>
      <AdminTopBar title="Clientes" />
      <div className="container admin-content">
        <div className="admin-content__header">
          <h1>Clientes</h1>
          <Link href="/admin/clientes/nuevo" className="btn btn-primary">
            + Nuevo cliente
          </Link>
        </div>

        {error && <p className="contact-form__status is-error">{error}</p>}

        {!clientes && !error && (
          <div className="admin-table-wrapper">
            <table className="admin-table admin-table--skeleton">
              <tbody>
                {Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} aria-hidden="true">
                    <td><div className="skeleton skeleton-text skeleton-text--lg" /></td>
                    <td><div className="skeleton skeleton-text" /></td>
                    <td><div className="skeleton skeleton-text--sm" /></td>
                    <td><div className="skeleton skeleton-text--sm" /></td>
                    <td><div className="skeleton skeleton-text--sm" /></td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {clientes && (
          <ClientesTable
            clientes={clientes}
            onDelete={handleDelete}
            onToggleActivo={handleToggleActivo}
            onResend={handleResend}
            busyId={busyId}
          />
        )}
      </div>
    </AdminGuard>
  );
}
