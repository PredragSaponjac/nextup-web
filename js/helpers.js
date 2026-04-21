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
