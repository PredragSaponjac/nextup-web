/* =============================================================
   NextUp — Helpers & Constants
   esc, timeAgo, stars, CATEGORIES, TIMEFRAMES, CATEGORY_ICONS.
   Extracted + extended from nextup-portal/app.js.
   ============================================================= */

// Initialize global view namespace (populated by view files that load after)
window.Views = window.Views || {};

// --------------- Category display names (key → label) ---------------
window.CATEGORIES = {
  beauty: "Beauty & Personal Care",
  spa_wellness: "Spa & Wellness",
  health_fitness: "Health & Fitness",
  home_cleaning: "Home Cleaning",
  home_repair: "Home Maintenance & Repair",
  lawn_outdoor: "Lawn & Outdoor",
  pets: "Pet Services",
  childcare: "Childcare & Family",
  senior_care: "Senior & Elder Care",
  moving: "Moving & Delivery",
  automotive: "Automotive",
  tech: "Tech & Smart Home",
  events: "Events & Entertainment",
  laundry: "Laundry & Clothing",
};

// --------------- Timeframe display names ---------------
window.TIMEFRAMES = {
  within_1h: "Within 1 hour",
  within_2h: "Within 2 hours",
  today: "Today",
  tomorrow: "Tomorrow",
};

// --------------- Category icons (emoji) for the home grid ---------------
// Emoji fallback is reliable across iOS + Android. Can be replaced with SVG later.
window.CATEGORY_ICONS = {
  beauty: "💇",
  spa_wellness: "💆",
  health_fitness: "💪",
  home_cleaning: "🧼",
  home_repair: "🔧",
  lawn_outdoor: "🌿",
  pets: "🐾",
  childcare: "👶",
  senior_care: "❤️",
  moving: "📦",
  automotive: "🚗",
  tech: "💻",
  events: "🎉",
  laundry: "👕",
};

// --------------- Escape HTML to prevent XSS ---------------
window.esc = function (str) {
  if (str === null || str === undefined) return "";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
};

// --------------- Time-ago formatter ---------------
window.timeAgo = function (iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// --------------- Star rating display ---------------
window.stars = function (rating) {
  if (!rating) return "—";
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
};

// --------------- Build <option> list from an object map ---------------
window.optionsFrom = function (map, selectedKey) {
  return Object.entries(map)
    .map(([k, v]) => {
      const label = typeof v === "string" ? v : v.label;
      return `<option value="${k}" ${k === selectedKey ? "selected" : ""}>${window.esc(label)}</option>`;
    })
    .join("");
};

// --------------- Navigate (hash router) ---------------
window.navigate = function (hash) {
  const h = hash.startsWith("#") ? hash : "#" + hash;
  window.location.hash = h;
};

// --------------- Format currency based on locale detection ---------------
window.formatPrice = function (amount, currency) {
  const market = window.NEXTUP_CONFIG.MARKETS[currency || "US"] || window.NEXTUP_CONFIG.MARKETS.US;
  return `${market.symbol}${amount}`;
};

// --------------- Mount a view into the app shell ---------------
window.mount = function (html) {
  const root = document.getElementById("app");
  if (root) root.innerHTML = html;
};

// --------------- Confirm / alert dialogs (WebView-safe) ---------------
// window.confirm() and window.alert() are silently suppressed inside
// Capacitor iOS WKWebViews — the call returns immediately without showing
// the dialog or waiting for the user. That silently breaks sign-out,
// booking, start-trial, etc. on iOS.
//
// nxConfirm renders an in-DOM modal and returns a Promise<boolean>.
// nxAlert does the same with a single OK button. Both work identically on
// web, iOS, and Android, with no plugin dependency.
window.nxConfirm = function (message, opts) {
  opts = opts || {};
  const okLabel = opts.okLabel || "OK";
  const cancelLabel = opts.cancelLabel || "Cancel";
  const danger = !!opts.danger;
  return new Promise((resolve) => {
    const existing = document.getElementById("nx-modal");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "nx-modal";
    overlay.style.cssText =
      "position:fixed; inset:0; z-index:10000; display:flex; align-items:center; " +
      "justify-content:center; padding:24px; background:rgba(0,0,0,0.66); " +
      "backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);";
    const safeMsg = window.esc(message).replace(/\n/g, "<br>");
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" style="max-width:360px; width:100%; ' +
      'background:#141414; border:1px solid #2a2a2a; border-radius:16px; ' +
      'padding:22px; color:#fafaf9; font-family:var(--nx-font-sans,system-ui);">' +
      '<div style="font-size:15px; line-height:1.5; padding:4px 0 18px;">' + safeMsg + '</div>' +
      '<div style="display:flex; gap:10px;">' +
      '<button id="nx-modal-cancel" style="flex:1; padding:12px; border-radius:10px; ' +
      'border:1px solid #2a2a2a; background:transparent; color:#fafaf9; ' +
      'font-size:15px;">' + window.esc(cancelLabel) + '</button>' +
      '<button id="nx-modal-ok" style="flex:1; padding:12px; border-radius:10px; ' +
      'border:0; background:' + (danger ? '#ef4444' : '#22c55e') + '; color:#000; ' +
      'font-weight:600; font-size:15px;">' + window.esc(okLabel) + '</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    const cleanup = (result) => { overlay.remove(); resolve(result); };
    overlay.querySelector("#nx-modal-ok").addEventListener("click", () => cleanup(true));
    overlay.querySelector("#nx-modal-cancel").addEventListener("click", () => cleanup(false));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(false); });
  });
};

