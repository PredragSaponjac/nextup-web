/* =============================================================
   NextUp — Customer Home
   14 categories · 332 services (pulled from SERVICES_TAXONOMY).
   Centered NextUp → location pill → "What do you need?" → 2-col
   scrollable grid with line-icon tiles → bottom tab bar.
   ============================================================= */

/* Inline SVG line icons (stroke 1.4, white) — one per backend category */
function nxIconScissors() {
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><circle cx="11" cy="14" r="5"/><circle cx="11" cy="30" r="5"/><path d="M16 17L37 33"/><path d="M16 27L37 11"/></svg>`;
}
function nxIconLotus() {
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M22 34c-8 0-14-4-14-4s2-8 8-8c4 0 6 4 6 4"/><path d="M22 34c8 0 14-4 14-4s-2-8-8-8c-4 0-6 4-6 4"/><path d="M22 34c0-10 0-14-4-18 0 0-4 6 0 12"/><path d="M22 34c0-10 0-14 4-18 0 0 4 6 0 12"/></svg>`;
}
function nxIconDumbbell() {
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><rect x="4" y="16" width="5" height="12" rx="1"/><rect x="9" y="19" width="3" height="6"/><rect x="12" y="20" width="20" height="4"/><rect x="32" y="19" width="3" height="6"/><rect x="35" y="16" width="5" height="12" rx="1"/></svg>`;
}
function nxIconSpray() {
  // home cleaning — spray bottle
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><rect x="14" y="16" width="14" height="20" rx="2"/><rect x="17" y="8" width="8" height="8"/><path d="M25 12h8M31 8v8"/></svg>`;
}
function nxIconHammer() {
  // home repair — hammer
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M20 6h14v6L28 18l-4-4z"/><path d="M24 18l-12 14a2 2 0 01-3 0l-1-1a2 2 0 010-3l12-14z"/></svg>`;
}
function nxIconLeaf() {
  // lawn — leaf
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M8 34c0-12 8-22 24-22 0 16-10 24-22 24l-2-2z"/><path d="M10 34l14-14"/></svg>`;
}
function nxIconPaw() {
  // pets — paw
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><circle cx="14" cy="16" r="3"/><circle cx="22" cy="12" r="3"/><circle cx="30" cy="16" r="3"/><circle cx="10" cy="24" r="2.5"/><circle cx="34" cy="24" r="2.5"/><path d="M15 30c0-4 3-7 7-7s7 3 7 7-3 6-7 6-7-2-7-6z"/></svg>`;
}
function nxIconChild() {
  // childcare — simple face + body
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><circle cx="22" cy="14" r="5"/><path d="M12 38c0-6 4-10 10-10s10 4 10 10"/><circle cx="19" cy="13" r="1" fill="currentColor"/><circle cx="25" cy="13" r="1" fill="currentColor"/></svg>`;
}
function nxIconHeart() {
  // senior care — heart/hand
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M22 34s-14-8-14-18c0-5 4-8 8-8 3 0 5 2 6 4 1-2 3-4 6-4 4 0 8 3 8 8 0 10-14 18-14 18z"/></svg>`;
}
function nxIconBox() {
  // moving — box
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M8 14l14-6 14 6v18l-14 6-14-6z"/><path d="M8 14l14 6 14-6M22 20v18"/></svg>`;
}
function nxIconCar() {
  // automotive — car
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M6 28h32v-6l-4-8H10l-4 8zM10 28v3a2 2 0 002 2h2a2 2 0 002-2v-3M28 28v3a2 2 0 002 2h2a2 2 0 002-2v-3"/><circle cx="14" cy="28" r="2" fill="currentColor"/><circle cx="30" cy="28" r="2" fill="currentColor"/></svg>`;
}
function nxIconWifi() {
  // tech — wifi arcs
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M6 18c9-10 23-10 32 0"/><path d="M12 24c6-6 14-6 20 0"/><path d="M17 30c3-3 7-3 10 0"/><circle cx="22" cy="34" r="2" fill="currentColor"/></svg>`;
}
function nxIconMusic() {
  // events — music note
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M16 30V10l14-3v20"/><circle cx="14" cy="30" r="4"/><circle cx="28" cy="27" r="4"/></svg>`;
}
function nxIconShirt() {
  // laundry — t-shirt
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M14 8l-8 4 4 8 4-2v18h16V18l4 2 4-8-8-4-4 4h-8z"/></svg>`;
}
function nxIconErrand() {
  // errands_delivery — package + arrow
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><path d="M8 14l14-6 14 6v18l-14 6-14-6z"/><path d="M8 14l14 6 14-6"/><path d="M22 38V20"/><path d="M30 24l4 4-4 4M34 28h-8" stroke-linecap="round"/></svg>`;
}
function nxIconWheel() {
  // drive_transport — steering wheel
  return `<svg class="nx-cat__icon" viewBox="0 0 44 44"><circle cx="22" cy="22" r="14"/><circle cx="22" cy="22" r="3" fill="currentColor"/><path d="M22 8v11M22 25v11M8 22h11M25 22h11" stroke-linecap="round"/></svg>`;
}
// v1.3.1 — Categories temporarily gated behind background-check rollout.
// Tiles still appear on Home (so customers see the full vision) but tapping
// them shows a "Coming soon" modal until automated BG checks are live.
// Once Persona Reports is enabled and we have providers passing BG checks,
// remove keys from this set to unlock them.
const NX_COMING_SOON_CATEGORIES = new Set(["childcare", "senior_care", "drive_transport"]);

// Map backend-category key → icon fn + display label
const NX_CATEGORY_ICONS = {
  beauty:         nxIconScissors,
  spa_wellness:   nxIconLotus,
  health_fitness: nxIconDumbbell,
  home_cleaning:  nxIconSpray,
  home_repair:    nxIconHammer,
  lawn_outdoor:   nxIconLeaf,
  pets:           nxIconPaw,
  childcare:      nxIconChild,
  senior_care:    nxIconHeart,
  moving:         nxIconBox,
  automotive:     nxIconCar,
  tech:           nxIconWifi,
  events:         nxIconMusic,
  laundry:        nxIconShirt,
  errands_delivery: nxIconErrand,
  drive_transport:  nxIconWheel,
};

window.Views.CustomerHome = {
  render() {
    const location = (window.state.currentUser && window.state.currentUser.city) || "Near you";
    const hasProvider = !!(window.state.currentUser && window.state.currentUser.has_provider_profile);
    const modeCTA = hasProvider ? "I'm a provider ›" : "Become a provider ›";

    // Render every category in SERVICES_TAXONOMY as a tile. Specialty
    // services live as additional sub-services within an existing
    // category's picker (e.g. spa_wellness includes Therapeutic Touch,
    // Personal Companion, Couples Bodywork) — there's no separate
    // "specialty" tile on the home grid, so the surface stays clean.
    const catKeys = Object.keys(window.SERVICES_TAXONOMY || {});
    const tiles = catKeys.map(key => {
      const cat = window.SERVICES_TAXONOMY[key];
      const iconFn = NX_CATEGORY_ICONS[key] || nxIconScissors;
      const comingSoon = NX_COMING_SOON_CATEGORIES.has(key);
      const comingBadge = comingSoon
        ? `<span style="position:absolute; top:8px; right:8px; padding:2px 6px; background:#f0b400; color:#000; font-size:9px; font-weight:700; border-radius:999px; letter-spacing:0.04em; text-transform:uppercase;">Soon</span>`
        : "";
      return `
        <button class="nx-cat ${comingSoon ? 'nx-cat--coming-soon' : ''}" data-cat="${key}" ${comingSoon ? 'data-coming-soon="1"' : ''} style="position:relative; ${comingSoon ? 'opacity:0.65;' : ''}">
          ${iconFn()}
          <span class="nx-cat__label">${window.esc(cat.label)}</span>
          ${comingBadge}
        </button>
      `;
    }).join("");

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar">
            <span class="nx-appbar__brand">NextUp</span>
          </header>

          <div class="nx-topbar-row">
            <button class="nx-mode-chip" id="mode-switch" type="button">${window.esc(modeCTA)}</button>
            <button class="nx-location__pill" id="location-pill" type="button">
              <svg viewBox="0 0 16 16"><circle cx="8" cy="7" r="3"/><path d="M8 14s-6-4.5-6-8a6 6 0 1112 0c0 3.5-6 8-6 8z"/></svg>
              <span>${window.esc(location)}</span>
              <span class="chev">›</span>
            </button>
          </div>

          <h1 class="nx-headline">What do you need?</h1>

          <button class="nx-searchtile" id="search-providers-tile" type="button">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="6"></circle>
              <path d="M14 14l4 4" stroke-linecap="round"></path>
            </svg>
            <span><strong>Search by name</strong> &middot; already know who you want</span>
            <span class="chev">›</span>
          </button>

          <div class="nx-catgrid">${tiles}</div>
        </div>

        ${window.customerTabBar("home")}
      </div>
    `);

    document.querySelectorAll(".nx-cat").forEach(tile => {
      tile.addEventListener("click", async () => {
        if (tile.dataset.comingSoon === "1") {
          const catKey = tile.dataset.cat;
          const cat = (window.SERVICES_TAXONOMY[catKey] || {}).label || catKey;
          let body;
          if (catKey === "drive_transport") {
            body = `${cat} is coming soon.\n\nTransport services like drive-my-car, pet transport, and designated driver involve real safety risk. We're not opening bookings in this category until our full driver-verification + insurance program is in place. We'll announce in the app when it opens. Thanks for your patience.`;
          } else if (catKey === "childcare" || catKey === "senior_care") {
            // Childcare and senior care involve vulnerable people and
            // catastrophic-loss risk. The honest framing: not bookable
            // until the full safety + insurance + license-verification
            // program is in place. NO timeline commitment — promises
            // create breach exposure if the rollout slips.
            body = `${cat} is coming soon.\n\n${cat} involves real risk to vulnerable people. We're not opening bookings in this category until our full safety, verification, and insurance program is fully in place. We'll announce in the app when it opens. Thanks for your patience.`;
          } else {
            body = `${cat} is coming soon.\n\nWe're putting our full safety + verification program in place before opening bookings in this category. We'll announce in the app when it opens.`;
          }
          await window.nxAlert(body, { okLabel: "Got it" });
          return;
        }
        window.navigate(`broadcast/${tile.dataset.cat}`);
      });
    });

    document.getElementById("search-providers-tile").addEventListener("click", () => {
      window.navigate("search-providers");
    });

    document.getElementById("mode-switch").addEventListener("click", () => {
      if (hasProvider) {
        window.setActiveMode("provider");
        window.navigate("dashboard");
      } else {
        window.navigate("become-provider");
      }
    });

    document.getElementById("location-pill").addEventListener("click", async () => {
      // Tap → re-detect from GPS (if permitted), else fall back to manual entry
      const coords = await (window.nxGetCoordsIfPermitted ? window.nxGetCoordsIfPermitted() : null);
      if (coords) {
        const city = await window.nxReverseGeocode(coords.lat, coords.lng);
        if (city) {
          window.persistUser(Object.assign({}, window.state.currentUser || {}, { city }));
          window.Views.CustomerHome.render();
          return;
        }
      }
      // Native prompt() is silently suppressed in Capacitor iOS WebViews,
      // so show a guidance message instead. Providers can also set their
      // city via Profile -> Edit.
      await window.nxAlert(
        "We couldn't detect your city automatically. Enable Location access for NextUp in Settings, then tap this pill again."
      );
    });

    // When background auto-detection finishes, refresh the pill silently
    const onCity = () => window.Views.CustomerHome.render();
    window.addEventListener("nx:city-updated", onCity, { once: true });

    window.bindCustomerTabBar();
  },
};

/* ---- Tab bar (shared across customer screens) ---- */

function tabIcon(kind) {
  switch (kind) {
    case "home":
      return `<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z"/></svg>`;
    case "requests":
      return `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 3h6v3H9zM9 10h6M9 14h6M9 18h4"/></svg>`;
    case "messages":
      return `<svg viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1h-9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z"/></svg>`;
    case "profile":
      return `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>`;
  }
  return "";
}

window.customerTabBar = function (active) {
  const tabs = [
    { key: "home",        label: "Home",     hash: "home" },
    { key: "requests",    label: "Requests", hash: "my-requests" },
    { key: "messages",    label: "Messages", hash: "messages" },
    { key: "profile",     label: "Profile",  hash: "profile" },
  ];
  return `
    <nav class="nx-tabbar">
      ${tabs.map(t => `
        <button class="nx-tabbar__tab ${t.key === active ? 'nx-tabbar__tab--active' : ''}" data-hash="${t.hash}">
          ${tabIcon(t.key)}
          <span>${t.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
};

window.bindCustomerTabBar = function () {
  document.querySelectorAll(".nx-tabbar__tab").forEach(btn => {
    btn.addEventListener("click", () => window.navigate(btn.dataset.hash));
  });
};
