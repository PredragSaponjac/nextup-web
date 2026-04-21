/* =============================================================
   NextUp — API Client
   Authenticated fetch wrapper + login helper.
   Reads API_URL from window.NEXTUP_CONFIG.
   ============================================================= */

/** Authenticated fetch wrapper. Injects JWT, handles JSON + error extraction. */
window.apiFetch = async function (endpoint, opts = {}) {
  const API = window.NEXTUP_CONFIG.API_URL;
  const headers = opts.headers || {};
  if (window.state && window.state.token) {
    headers["Authorization"] = `Bearer ${window.state.token}`;
  }
  if (opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API}${endpoint}`, { ...opts, headers });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (typeof err.detail === 'string') detail = err.detail;
      else if (Array.isArray(err.detail)) detail = err.detail.map(e => e.msg || e).join(', ');
      else if (err.detail) detail = JSON.stringify(err.detail);
    } catch (_) {}
    // 401 → clear session and redirect to auth
    if (res.status === 401) {
      window.clearSession && window.clearSession();
      window.navigate && window.navigate("role-select");
    }
    throw new Error(detail);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

/** Login — backend expects OAuth2 form-encoded username/password. */
window.apiLogin = async function (email, password) {
  const API = window.NEXTUP_CONFIG.API_URL;
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    let detail = "Login failed";
    try {
      const e = await res.json();
      if (typeof e.detail === 'string') detail = e.detail;
      else if (Array.isArray(e.detail)) detail = e.detail.map(d => d.msg || d).join(', ');
      else if (e.detail) detail = JSON.stringify(e.detail);
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
};

/** Get current user profile. */
window.apiMe = async function () {
  return window.apiFetch("/api/auth/me");
};

/** Register a new user (customer or provider). */
window.apiRegister = async function (payload) {
  return window.apiFetch("/api/auth/register", {
    method: "POST",
    body: payload,
  });
};