window.nxAlert = function (message, opts) {
  opts = opts || {};
  return window.nxConfirm(message, {
    okLabel: opts.okLabel || "OK",
    cancelLabel: "",
  }).then(() => undefined);
};

// --------------- Open an external URL (Stripe Checkout, etc.) ----------
// Inside a Capacitor WebView, window.location.href = url navigates the
// whole WebView to Stripe and leaves the user stranded with no way back.
// Prefer @capacitor/browser if installed; fall back to a top-level
// navigation on plain web.
window.nxOpenExternal = async function (url) {
  try {
    const Browser =
      window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
    if (Browser && Browser.open) {
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    }
  } catch (_) { /* fall through to plain navigation */ }
  window.location.href = url;
};

// --------------- Shared swipe-to-hide for messages thread list ---------
// Used by both customer/messages.js and provider/messages.js. Each thread
// row is a .nx-swipe with a .nx-swipe__card child and a Hide button behind.
// Tap card → navigate to thread; swipe-left → reveal Hide; tap Hide → POST
// /api/messages/{id}/hide → re-render via the view's _renderOnce().
window.nxBindThreadSwipe = function (view) {
  const THRESHOLD = 60, OPEN_AT = 90;
  let current = null, startX = 0, offset = 0, dragged = false;
  const wraps = document.querySelectorAll(".nx-swipe[data-thread-wrap]");

  const closeAll = (except) => {
    wraps.forEach(el => {
      if (el === except) return;
      el.classList.remove("is-open");
      const c = el.querySelector(".nx-swipe__card");
      if (c) c.style.transform = "";
    });
  };

  wraps.forEach(wrap => {
    const card = wrap.querySelector(".nx-swipe__card");
    const action = wrap.querySelector("[data-hide-thread]");
    const reqId = card.dataset.thread;

    card.addEventListener("click", (e) => {
      if (dragged) { dragged = false; return; }
      if (wrap.classList.contains("is-open")) {
        e.preventDefault();
        wrap.classList.remove("is-open");
        card.style.transform = "";
        return;
      }
      window.navigate(`thread/${reqId}`);
    });

    action.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await window.nxConfirm(
        "Hide this conversation from your inbox?\n\nThe other person still sees the full history. If they reply, the thread comes back.",
        { okLabel: "Hide", danger: true }
      );
      if (!ok) return;
      try {
        await window.apiFetch(`/api/messages/${reqId}/hide`, { method: "POST" });
        window.toast && window.toast("Hidden", "success");
        if (view && typeof view._renderOnce === "function") await view._renderOnce(true);
      } catch (err) {
        window.nxAlert("Couldn't hide: " + err.message);
      }
    });

    const onDown = (e) => {
      const t = e.touches ? e.touches[0] : e;
      current = wrap; startX = t.clientX;
      offset = wrap.classList.contains("is-open") ? -OPEN_AT : 0;
      dragged = false;
      card.style.transition = "none";
    };
    const onMove = (e) => {
      if (current !== wrap) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - startX;
      let next = Math.min(0, offset + dx);
      if (next < -OPEN_AT - 20) next = -OPEN_AT - 20;
      card.style.transform = `translateX(${next}px)`;
      if (Math.abs(dx) > 6) dragged = true;
    };
    const onUp = (e) => {
      if (current !== wrap) return;
      current = null;
      card.style.transition = "transform 160ms ease-out";
      const t = (e.changedTouches && e.changedTouches[0]) || e;
      const finalOffset = offset + (t.clientX - startX);
      if (finalOffset < -THRESHOLD) {
        closeAll(wrap);
        wrap.classList.add("is-open");
        card.style.transform = `translateX(-${OPEN_AT}px)`;
      } else {
        wrap.classList.remove("is-open");
        card.style.transform = "";
      }
    };
    card.addEventListener("touchstart", onDown, { passive: true });
    card.addEventListener("touchmove", onMove, { passive: true });
    card.addEventListener("touchend", onUp);
    card.addEventListener("mousedown", onDown);
    card.addEventListener("mousemove", (e) => { if (current === wrap && e.buttons === 1) onMove(e); });
    card.addEventListener("mouseup", onUp);
    card.addEventListener("mouseleave", (e) => { if (current === wrap) onUp(e); });
  });
};

