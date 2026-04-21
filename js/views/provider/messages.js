/* =============================================================
   NextUp — Provider Messages (thread list)
   Route: #p-messages
   Same /api/messages/threads endpoint as customer — the backend
   decides "other party" correctly based on who's logged in.
   ============================================================= */

let NX_PROV_MSG_POLL = null;

window.Views.ProviderMessages = {
  async render() {
    await this._renderOnce();
    clearInterval(NX_PROV_MSG_POLL);
    NX_PROV_MSG_POLL = setInterval(() => this._renderOnce(true), 15000);
    window.addEventListener("hashchange", () => clearInterval(NX_PROV_MSG_POLL), { once: true });
  },

  async _renderOnce(silent) {
    let threads = [];
    try { threads = await window.apiFetch("/api/messages/threads"); } catch (_) {}

    const body = (threads && threads.length)
      ? threads.map(t => this._renderRow(t)).join("")
      : `<div class="nx-empty" style="padding-top:32px;">
           <div class="nx-empty__title">No messages yet</div>
           <div>When a customer replies after you've sent an offer, the thread shows up here.</div>
         </div>`;

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Messages</h1>
            <div class="nx-listhead__sub">${threads.length || 0} ${threads.length === 1 ? "conversation" : "conversations"}</div>
          </div>
          ${body}
        </div>
        ${window.providerTabBar("messages")}
      </div>
    `);

    document.querySelectorAll("[data-thread]").forEach(el => {
      el.addEventListener("click", () => window.navigate(`thread/${el.dataset.thread}`));
    });
    window.bindProviderTabBar();
  },

  _renderRow(t) {
    const name = t.other_name || "Customer";
    const preview = (t.last_body || "").replace(/\s+/g, " ").slice(0, 90);
    const ago = t.last_at ? window.timeAgo(t.last_at) : "";
    const unread = t.unread || 0;
    const badge = unread > 0
      ? `<span style="display:inline-block; background:#fafaf9; color:#111; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:500; margin-left:8px;">${unread}</span>`
      : "";
    return `
      <div class="nx-respcard" data-thread="${t.request_id}" style="cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <h3 class="nx-respcard__name" style="flex:1; margin:0;">${window.esc(name)}${badge}</h3>
          <span style="font-size:12px; color:var(--nx-text-muted); white-space:nowrap;">${window.esc(ago)}</span>
        </div>
        ${t.service_description ? `<div style="font-size:12px; color:var(--nx-text-muted); padding:4px 0;">${window.esc(t.service_description)}</div>` : ""}
        <div style="font-size:13px; color:${unread > 0 ? "var(--nx-text)" : "var(--nx-text-muted)"}; padding-top:4px;">
          ${window.esc(preview) || "—"}
        </div>
      </div>
    `;
  },
};
