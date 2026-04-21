/* =============================================================
   NextUp — Request History (dark, matches app design)
   Route: #my-requests
   ============================================================= */

window.Views.CustomerMyRequests = {
  async render() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body" id="req-body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-empty"><div class="nx-empty__title">Loading…</div></div>
        </div>
        ${window.customerTabBar("requests")}
      </div>
    `);
    window.bindCustomerTabBar();

    try {
      const requests = await window.apiFetch("/api/requests");
      const body = document.getElementById("req-body");
      const count = requests.length;

      if (!count) {
        body.innerHTML = `
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-listhead">
            <h1 class="nx-listhead__title">My Requests</h1>
            <div class="nx-listhead__sub">0 total</div>
          </div>
          <div class="nx-empty">
            <div class="nx-empty__title">No requests yet</div>
            <div>Tap Home to broadcast your first request.</div>
          </div>
          <button class="nx-cta" onclick="window.navigate('home')">Browse Services</button>
        `;
        return;
      }

      const cards = requests.map(r => `
        <div class="nx-respcard" data-req-id="${r.id}" style="cursor:pointer;">
          <h3 class="nx-respcard__name" style="font-size:22px;">${window.esc(r.service_description || "Request")}</h3>
          <div class="nx-respcard__row">
            <div class="nx-respcard__meta">
              <span>${window.esc(this._timeAgo(r.created_at))}</span>
              <span class="nx-respcard__dot">·</span>
              <span>${r.response_count || 0} response${(r.response_count || 0) === 1 ? "" : "s"}</span>
              <span class="nx-respcard__dot">·</span>
              <span>${window.esc(r.status)}</span>
            </div>
          </div>
        </div>
      `).join("");

      body.innerHTML = `
        <header class="nx-appbar nx-appbar--lockup">
          <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
        </header>
        <div class="nx-listhead">
          <h1 class="nx-listhead__title">My Requests</h1>
          <div class="nx-listhead__sub">${count} total</div>
        </div>
        ${cards}
      `;

      body.querySelectorAll("[data-req-id]").forEach(card => {
        card.addEventListener("click", () => window.navigate(`responses/${card.dataset.reqId}`));
      });
    } catch (e) {
      document.getElementById("req-body").innerHTML = `
        <div class="nx-empty">
          <div class="nx-empty__title">Couldn't load</div>
          <div>${window.esc(e.message)}</div>
        </div>`;
    }
  },

  _timeAgo(iso) {
    if (!iso) return "just now";
    const ms = Date.now() - Date.parse(iso);
    const mins = Math.max(1, Math.round(ms / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.round(hrs / 24)} d ago`;
  },
};
