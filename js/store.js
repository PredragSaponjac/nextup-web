/* =============================================================
   NextUp — Persistent Storage Wrapper
   localStorage with in-memory fallback when sandboxed.
   ============================================================= */

window._store = (() => {
  const m = {};
  const fallback = {
    getItem: k => m[k] || null,
    setItem: (k, v) => { m[k] = v; },
    removeItem: k => { delete m[k]; },
  };
  try {
    const ls = window['localStorage'];
    if (!ls) return fallback;
    ls.setItem('__t', '1');
    ls.removeItem('__t');
    return ls;
  } catch (_) {
    return fallback;
  }
})();

/** Safely parse a JSON value from storage, or return null. */
function _readJSON(key) {
  try {
    const raw = window._store.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

// --------------- Session State ---------------
// Global state accessible to all views. Restored on every app launch.
window.state = {
  token:         window._store.getItem("nextup_token") || null,
  role:          window._store.getItem("nextup_role") || null,         // primary role from signup (display-only)
  pendingRole:   window._store.getItem("nextup_pending_role") || null, // set during role-select before register
  currentUser:   _readJSON("nextup_user"),                              // full user object (persisted)
  // activeMode controls which UI is visible RIGHT NOW — customer or provider.
  // A single user can flip between them if they have both capabilities.
  activeMode:    window._store.getItem("nextup_active_mode") || null,
  biometricEnabled: window._store.getItem("nextup_biometric") === "1",
  biometricUnlocked: false,
  providerProfile: null,
  isOnline: false,
};

window.persistToken = function (t) {
  window.state.token = t;
  if (t) window._store.setItem("nextup_token", t);
  else   window._store.removeItem("nextup_token");
};

window.persistRole = function (r) {
  window.state.role = r;
  if (r) window._store.setItem("nextup_role", r);
  else   window._store.removeItem("nextup_role");
};

window.persistPendingRole = function (r) {
  window.state.pendingRole = r;
  if (r) window._store.setItem("nextup_pending_role", r);
  else   window._store.removeItem("nextup_pending_role");
};

window.persistUser = function (user) {
  window.state.currentUser = user;
  if (user) window._store.setItem("nextup_user", JSON.stringify(user));
  else      window._store.removeItem("nextup_user");
};

window.setActiveMode = function (mode) {
  // mode: "customer" | "provider"
  window.state.activeMode = mode;
  if (mode) window._store.setItem("nextup_active_mode", mode);
  else      window._store.removeItem("nextup_active_mode");
};

/** Convenience: compute the "active" mode, falling back to primary role. */
window.getActiveMode = function () {
  if (window.state.activeMode) return window.state.activeMode;
  const u = window.state.currentUser;
  // Prefer customer mode by default for new users with no activeMode set
  if (u && u.has_provider_profile && u.role === "provider") return "provider";
  return "customer";
};

window.setBiometricEnabled = function (on) {
  window.state.biometricEnabled = !!on;
  if (on) window._store.setItem("nextup_biometric", "1");
  else    window._store.removeItem("nextup_biometric");
};

window.clearSession = function () {
  window.state.token = null;
  window.state.role = null;
  window.state.pendingRole = null;
  window.state.currentUser = null;
  window.state.biometricEnabled = false;
  window.state.biometricUnlocked = false;
  window.state.providerProfile = null;
  window.state.isOnline = false;
  window._store.removeItem("nextup_token");
  window._store.removeItem("nextup_role");
  window._store.removeItem("nextup_pending_role");
  window._store.removeItem("nextup_user");
  window._store.removeItem("nextup_biometric");
  window._store.removeItem("nextup_active_mode");
};
