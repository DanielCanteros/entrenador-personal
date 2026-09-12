"use client";

import { useEffect, useState } from "react";
import AdminGuard from "../../../components/admin/AdminGuard.js";
import AdminTopBar from "../../../components/admin/AdminTopBar.js";
import { adminListContacts, adminSetContactStatus } from "../../../lib/api.js";

const MODALITY_LABELS = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Ambos",
  "no-se": "Aún no lo sabe",
};

function ContactCardSkeleton() {
  return (
    <article className="card admin-contact-card" aria-hidden="true">
      <div className="admin-contact-card__header">
        <div className="skeleton skeleton-text--sm" style={{ width: "160px" }} />
      </div>
      <div className="skeleton skeleton-text skeleton-text--lg" />
      <div className="skeleton skeleton-text" />
    </article>
  );
}

function ContactCard({ submission, onToggleStatus }) {
  const isNew = submission.status === "new";

  return (
    <article className="card admin-contact-card">
      <div className="admin-contact-card__header">
        <div>
          <strong>{submission.name}</strong>{" "}
          <span className={`admin-badge admin-badge--${isNew ? "new" : "read"}`}>
            {isNew ? "Nuevo" : "Leído"}
          </span>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => onToggleStatus(submission)}>
          {isNew ? "Marcar como leído" : "Marcar como nuevo"}
        </button>
      </div>

      <div className="admin-contact-card__meta">
        <span>{new Date(submission.createdAt).toLocaleString("es-PY")}</span>
        <span>·</span>
        <a href={`mailto:${submission.email}`}>{submission.email}</a>
        {submission.phone && (
          <>
            <span>·</span>
            <span>{submission.phone}</span>
          </>
        )}
        <span>·</span>
        <span>{MODALITY_LABELS[submission.modality] || submission.modality}</span>
        <span>·</span>
        <span>{submission.locale?.toUpperCase()}</span>
      </div>

      <p className="admin-contact-card__message">{submission.message}</p>
    </article>
  );
}

export default function AdminContactsPage() {
  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { submissions } = await adminListContacts();
      setSubmissions(submissions);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleStatus(submission) {
    const nextStatus = submission.status === "new" ? "read" : "new";
    setSubmissions((prev) =>
      prev.map((item) => (item.id === submission.id ? { ...item, status: nextStatus } : item))
    );
    try {
      await adminSetContactStatus(submission.id, nextStatus);
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  return (
    <AdminGuard>
      <AdminTopBar title="Mensajes de contacto" />
      <div className="container admin-content">
        <div className="admin-content__header">
          <h1>Mensajes</h1>
        </div>

        {error && <p className="contact-form__status is-error">{error}</p>}

        {!submissions && !error && (
          <div className="admin-contacts">
            {Array.from({ length: 3 }).map((_, index) => (
              <ContactCardSkeleton key={index} />
            ))}
          </div>
        )}

        {submissions && submissions.length === 0 && <p>Todavía no llegó ningún mensaje.</p>}

        {submissions && submissions.length > 0 && (
          <div className="admin-contacts">
            {submissions.map((submission) => (
              <ContactCard key={submission.id} submission={submission} onToggleStatus={handleToggleStatus} />
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
