"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminCreatePost,
  adminCreateTranslation,
  adminDeletePost,
  adminGetPost,
  adminUpdatePost,
  adminUploadImage,
} from "../../lib/api.js";

const LOCALE_LABELS = { es: "Español", pt: "Português" };

const emptyPost = {
  title: "",
  slug: "",
  locale: "es",
  excerpt: "",
  content: "",
  tags: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  coverImage: { url: "", alt: "" },
};

export default function PostForm({ postId }) {
  const router = useRouter();
  const isEdit = Boolean(postId);
  const [form, setForm] = useState(emptyPost);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [translations, setTranslations] = useState([]);
  const [creatingTranslation, setCreatingTranslation] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    adminGetPost(postId).then(({ post }) => {
      setForm({
        ...post,
        tags: (post.tags || []).join(", "),
        coverImage: post.coverImage || { url: "", alt: "" },
      });
      setTranslations(post.translations || []);
      setLoading(false);
    });
  }, [isEdit, postId]);

  async function handleCreateTranslation(locale) {
    setCreatingTranslation(true);
    setError("");
    try {
      const { post: translation } = await adminCreateTranslation(postId, locale);
      router.push(`/admin/posts/${translation.id}/edit`);
    } catch (err) {
      setError(err.message);
      setCreatingTranslation(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await adminUploadImage(file);
      setForm((prev) => ({ ...prev, coverImage: { ...prev.coverImage, url } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit) {
        await adminUpdatePost(postId, payload);
      } else {
        await adminCreatePost(payload);
      }
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este artículo?")) return;
    await adminDeletePost(postId);
    router.push("/admin");
  }

  if (loading) return <p>Cargando artículo…</p>;

  return (
    <form className="card admin-post-form" onSubmit={handleSubmit}>
      {error && <p className="contact-form__status is-error">{error}</p>}

      {form.translatedByAI && form.status === "draft" && (
        <p className="admin-post-form__ai-notice">
          ⚠️ Este borrador se tradujo automáticamente (Google Translate). Revísalo con cuidado antes de publicarlo:
          la traducción automática puede tener errores de matiz o de terminología técnica.
        </p>
      )}

      <div className="grid grid-2">
        <label className="field">
          <span>Título</span>
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>Slug (URL, opcional: se genera del título)</span>
          <input name="slug" value={form.slug} onChange={handleChange} />
        </label>
      </div>

      <div className="grid grid-2">
        <label className="field">
          <span>Idioma</span>
          <select name="locale" value={form.locale} onChange={handleChange}>
            <option value="es">Español</option>
            <option value="pt">Português</option>
          </select>
        </label>
        <label className="field">
          <span>Estado</span>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </label>
      </div>

      {isEdit && (
        <div className="field admin-post-form__translations">
          <span>Traducciones</span>
          <div className="admin-post-form__translations-list">
            {Object.keys(LOCALE_LABELS)
              .filter((loc) => loc !== form.locale)
              .map((loc) => {
                const existing = translations.find((tr) => tr.locale === loc);
                if (existing) {
                  return (
                    <Link key={loc} href={`/admin/posts/${existing.id}/edit`} className="btn btn-outline">
                      Editar {LOCALE_LABELS[loc]}
                      {existing.status === "draft" ? " (borrador)" : ""}
                    </Link>
                  );
                }
                return (
                  <button
                    key={loc}
                    type="button"
                    className="btn btn-outline"
                    disabled={creatingTranslation}
                    onClick={() => handleCreateTranslation(loc)}
                  >
                    {creatingTranslation ? "Traduciendo…" : `+ Traducir automáticamente a ${LOCALE_LABELS[loc]}`}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      <label className="field">
        <span>Extracto (resumen corto, máx. 300 caracteres)</span>
        <textarea name="excerpt" rows={2} maxLength={300} value={form.excerpt} onChange={handleChange} required />
      </label>

      <label className="field">
        <span>Contenido (Markdown)</span>
        <textarea name="content" rows={14} value={form.content} onChange={handleChange} required />
      </label>

      <label className="field">
        <span>Etiquetas (separadas por coma)</span>
        <input name="tags" value={form.tags} onChange={handleChange} placeholder="entrenamiento, fuerza" />
      </label>

      <div className="field">
        <span>Imagen de portada</span>
        {form.coverImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.coverImage.url} alt="" className="admin-post-form__cover-preview" />
        )}
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
        {uploading && <p>Subiendo imagen…</p>}
      </div>

      <label className="field">
        <span>Texto alternativo de la portada</span>
        <input
          value={form.coverImage?.alt || ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, coverImage: { ...prev.coverImage, alt: e.target.value } }))
          }
        />
      </label>

      <div className="grid grid-2">
        <label className="field">
          <span>Título SEO (opcional)</span>
          <input name="seoTitle" value={form.seoTitle} onChange={handleChange} />
        </label>
        <label className="field">
          <span>Descripción SEO (opcional, máx. 200 caracteres)</span>
          <input name="seoDescription" maxLength={200} value={form.seoDescription} onChange={handleChange} />
        </label>
      </div>

      <div className="admin-post-form__actions">
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {isEdit && (
          <button type="button" className="btn btn-outline" onClick={handleDelete}>
            Eliminar artículo
          </button>
        )}
      </div>
    </form>
  );
}
