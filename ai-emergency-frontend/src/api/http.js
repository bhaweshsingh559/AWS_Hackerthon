// src/api/http.js
// Centralized HTTP helper for the frontend.

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "") || "";

export async function safeFetch(pathOrUrl, opts = {}) {
  const url = pathOrUrl.startsWith("http") || API_BASE === "" ? pathOrUrl : `${API_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
  const token = localStorage.getItem("token");
  const headers = {
    ...(opts.headers || {}),
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchOpts = {
    method: opts.method || "GET",
    headers,
    credentials: opts.credentials || "same-origin",
    body: opts.body ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    signal: opts.signal,
  };

  const res = await fetch(url, fetchOpts);

  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
  }

  if (!res.ok) {
    const err = new Error(json?.error || json || text || res.statusText || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json || text;
    throw err;
  }

  return json ?? text;
}

export async function postLogin(body) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json;
}

export async function postRegister(body) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function doLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}


export async function getMe() {
  return await safeFetch("/api/auth/me", { method: "GET" });
}

export async function postAnalyze(payload) {
  return await safeFetch("/api/emergency/analyze", { method: "POST", body: payload });
}

export async function postClassifyIncident(payload) {
  return await safeFetch("/api/emergency/classify", { method: "POST", body: payload });
}

export async function postAlert(payload) {
  return await safeFetch("/api/emergency/alert", { method: "POST", body: payload });
}

export async function postUserContacts(contactsArr = []) {
  return await safeFetch("/api/user/contacts", { method: "POST", body: { contacts: contactsArr } });
}


export async function postUpdateProfile(updates = {}) {
  return await safeFetch("/api/user/profile", { method: "POST", body: updates });
}

export async function getDashboardOverview() {
  return await safeFetch("/api/dashboard/overview", { method: "GET" });
}

export async function getDashboardActivity() {
  return await safeFetch("/api/dashboard/activity", { method: "GET" });
}

export { API_BASE };
