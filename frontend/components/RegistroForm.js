"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clienteLogin, completeClienteRegistration, getClienteRegistration } from "../lib/api.js";
import { CIUDADES_POR_PAIS } from "../lib/ciudades.js";

export default function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState("loading"); // loading | ready | invalid | submitting | done | error
  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    password: "",
    confirmPassword: "",
    pais: "",
    ciudad: "",
    idioma: "es",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let active = true;
    getClienteRegistration(token)
      .then((data) => {
        if (!active) return;
        setInvite(data);
        setForm((prev) => ({
          ...prev,
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          pais: data.pais || "",
          ciudad: data.ciudad || "",
          idioma: data.idioma || "es",
        }));
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("invalid");
      });
    return () => {
      active = false;
    };
  }, [token]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setStatus("submitting");
    try {
      await completeClienteRegistration(token, {
        nombre: form.nombre,
        apellido: form.apellido,
        password: form.password,
        pais: form.pais,
        ciudad: form.ciudad,
        idioma: form.idioma,
      });

      // Registro completo: lo dejamos directamente logueado en su perfil.
      try {
        await clienteLogin(invite.email, form.password);
        router.push("/cuenta");
        return;
      } catch {
        setStatus("done");
      }
    } catch (err) {
      setError(err.message);
      setStatus("ready");
    }
  }

  if (status === "loading") {
    return <p>Cargando…</p>;
  }

  if (status === "invalid") {
    return <p className="contact-form__status is-error">Este enlace de registro no es válido o expiró. Pedile al entrenador que te reenvíe la invitación.</p>;
  }

  if (status === "done") {
    return (
      <p className="contact-form__status is-success">
        ¡Listo! Tu registro se completó correctamente. Ingresá a{" "}
        <a href="/cuenta/login">tu cuenta</a> con tu email y contraseña.
      </p>
    );
  }

  return (
    <form className="card contact-form" onSubmit={handleSubmit}>
      <p>
        Completá tu registro para <strong>{invite?.email}</strong>.
      </p>

      <div className="grid grid-2">
        <label className="field">
          <span>Nombre</span>
          <input name="nombre" value={form.nombre} onChange={handleChange} autoComplete="given-name" required />
        </label>
        <label className="field">
          <span>Apellido</span>
          <input
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            autoComplete="family-name"
            required
          />
        </label>
      </div>

      <div className="grid grid-2">
        <label className="field">
          <span>País</span>
          <select name="pais" value={form.pais} onChange={handleChange} autoComplete="country-name" required>
            <option value="" disabled>
              Elegí un país
            </option>
            <option value="Paraguay">Paraguay</option>
            <option value="Brasil">Brasil</option>
          </select>
        </label>
        <label className="field">
          <span>Ciudad</span>
          <input
            name="ciudad"
            value={form.ciudad}
            onChange={handleChange}
            autoComplete="address-level2"
            list="ciudades-sugeridas"
          />
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

      <label className="field">
        <span>Contraseña</span>
        <input
          type="password"
          name="password"
          minLength={8}
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />
      </label>

      <label className="field">
        <span>Confirmar contraseña</span>
        <input
          type="password"
          name="confirmPassword"
          minLength={8}
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />
      </label>

      {error && <p className="contact-form__status is-error">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === "submitting"}>
        {status === "submitting" ? "Guardando…" : "Completar registro"}
      </button>
    </form>
  );
}
