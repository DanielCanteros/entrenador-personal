"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateCliente } from "../../lib/api.js";

const emptyCliente = { nombre: "", email: "" };

export default function ClienteForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyCliente);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setEmailWarning("");
    try {
      const { emailError } = await adminCreateCliente(form);
      if (emailError) {
        // El cliente ya se creó igual: el admin puede reintentar el envío
        // desde el listado con "Reenviar invitación".
        setEmailWarning(
          `El cliente se creó, pero no se pudo enviar el email de invitación (${emailError}). Podés reintentarlo desde el listado.`
        );
        setSaving(false);
        return;
      }
      router.push("/admin/clientes");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="card admin-post-form" onSubmit={handleSubmit}>
      {error && <p className="contact-form__status is-error">{error}</p>}
      {emailWarning && <p className="contact-form__status is-error">{emailWarning}</p>}

      <label className="field">
        <span>Nombre</span>
        <input name="nombre" value={form.nombre} onChange={handleChange} required />
      </label>

      <label className="field">
        <span>Email</span>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />
      </label>

      <p className="section-subtitle">
        Al guardar se le enviará un email con un enlace para que complete el resto de sus datos (apellido, país,
        ciudad, idioma) y elija su contraseña.
      </p>

      <div className="admin-post-form__actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Crear cliente e invitar"}
        </button>
      </div>
    </form>
  );
}
