/* =============================================================
   NextUp — Message Thread
   Route: #thread/:requestId
   Shared by customer + provider. Messages load with a polling
   loop every 5 seconds while the screen is visible. Composer
   sticks to the bottom on the virtual keyboard.
   ============================================================= */

let NX_THREAD_POLL = null;
let NX_THREAD_SEEN_IDS = new Set();

window.Views.MessageThread = {
  async render(params) {
    const requestId = params && params[0];
    if (!requestId) { window.navigate("messages"); return; }
    this._requestId = requestId;

    // Initial shell render
    window.mount(`
      <div class="nx-screen nx-screen--thread">
        <header class="nx-appbar nx-appbar--with-back">
          <button class="nx-appbar__back" id="back-btn" aria-label="Back">\u2039</button>
          <span class="nx-appbar__title" id="t-title">Loading\u2026</span>
          <div></div>
        </header>
        <div class="nx-thread__body" id="t-body">
          <div class="nx-empty"><div class="nx-empty__title">Loading\u2026</div></div>
        </div>
        <form class="nx-thread__composer" id="t-form" autocomplete="off">
          <input type="text" id="t-input" class="nx-thread__input" placeholder="Message\u2026" autocomplete="off">
          <button type="submit" id="t-send" class="nx-thread__send" aria-label="Send">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2-6-8-2z" fill="currentColor"/></svg>
          </button>
        </form>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => {
      clearInterval(NX_THREAD_POLL);
      window.history.length > 1 ? window.history.back() : window.navigate("messages");
    });

    document.getElementById("t-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this._send();
    });

    NX_THREAD_SEEN_IDS = new Set();
    await this._fetchAndRender();
    clearInterval(NX_THREAD_POLL);
    NX_THREAD_POLL = setInterval(() => this._fetchAndRender(true), 5000);
    window.addEventListener("hashchange", () => clearInterval(NX_THREAD_POLL), { once: true });
  },

  async _fetchAndRender(silent) {
    try {
      const [msgs, req] = await Promise.all([
        window.apiFetch(`/api/messages/${this._requestId}`),
        window.apiFetch(`/api/requests/${this._requestId}`).catch(() => null),
      ]);
      this._renderMessages(msgs, req);
    } catch (e) {
      if (!silent) {
        document.getElementById("t-body").innerHTML = `
          <div class="nx-empty">
            <div class="nx-empty__title">Couldn't load</div>
            <div>${window.esc(e.message || "")}</div>
          </div>`;
      }
    }
  },

  _renderMessages(msgs, req) {
    const me = (window.state.currentUser && window.state.currentUser.id) || null;
    const other = this._findOtherParty(msgs, me);

    const titleEl = document.getElementById("t-title");
    titleEl.textContent = other.name || "Conversation";

    const body = document.getElementById("t-body");
    const wasAtBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;

    const serviceBanner = req && req.service_description ? `
      <div class="nx-thread__banner">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted);">About</div>
        <div style="font-family:var(--nx-font-serif); font-size:16px; color:var(--nx-text); padding-top:2px;">${window.esc(req.service_description)}</div>
      </div>
    ` : "";

    const bubbles = (msgs || []).map(m => {
      const mine = m.sender_id === me;
      const side = mine ? "nx-msg--mine" : "nx-msg--theirs";
      const t = m.created_at ? window.timeAgo(m.created_at) : "";
      NX_THREAD_SEEN_IDS.add(m.id);
      return `
        <div class="nx-msg ${side}">
          <div class="nx-msg__bubble">${window.esc(m.body)}</div>
          <div class="nx-msg__meta">${window.esc(t)}</div>
        </div>
      `;
    }).join("");

    const empty = (!msgs || msgs.length === 0) ? `
      <div class="nx-empty" style="padding-top:30px;">
        <div style="color:var(--nx-text-muted); font-size:14px; text-align:center;">
          No messages yet. Say hi \u{1f44b}
        </div>
      </div>` : "";

    body.innerHTML = `${serviceBanner}<div class="nx-thread__stream">${bubbles}${empty}</div>`;

    // Auto-scroll to newest message on first load or if user was already at bottom
    requestAnimationFrame(() => {
      if (wasAtBottom || !body._initialized) {
        body.scrollTop = body.scrollHeight;
        body._initialized = true;
      }
    });
  },

  _findOtherParty(msgs, me) {
    for (const m of (msgs || [])) {
      if (m.sender_id !== me) return { id: m.sender_id, name: m.sender_name };
      if (m.recipient_id !== me) return { id: m.recipient_id, name: null };
    }
    return { id: null, name: null };
  },

  async _send() {
    const input = document.getElementById("t-input");
    const btn = document.getElementById("t-send");
    const text = input.value.trim();
    if (!text) return;
    btn.disabled = true;
    input.disabled = true;
    try {
      await window.apiFetch("/api/messages", {
        method: "POST",
        body: { request_id: parseInt(this._requestId, 10), body: text },
      });
      input.value = "";
      await this._fetchAndRender(true);
      input.focus();
    } catch (e) {
      window.nxAlert("Couldn't send: " + (e.message || ""));
    } finally {
      btn.disabled = false;
      input.disabled = false;
    }
  },
};
