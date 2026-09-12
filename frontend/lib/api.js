import { siteConfig } from "../site.config.js";

const API_URL = siteConfig.apiUrl;

async function request(path, { method = "GET", body, cache, next, credentials } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: credentials ?? "include",
    cache,
    next,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const error = new Error(data?.error || `Error ${res.status} al llamar a ${path}`);
    error.status = res.status;
    throw error;
  }

  return data;
}

// --- Público: blog ---

export function getPosts({ locale = "es", page = 1, limit = 9, tag } = {}) {
  const params = new URLSearchParams({ locale, page: String(page), limit: String(limit) });
  if (tag) params.set("tag", tag);
  return request(`/api/posts?${params.toString()}`, {
    next: { revalidate: 60 },
  });
}

export function getPost(slug, locale = "es") {
  const params = new URLSearchParams({ locale });
  return request(`/api/posts/${encodeURIComponent(slug)}?${params.toString()}`, {
    next: { revalidate: 60 },
  });
}

// --- Público: contacto ---

export function submitContact(payload) {
  return request("/api/contact", { method: "POST", body: payload, cache: "no-store" });
}

// --- Admin: auth ---

export function adminLogin(email, password) {
  return request("/api/auth/login", { method: "POST", body: { email, password }, cache: "no-store" });
}

export function adminLogout() {
  return request("/api/auth/logout", { method: "POST", cache: "no-store" });
}

export function adminMe() {
  return request("/api/auth/me", { cache: "no-store" });
}

// --- Admin: posts ---

export function adminListPosts() {
  return request("/api/posts/admin/list", { cache: "no-store" });
}

export function adminGetPost(id) {
  return request(`/api/posts/admin/${id}`, { cache: "no-store" });
}

export function adminCreatePost(payload) {
  return request("/api/posts", { method: "POST", body: payload, cache: "no-store" });
}

export function adminUpdatePost(id, payload) {
  return request(`/api/posts/${id}`, { method: "PUT", body: payload, cache: "no-store" });
}

export function adminDeletePost(id) {
  return request(`/api/posts/${id}`, { method: "DELETE", cache: "no-store" });
}

export function adminCreateTranslation(id, locale) {
  return request(`/api/posts/${id}/translate`, { method: "POST", body: { locale }, cache: "no-store" });
}

// --- Admin: mensajes de contacto ---

export function adminListContacts() {
  return request("/api/contact", { cache: "no-store" });
}

export function adminSetContactStatus(id, status) {
  return request(`/api/contact/${id}`, { method: "PATCH", body: { status }, cache: "no-store" });
}

export async function adminUploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Error al subir la imagen");
  }
  return data;
}
