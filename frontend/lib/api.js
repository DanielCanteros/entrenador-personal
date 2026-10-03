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

// revalidate es solo la red de seguridad: la invalidación real ocurre al
// instante vía el tag "posts" cuando el backend avisa a /api/revalidate
// (ver posts.routes.js -> triggerPostsRevalidate y app/api/revalidate).
export function getPosts({ locale = "es", page = 1, limit = 9, tag } = {}) {
  const params = new URLSearchParams({ locale, page: String(page), limit: String(limit) });
  if (tag) params.set("tag", tag);
  return request(`/api/posts?${params.toString()}`, {
    next: { revalidate: 3600, tags: ["posts"] },
  });
}

export function getPost(slug, locale = "es") {
  const params = new URLSearchParams({ locale });
  return request(`/api/posts/${encodeURIComponent(slug)}?${params.toString()}`, {
    next: { revalidate: 3600, tags: ["posts"] },
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

// --- Admin: clientes ---

export function adminListClientes() {
  return request("/api/clientes", { cache: "no-store" });
}

export function adminGetCliente(id) {
  return request(`/api/clientes/${id}`, { cache: "no-store" });
}

export function adminCreateCliente(payload) {
  return request("/api/clientes", { method: "POST", body: payload, cache: "no-store" });
}

export function adminUpdateCliente(id, payload) {
  return request(`/api/clientes/${id}`, { method: "PATCH", body: payload, cache: "no-store" });
}

export function adminDeleteCliente(id) {
  return request(`/api/clientes/${id}`, { method: "DELETE", cache: "no-store" });
}

export function adminResendClienteInvite(id) {
  return request(`/api/clientes/${id}/reenviar`, { method: "POST", cache: "no-store" });
}

// --- Público: registro de clientes (vía link del email) ---

export function getClienteRegistration(token) {
  return request(`/api/clientes/registro/${encodeURIComponent(token)}`, { cache: "no-store" });
}

export function completeClienteRegistration(token, payload) {
  return request(`/api/clientes/registro/${encodeURIComponent(token)}`, {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

// --- Cliente: auth y perfil ---

export function clienteLogin(email, password) {
  return request("/api/cliente-auth/login", { method: "POST", body: { email, password }, cache: "no-store" });
}

export function clienteLogout() {
  return request("/api/cliente-auth/logout", { method: "POST", cache: "no-store" });
}

export function clienteMe() {
  return request("/api/cliente-auth/me", { cache: "no-store" });
}

export function clienteUpdateProfile(payload) {
  return request("/api/cliente-auth/me", { method: "PATCH", body: payload, cache: "no-store" });
}

export function clienteChangePassword(payload) {
  return request("/api/cliente-auth/password", { method: "PATCH", body: payload, cache: "no-store" });
}

export function clienteGetEvaluacion() {
  return request("/api/cliente-auth/evaluacion", { cache: "no-store" });
}

// --- Admin: evaluaciones ---

export function adminGetEvaluacionByCliente(clienteId) {
  return request(`/api/evaluaciones/cliente/${clienteId}`, { cache: "no-store" });
}

export function adminCreateEvaluacion(payload) {
  return request("/api/evaluaciones", { method: "POST", body: payload, cache: "no-store" });
}

export function adminUpdateEvaluacion(id, payload) {
  return request(`/api/evaluaciones/${id}`, { method: "PATCH", body: payload, cache: "no-store" });
}

export function adminAddHistoricoEvaluacion(id, payload) {
  return request(`/api/evaluaciones/${id}/historico`, { method: "POST", body: payload, cache: "no-store" });
}

export function adminImportHistoricoEvaluacion(id, entries) {
  return request(`/api/evaluaciones/${id}/historico/lote`, {
    method: "POST",
    body: { entries },
    cache: "no-store",
  });
}

export function adminUpdateHistoricoEvaluacion(id, entryId, payload) {
  return request(`/api/evaluaciones/${id}/historico/${entryId}`, {
    method: "PATCH",
    body: payload,
    cache: "no-store",
  });
}

export function adminDeleteHistoricoEvaluacion(id, entryId) {
  return request(`/api/evaluaciones/${id}/historico/${entryId}`, { method: "DELETE", cache: "no-store" });
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
