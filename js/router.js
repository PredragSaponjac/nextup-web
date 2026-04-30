/* =============================================================
   NextUp — Hash Router with Role Guards
   Route format: #name/param1/param2
   Each view registers itself as window.Views.<Name> with a render(params) function.
   ============================================================= */

window.Views = window.Views || {};

// Route table: { hash-prefix → { view, auth, role } }
// auth: "none" | "required"
// role: "any" | "customer" | "provider" | null (for auth-less routes)
const ROUTES = [
  { match: "role-select",   view: "RoleSelect",        auth: "none",     role: null },
  { match: "login",         view: "Auth",              auth: "none",     role: null, fn: "renderLogin" },
  { match: "register",      view: "Auth",              auth: "none",     role: null, fn: "renderRegister" },
  { match: "forgot-password", view: "AuthForgot",       auth: "none",     role: null },
  { match: "change-password", view: "ChangePassword",   auth: "required", role: null },
  // Customer routes
  { match: "home",          view: "CustomerHome",      auth: "required", role: "customer" },
  { match: "category",      view: "CustomerCategory",  auth: "required", role: "customer" },
  { match: "broadcast",     view: "CustomerBroadcast", auth: "required", role: "customer" },
  { match: "responses",     view: "CustomerResponses", auth: "required", role: "customer" },
  { match: "provider",      view: "CustomerProviderView", auth: "required", role: "customer" },
  { match: "search-providers", view: "CustomerSearchProviders", auth: "required", role: "customer" },
  { match: "booking",       view: "CustomerBooking",   auth: "required", role: "customer" },
  { match: "review",        view: "CustomerReview",    auth: "required", role: "customer" },
  { match: "my-requests",   view: "CustomerMyRequests", auth: "required", role: "customer" },
  { match: "messages",      view: "CustomerMessages",  auth: "required", role: "customer" },
  { match: "thread",        view: "MessageThread",     auth: "required", role: null },
  { match: "profile",       view: "CustomerProfile",   auth: "required", role: "customer" },
  { match: "become-provider", view: "BecomeProvider", auth: "required", role: "customer" },
  // Provider routes
  { match: "dashboard",     view: "ProviderDashboard", auth: "required", role: "provider" },
  { match: "respond",       view: "ProviderRespond",   auth: "required", role: "provider" },
  { match: "p-history",     view: "ProviderHistory",   auth: "required", role: "provider" },
  { match: "p-messages",    view: "ProviderMessages",  auth: "required", role: "provider" },
  { match: "p-profile",     view: "ProviderProfile",   auth: "required", role: "provider" },
  { match: "billing",       view: "ProviderBilling",   auth: "required", role: "provider" },
  // verify-id is shared between customer and provider modes — the view
  // detects activeMode and posts to the right endpoint. Role: null lets
  // both modes route to it.
  { match: "verify-id",     view: "ProviderVerifyId",  auth: "required", role: null },
];

/** Parse current hash into { name, params }. */
function parseHash() {
  const raw = (window.location.hash || "").replace(/^#/, "");
  if (!raw) return { name: "", params: [] };
  const parts = raw.split("/");
  return { name: parts[0], params: parts.slice(1) };
}

/** Find the route definition matching a hash name. */
function findRoute(name) {
  return ROUTES.find(r => r.match === name);
}

/** Main router — called on hashchange and on init. */
window.router = async function () {
  const { name, params } = parseHash();

  // Active mode decides which side of the app we show. Not coupled to the
  // signup "role" anymore — a single user can flip between modes if they
  // have both capabilities (has_provider_profile).
  const home = () => (window.getActiveMode() === "provider" ? "dashboard" : "home");

  if (!name) {
    if (!window.state.token) window.navigate("role-select");
    else window.navigate(home());
    return;
  }

  const route = findRoute(name);

  if (!route) {
    console.warn("Unknown route:", name);
    if (!window.state.token) window.navigate("role-select");
    else window.navigate(home());
    return;
  }

  if (route.auth === "required" && !window.state.token) {
    window.navigate("role-select");
    return;
  }

  // If a route is tagged with a role and the user is in the other mode,
  // redirect them to their current mode's home.
  if (route.auth === "required" && route.role && route.role !== window.getActiveMode()) {
    window.navigate(home());
    return;
  }

  if (route.auth === "none" && window.state.token) {
    window.navigate(home());
    return;
  }

  // Dispatch to view
  const view = window.Views[route.view];
  if (!view) {
    console.error("View not registered:", route.view);
    return;
  }
  const fn = route.fn || "render";
  if (typeof view[fn] !== "function") {
    console.error("View function missing:", route.view + "." + fn);
    return;
  }

  try {
    await view[fn](params);
  } catch (e) {
    console.error("Render error:", e);
    window.mount(`<div class="error-screen"><h2>Something went wrong</h2><p>${window.esc(e.message)}</p><button class="btn-primary" onclick="location.reload()">Reload</button></div>`);
  }
};

window.addEventListener("hashchange", window.router);
