/* =============================================================
   NextUp — Provider History
   Summary (total responses + bookings) + full list of every
   offer the provider has sent, newest first.
   Route: #p-history
   ============================================================= */

const CAT_LABELS = {
  beauty: "Beauty", spa_wellness: "Spa", health_fitness: "Fitness",
  home_cleaning: "Cleaning", home_repair: "Repair", lawn_outdoor: "Lawn",
  pets: "Pets", childcare: "Childcare", senior_care: "Senior",
  moving: "Moving", automotive: "Auto", tech: "Tech",
  events: "Events", laundry: "Laundry",
};

const STATUS_COLORS = {
  accepted:  { fg: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  sent:      { fg: "var(--nx-text)", bg: "transparent" },
  pending:   { fg: "var(--nx-text)", bg: "transparent" },
  declined:  { fg: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  cancelled: { fg: "var(--nx-text-muted)", bg: "transparent" },
};

window.Views.ProviderHistory = {
  async render() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body" id="body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-empty"><div class="nx-empty__title">Loading…</div></div>
        </div>
        ${window.providerTabBar("history")}
      </div>
    `);
    window.bindProviderTabBar();

    let stats = {};
    let list = [];
    try {
      [stats, list] = await Promise.all([
        window.apiFetch("/api/providers/dashboard").catch(() => ({})),
        window.apiFetch("/api/providers/my-responses").catch(() => []),
      ]);
    } catch (_) {}

    const itemsHTML = (list || []).map(r => this._renderItem(r)).join("") || `
      <div class="nx-empty" style="padding-top:24px;">
        <div style="color:var(--nx-text-muted); font-size:14px; text-align:center;">
          No responses yet. When you respond to a broadcast, it'll show up here.
        </div>
      </div>
    `;

    const body = document.getElementById("body");
    body.innerHTML = `
      <header class="nx-appbar nx-appbar--lockup">
        <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
      </header>
      <div class="nx-listhead">
        <h1 class="nx-listhead__title">History</h1>
        <div class="nx-listhead__sub">Your recent activity</div>
      </div>

      <div class="nx-respcard" style="cursor:default; margin-bottom:18px;">
        <div class="nx-respcard__row">
          <div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted);">Total responses</div>
            <div style="font-family:var(--nx-font-serif); font-size:30px; color:var(--nx-text); margin-top:4px;">${stats.total_responses != null ? stats.total_responses : (list.length || 0)}</div>
          </div>
          <div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted);">Jobs booked</div>
            <div style="font-family:var(--nx-font-serif); font-size:30px; color:var(--nx-text); margin-top:4px;">${stats.accepted_count != null ? stats.accepted_count : (list.filter(r => r.response_status === "accepted").length)}</div>
          </div>
        </div>
      </div>

      <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding:6px 0 12px;">
        Your responses
      </div>

      ${itemsHTML}
    `;
  },

  _renderItem(r) {
    const status = (r.response_status || "sent").toLowerCase();
    const color = STATUS_COLORS[status] || STATUS_COLORS.sent;
    const pill = `<span style="display:inline-block; padding:3px 10px; background:${color.bg}; color:${color.fg}; border-radius:999px; font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em;">${window.esc(status)}</span>`;
    const cat = CAT_LABELS[r.category] || r.category || "";
    const price = r.price != null ? `$${Math.round(r.price)}` : "—";
    const when = r.response_created_at ? window.timeAgo(r.response_created_at) : "";
    return `
      <div class="nx-respcard" style="cursor:default;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <h3 class="nx-respcard__name" style="flex:1; margin:0;">${window.esc(r.service_description || "Request")}</h3>
          ${pill}
        </div>
        <div class="nx-respcard__meta" style="font-size:13px; padding-top:4px;">
          <span>${window.esc(price)}</span>
          <span class="nx-respcard__dot">·</span>
          <span>${window.esc(r.available_time || "")}</span>
          <span class="nx-respcard__dot">·</span>
          <span>${window.esc(cat)}</span>
        </div>
        <div style="font-size:12px; color:var(--nx-text-muted); padding-top:4px;">
          ${window.esc(r.customer_name || "Customer")} · ${window.esc(when)}
        </div>
      </div>
    `;
  },
};
