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

    // Initial shell render. v1.3.25 adds a kebab menu (\u22ee) in the
    // top-right of the appbar that opens a small action sheet with
    // "Block & Report" \u2014 required for Apple Guideline 1.2 compliance
    // and the natural place to block someone after a bad conversation.
    window.mount(`
      <div class="nx-screen nx-screen--thread">
        <header class="nx-appbar nx-appbar--with-back">
          <button class="nx-appbar__back" id="back-btn" aria-label="Back">\u2039</button>
          <span class="nx-appbar__title" id="t-title">Loading\u2026</span>
          <button id="t-kebab" aria-label="More options"
            style="background:transparent; border:0; color:var(--nx-text); font-size:22px;
              padding:6px 10px; cursor:pointer; line-height:1;">\u22ee</button>
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

    document.getElementById("t-kebab").addEventListener("click", () => this._showKebab());

    NX_THREAD_SEEN_IDS = new Set();
    await this._fetchAndRender();
    clearInterval(NX_THREAD_POLL);
    NX_THREAD_POLL = setInterval(() => this._fetchAndRender(true), 5000);
    window.addEventListener("hashchange", () => clearInterval(NX_THREAD_POLL), { once: true });
  },

  async _fetchAndRender(silent) {
    try {
      // v1.3.25 — fetch block-state alongside messages so we can lock
      // the composer if either side has blocked the other. block-state
      // endpoint is a NEW v1.3.25 route; clients on older builds simply
      // don't call it (they'll lock-via-403 on send instead).
      const [msgs, req, blockState] = await Promise.all([
        window.apiFetch(`/api/messages/${this._requestId}`),
        window.apiFetch(`/api/requests/${this._requestId}`).catch(() => null),
        window.apiFetch(`/api/messages/${this._requestId}/block-state`).catch(() => ({ block_state: "none" })),
      ]);
      this._blockState = blockState || { block_state: "none" };
      this._renderMessages(msgs, req);
      this._applyBlockLock();
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

  _applyBlockLock() {
    const state = (this._blockState && this._blockState.block_state) || "none";
    const input = document.getElementById("t-input");
    const sendBtn = document.getElementById("t-send");
    const form = document.getElementById("t-form");
    if (!input || !sendBtn || !form) return;
    if (state === "none") {
      input.disabled = false;
      sendBtn.disabled = false;
      input.placeholder = "Message…";
      const banner = document.getElementById("t-block-banner");
      if (banner) banner.remove();
      return;
    }
    // Locked composer. We deliberately use the same lock UX regardless
    // of who blocked whom (silent block — the blocked party isn't told
    // explicitly). Only the "i_blocked" branch tells the user how to
    // unlock (since they hold the key).
    input.disabled = true;
    sendBtn.disabled = true;
    input.placeholder = "Messaging unavailable";
    input.value = "";
    let bannerHTML = "";
    if (state === "i_blocked" || state === "both") {
      bannerHTML = `You blocked this user. <a href="#blocked-users" style="color:#22c55e; text-decoration:underline;">Unblock</a> from Profile → Blocked Users to resume.`;
    } else {
      bannerHTML = `Cannot send messages to this user.`;
    }
    let banner = document.getElementById("t-block-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "t-block-banner";
      banner.style.cssText =
        "padding:10px 14px; background:#2a1a1a; border-top:1px solid #ef4444; " +
        "color:#fca5a5; font-size:13px; text-align:center; line-height:1.5;";
      form.parentNode.insertBefore(banner, form);
    }
    banner.innerHTML = bannerHTML;
  },

  _showKebab() {
    const otherId = this._blockState && this._blockState.other_user_id;
    const state = (this._blockState && this._blockState.block_state) || "none";
    if (!otherId) {
      if (window.nxAlert) window.nxAlert("No other party in this thread yet.");
      return;
    }
    // If already blocked by me, show "Unblock" instead of "Block".
    const iBlocked = state === "i_blocked" || state === "both";
    const opts = iBlocked
      ? ["Unblock user", "Cancel"]
      : ["Block & Report user", "Cancel"];
    // Use nxSheet if available (action-sheet style), otherwise fall
    // back to nxConfirm semantics with the primary action.
    const handler = (idx) => {
      if (iBlocked && idx === 0) {
        this._unblockOther(otherId);
      } else if (!iBlocked && idx === 0) {
        this._blockOther(otherId);
      }
    };
    if (window.nxSheet) {
      window.nxSheet({
        title: iBlocked ? "Thread options" : "Block this user?",
        options: opts.map((label, i) => ({ label, value: i })),
        onSelect: handler,
      });
    } else {
      // Fallback: simple confirm with the primary action.
      window.nxConfirm(
        iBlocked
          ? "Unblock this user? They will see you again and you'll see them."
          : "Block this user? You won't see their messages or broadcasts anymore.",
        { okLabel: iBlocked ? "Unblock" : "Block", danger: !iBlocked }
      ).then(ok => { if (ok) handler(0); });
    }
  },

  async _blockOther(otherId) {
    const ok = await window.nxBlockUserFlow({
      userId: otherId,
      name: "this user",
    });
    if (ok) {
      // Refresh block state and lock the composer immediately.
      try {
        this._blockState = await window.apiFetch(
          `/api/messages/${this._requestId}/block-state`
        );
        this._applyBlockLock();
      } catch (_) {
        this._blockState = { block_state: "i_blocked", other_user_id: otherId };
        this._applyBlockLock();
      }
    }
  },

  async _unblockOther(otherId) {
    const ok = await window.nxConfirm(
      "Unblock this user? You'll see them in NextUp again and they'll see you.",
      { okLabel: "Unblock", cancelLabel: "Cancel" }
    );
    if (!ok) return;
    try {
      await window.apiFetch("/api/blocks/" + encodeURIComponent(otherId), { method: "DELETE" });
      if (window.toast) window.toast("Unblocked", "success");
      this._blockState = { block_state: "none", other_user_id: otherId };
      this._applyBlockLock();
    } catch (e) {
      window.nxAlert("Couldn't unblock: " + (e.message || e));
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