// --------------- Delete-account flow (shared by customer + provider) ----
// Apple App Store guideline 5.1.1(v) requires every app that creates
// accounts to also let the user delete them in-app. This drives the full
// flow: explicit warning → password re-confirmation → DELETE
// /api/auth/account → clear local session → bounce to role-select.
window.nxDeleteAccountFlow = async function () {
  const ok = await window.nxConfirm(
    "Delete your NextUp account?\n\nThis permanently removes your profile, requests, responses, messages, reviews and any active subscription. It can't be undone.",
    { okLabel: "Continue", cancelLabel: "Keep account", danger: true }
  );
  if (!ok) return;

  const password = await window.nxPrompt(
    "Confirm with your password to permanently delete your account.",
    { okLabel: "Delete forever", placeholder: "Password", type: "password", danger: true }
  );
  if (password == null) return;          // user cancelled
  if (!password) {
    window.nxAlert("Password is required to delete the account.");
    return;
  }

  try {
    await window.apiFetch("/api/auth/account", {
      method: "DELETE",
      body: { password },
    });
  } catch (err) {
    const msg = (err && err.message) || "Delete failed";
    window.nxAlert("Couldn't delete account: " + msg);
    return;
  }

  // Clean local state regardless of what the server returns next.
  try { window.clearSession && window.clearSession(); } catch (_) {}
  window.toast && window.toast("Account deleted", "success");
  window.navigate("role-select");
};

// --------------- Single-input prompt modal (WebView-safe) ---------------
// window.prompt() is silently suppressed inside iOS WKWebView (returns null
// without ever showing a UI). We render an in-DOM modal that returns
// Promise<string|null> — null means user cancelled, "" means submitted blank.
window.nxPrompt = function (message, opts) {
  opts = opts || {};
  const okLabel = opts.okLabel || "OK";
  const cancelLabel = opts.cancelLabel || "Cancel";
  const placeholder = opts.placeholder || "";
  const inputType = opts.type || "text";
  const danger = !!opts.danger;
  return new Promise((resolve) => {
    const existing = document.getElementById("nx-modal");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "nx-modal";
    overlay.style.cssText =
      "position:fixed; inset:0; z-index:10000; display:flex; align-items:center; " +
      "justify-content:center; padding:24px; background:rgba(0,0,0,0.66); " +
      "backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);";
    const safeMsg = window.esc(message).replace(/\n/g, "<br>");
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" style="max-width:360px; width:100%; ' +
      'background:#141414; border:1px solid #2a2a2a; border-radius:16px; ' +
      'padding:22px; color:#fafaf9; font-family:var(--nx-font-sans,system-ui);">' +
      '<div style="font-size:15px; line-height:1.5; padding:4px 0 14px;">' + safeMsg + '</div>' +
      '<input id="nx-modal-input" type="' + window.esc(inputType) + '" ' +
      'placeholder="' + window.esc(placeholder) + '" autocomplete="current-password" ' +
      'style="width:100%; padding:12px; margin-bottom:14px; border-radius:10px; ' +
      'border:1px solid #2a2a2a; background:#0b0b0b; color:#fafaf9; ' +
      'font-size:15px; box-sizing:border-box;">' +
      '<div style="display:flex; gap:10px;">' +
      '<button id="nx-modal-cancel" style="flex:1; padding:12px; border-radius:10px; ' +
      'border:1px solid #2a2a2a; background:transparent; color:#fafaf9; ' +
      'font-size:15px;">' + window.esc(cancelLabel) + '</button>' +
      '<button id="nx-modal-ok" style="flex:1; padding:12px; border-radius:10px; ' +
      'border:0; background:' + (danger ? '#ef4444' : '#22c55e') + '; color:#000; ' +
      'font-weight:600; font-size:15px;">' + window.esc(okLabel) + '</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#nx-modal-input");
    setTimeout(() => { try { input.focus(); } catch (_) {} }, 50);
    const cleanup = (result) => { overlay.remove(); resolve(result); };
    overlay.querySelector("#nx-modal-ok").addEventListener("click", () => cleanup(input.value));
    overlay.querySelector("#nx-modal-cancel").addEventListener("click", () => cleanup(null));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(null); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") cleanup(input.value);
      else if (e.key === "Escape") cleanup(null);
    });
  });
};

// --------------- Show a toast message ---------------
window.toast = function (message, type) {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.id = "toast";
  t.className = "toast toast--" + (type || "info");
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("toast--visible"), 10);
  setTimeout(() => {
    t.classList.remove("toast--visible");
    setTimeout(() => t.remove(), 300);
  }, 3000);
};
