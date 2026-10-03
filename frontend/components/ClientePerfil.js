"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clienteChangePassword, clienteMe, clienteUpdateProfile } from "../lib/api.js";
import { CIUDADES_POR_PAIS } from "../lib/ciudades.js";

const emptyForm = { nombre: "", apellido: "", pais: "", ciudad: "", idioma: "es" };
const emptyPasswordForm = { currentPassword: "", newPassword: "", confirmNewPassword: "" };

export default function ClientePerfil() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | ready
  const [email, setEmail] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    let active = true;
    clienteMe()
      .then(({ cliente }) => {
        if (!active) return;
        setEmail(cliente.email);
        setForm({
          nombre: cliente.nombre || "",
          apellido: cliente.apellido || "",
          pais: cliente.pais || "",
          ciudad: cliente.ciudad || "",
          idioma: cliente.idioma || "es",
        });
        setStatus("ready");
      })
      .catch(() => {
        if (active) router.replace("/cuenta/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await clienteUpdateProfile(form);
      setSuccess("Tus datos se guardaron correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden");
      return;
    }

    setPasswordSaving(true);
    try {
      await clienteChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Tu contraseña se actualizó correctamente.");
      setPasswordForm(emptyPasswordForm);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  if (status === "loading") {
    return <p>Cargando…</p>;
  }

  return (
    <>
      <div className="admin-content__header">
        <h1>Mi perfil</h1>
      </div>

      <form className="card contact-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input value={email} disabled />
        </label>

        <div className="grid grid-2">
          <label className="field">
            <span>Nombre</span>
            <input name="nombre" value={form.nombre} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Apellido</span>
            <input name="apellido" value={form.apellido} onChange={handleChange} required />
          </label>
        </div>

        <div className="grid grid-2">
          <label className="field">
            <span>País</span>
            <select name="pais" value={form.pais} onChange={handleChange}>
              <option value="" disabled>
                Elegí un país
              </option>
              <option value="Paraguay">Paraguay</option>
              <option value="Brasil">Brasil</option>
            </select>
          </label>
          <label className="field">
            <span>Ciudad</span>
            <input name="ciudad" value={form.ciudad} onChange={handleChange} list="ciudades-sugeridas" />
            <datalist id="ciudades-sugeridas">
              {(CIUDADES_POR_PAIS[form.pais] || []).map((ciudad) => (
                <option key={ciudad} value={ciudad} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="field">
          <span>Idioma</span>
          <select name="idioma" value={form.idioma} onChange={handleChange}>
            <option value="es">Español</option>
            <option value="pt">Português</option>
          </select>
        </label>

        {error && <p className="contact-form__status is-error">{error}</p>}
        {success && <p className="contact-form__status is-success">{success}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <form className="card contact-form" onSubmit={handlePasswordSubmit} style={{ marginTop: "1.5rem" }}>
        <h2>Cambiar contraseña</h2>

        <label className="field">
          <span>Contraseña actual</span>
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="field">
          <span>Nueva contraseña</span>
          <input
            type="password"
            name="newPassword"
            minLength={8}
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
          />
        </label>

        <label className="field">
          <span>Confirmar nueva contraseña</span>
          <input
            type="password"
            name="confirmNewPassword"
            minLength={8}
            value={passwordForm.confirmNewPassword}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
          />
        </label>

        {passwordError && <p className="contact-form__status is-error">{passwordError}</p>}
        {passwordSuccess && <p className="contact-form__status is-success">{passwordSuccess}</p>}

        <button type="submit" className="btn btn-outline btn-block" disabled={passwordSaving}>
          {passwordSaving ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </form>
    </>
  );
}
