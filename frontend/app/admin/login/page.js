"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../../../lib/api.js";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminLogin(form.email, form.password);
      router.push("/admin");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container admin-login">
      <form className="card admin-login__form" onSubmit={handleSubmit}>
        <h1>Panel de administración</h1>
        <p className="section-subtitle">Inicia sesión para gestionar el blog.</p>

        <label className="field">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        {error && <p className="contact-form__status is-error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
