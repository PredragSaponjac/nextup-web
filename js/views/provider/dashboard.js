/* =============================================================
   NextUp — Provider Dashboard
   Availability toggle + live feed of incoming requests in range.
   Polls every 15s as a fallback until push notifications land.
   ============================================================= */

let NX_PROV_POLL = null;

window.Views.ProviderDashboard = {
  async render() {
    await this._fetchAndRender();

    // Poll every 15s while on this screen (push arrives via APNs when wired)
    clearInterval(NX_PROV_POLL);
    NX_PROV_POLL = setInterval(() => this._fetchAndRender(true), 15000);
    window.addEventListener("hashchange", () => clearInterval(NX_PROV_POLL), { once: true });
  },

  async _fetchAndRender(silent) {
    let incoming = [];
    let profile = null;
    let err = null;
    try {
      profile = await window.apiFetch("/api/providers/profile");
    } catch (e) {
      if (!silent && e.message && e.message.toLowerCase().includes("profile")) {
        // Profile missing — send them to set it up
      } else {
        err = e.message;
      }
    }
    try {
      incoming = await window.apiFetch("/api/providers/incoming");
    } catch (e) {
      if (!err) err = e.message;
    }

    const isOnline = !!(profile && profile.is_online);

    const cards = (incoming || []).map(r => {
      const miles = r.distance_miles != null ? `${r.distance_miles.toFixed(1)} mi` : "—";
      const timeLbl = {
        within_1h: "Within 1 hour",
        within_2h: "Within 2 hours",
        today: "Today",
        tomorrow: "Tomorrow",
      }[r.timeframe] || r.timeframe;
      const directPill = r.is_direct
        ? `<span style="display:inline-block; margin-right:8px; padding:3px 10px; background:#fafaf9; color:#000; border-radius:999px; font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">Direct</span>`
        : "";
      return `
        <div class="nx-respcard" data-req-id="${r.id}" style="cursor:pointer; ${r.is_direct ? "border-color:#fafaf9;" : ""}">
          <h3 class="nx-respcard__name">${directPill}${window.esc(r.service_description || "Request")}</h3>
          <div class="nx-respcard__meta" style="font-size:14px;">
            <span>${window.esc(miles)}</span>
            <span class="nx-respcard__dot">·</span>
            <span>${window.esc(timeLbl)}</span>
          </div>
          ${r.notes ? `<div style="font-size:13px; color:var(--nx-text-muted); padding-top:6px; border-top:1px solid var(--nx-border-soft);">${window.esc(r.notes)}</div>` : ""}
          <div class="nx-respcard__row" style="padding-top:6px;">
            <button class="nx-bookbtn" data-respond="${r.id}">Respond</button>
          </div>
        </div>`;
    }).join("");

    const body = err
      ? `<div class="nx-empty"><div class="nx-empty__title">Couldn't load</div><div>${window.esc(err)}</div></div>`
      : (incoming.length === 0
          ? `<div class="nx-empty">
               <div class="nx-empty__title">No incoming requests yet</div>
               <div>We'll notify you as soon as a nearby customer needs your service.</div>
             </div>`
          : cards);

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>

          <div class="nx-topbar-row" style="justify-content:flex-end;">
            <button class="nx-mode-chip" id="mode-switch" type="button">I need a service ›</button>
          </div>

          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Dashboard</h1>
            <div class="nx-listhead__sub">${profile ? window.esc(profile.business_name || "Provider") : ""}</div>
          </div>

          <div class="nx-respcard" style="margin-bottom:20px; cursor:default;">
            <div class="nx-respcard__row">
              <div style="flex:1;">
                <div style="font-family:var(--nx-font-serif); font-size:20px; color:var(--nx-text);">Availability</div>
                <div style="font-size:12px; color:var(--nx-text-muted); margin-top:2px;">${isOnline ? "You're online — broadcasts coming in." : "You're offline — no new broadcasts."}</div>
              </div>
              <button class="nx-bookbtn" id="toggle-online" style="background:${isOnline ? "#22c55e" : "#fafaf9"}; color:${isOnline ? "#000" : "#000"};">
                ${isOnline ? "Go offline" : "Go online"}
              </button>
            </div>
          </div>

          <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding: 0 0 12px;">
            Incoming requests
          </div>

          ${body}
        </div>

        ${window.providerTabBar("dashboard")}
      </div>
    `);

    const modeBtn = document.getElementById("mode-switch");
    if (modeBtn) {
      modeBtn.addEventListener("click", () => {
        window.setActiveMode("customer");
        window.navigate("home");
      });
    }

    const toggleBtn = document.getElementById("toggle-online");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", async () => {
        toggleBtn.disabled = true;
        const originalLabel = toggleBtn.textContent;
        toggleBtn.textContent = isOnline ? "Going offline..." : "Going online...";
        // Retry once after 2s if the first call fails — backend cold start on
        // free tier, flaky cell network, etc. 95% of the time the retry works.
        const doCall = () => window.apiFetch("/api/providers/availability", {
          method: "POST",
          body: { is_online: !isOnline },
        });
        try {
          await doCall();
        } catch (e1) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            await doCall();
          } catch (e2) {
            const msg = (e2 && e2.message) || (e1 && e1.message) || "Network error";
            alert("Couldn't update availability: " + msg + "\n\nCheck your connection and try again.");
            toggleBtn.textContent = originalLabel;
            toggleBtn.disabled = false;
            return;
          }
        }
        this._fetchAndRender();
      });
    }

    document.querySelectorAll("[data-respond]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.respond;
        sessionStorage.setItem("nx_respond_request_id", id);
        window.navigate(`respond/${id}`);
      });
    });

    document.querySelectorAll("[data-req-id]").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.reqId;
        sessionStorage.setItem("nx_respond_request_id", id);
        window.navigate(`respond/${id}`);
      });
    });

    window.bindProviderTabBar();
  },
};

/* ---- Provider tab bar ---- */

function pTabIcon(kind) {
  switch (kind) {
    case "dashboard":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`;
    case "history":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`;
    case "billing":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>`;
    case "profile":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>`;
    case "messages":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1h-9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z"/></svg>`;
  }
  return "";
}

window.providerTabBar = function (active) {
  const tabs = [
    { key: "dashboard", label: "Dashboard", hash: "dashboard" },
    { key: "messages",  label: "Messages",  hash: "p-messages" },
    { key: "history",   label: "History",   hash: "p-history" },
    { key: "billing",   label: "Billing",   hash: "billing"   },
    { key: "profile",   label: "Profile",   hash: "p-profile" },
  ];
  return `
    <nav class="nx-tabbar">
      ${tabs.map(t => `
        <button class="nx-tabbar__tab ${t.key === active ? 'nx-tabbar__tab--active' : ''}" data-hash="${t.hash}">
          ${pTabIcon(t.key)}
          <span>${t.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
};

window.bindProviderTabBar = function () {
  document.querySelectorAll(".nx-tabbar__tab").forEach(btn => {
    btn.addEventListener("click", () => window.navigate(btn.dataset.hash));
  });
};
