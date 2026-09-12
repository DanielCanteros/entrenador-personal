"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "../../components/admin/AdminGuard.js";
import AdminTopBar from "../../components/admin/AdminTopBar.js";
import { adminDeletePost, adminListPosts } from "../../lib/api.js";

function PostsTable() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { posts } = await adminListPosts();
      setPosts(posts);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este artículo? Esta acción no se puede deshacer.")) return;
    await adminDeletePost(id);
    load();
  }

  if (error) return <p className="contact-form__status is-error">{error}</p>;

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table admin-table--skeleton">
        <thead>
          <tr>
            <th>Título</th>
            <th>Idioma</th>
            <th>Estado</th>
            <th>Actualizado</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {!posts &&
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} aria-hidden="true">
                <td><div className="skeleton skeleton-text skeleton-text--lg" /></td>
                <td><div className="skeleton skeleton-text skeleton-text--sm" /></td>
                <td><div className="skeleton skeleton-text skeleton-text--sm" /></td>
                <td><div className="skeleton skeleton-text skeleton-text--sm" /></td>
                <td />
              </tr>
            ))}
          {posts &&
            posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.locale.toUpperCase()}</td>
                <td>
                  <span className={`admin-badge admin-badge--${post.status}`}>
                    {post.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </td>
                <td>{new Date(post.updatedAt).toLocaleDateString("es-PY")}</td>
                <td className="admin-table__actions">
                  <Link href={`/admin/posts/${post.id}/edit`} className="btn btn-outline">
                    Editar
                  </Link>
                  <button type="button" className="btn btn-dark" onClick={() => handleDelete(post.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          {posts && posts.length === 0 && (
            <tr>
              <td colSpan={5}>Todavía no hay artículos. Crea el primero.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminTopBar title="Artículos del blog" />
      <div className="container admin-content">
        <div className="admin-content__header">
          <h1>Artículos</h1>
          <Link href="/admin/posts/new" className="btn btn-primary">
            + Nuevo artículo
          </Link>
        </div>
        <PostsTable />
      </div>
    </AdminGuard>
  );
}
