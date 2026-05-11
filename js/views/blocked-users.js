/* =============================================================
   NextUp — Blocked Users management (v1.3.25)
   Route: #blocked-users
   Shared between customer + provider modes (role:null in router).

   Lists everyone the current user has blocked. Tap "Unblock" to
   remove a block. New blocks are added from the kebab menus on:
     - Provider profile view (customer mode)
     - Response card (customer mode)
     - Message thread header (both modes)
     - Provider's incoming request card (provider mode)

   Apple App Store Review Guideline 1.2 (User Safety) requires the
   ability to block AND a way to manage existing blocks — this screen
   satisfies the management half.
   ============================================================= */

window.Views.BlockedUsers = {
  async render() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Blocked Users</span>
            <div></div>
          </header>

          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Blocked Users</h1>
            <div class="nx-listhead__sub" id="bu-subtitle">Loading…</div>
          </div>

          <div id="bu-list"></div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.history.back());

    await this._reload();
  },

  async _reload() {
    let blocks = [];
    try {
      blocks = await window.apiFetch("/api/blocks");
    } catch (e) {
      document.getElementById("bu-list").innerHTML = `
        <div class="nx-empty">
          <div class="nx-empty__title">Couldn’t load</div>
          <div>${window.esc(e.message || "Try again later.")}</div>
        </div>`;
      document.getElementById("bu-subtitle").textContent = "Error";
      return;
    }

    const sub = document.getElementById("bu-subtitle");
    const list = document.getElementById("bu-list");

    if (!Array.isArray(blocks) || blocks.length === 0) {
      sub.textContent = "0 blocked users";
      list.innerHTML = `
        <div class="nx-empty" style="padding:36px 16px;">
          <div class="nx-empty__title">You haven’t blocked anyone</div>
          <div style="color:var(--nx-text-muted); font-size:14px; line-height:1.5; margin-top:8px;">
            When you block a user from their profile or a message thread,
            they’ll show up here so you can unblock them later.
          </div>
        </div>`;
      return;
    }

    sub.textContent = blocks.length + " blocked user" + (blocks.length === 1 ? "" : "s");

    list.innerHTML = blocks.map(b => {
      const name = b.nickname || b.full_name || ("User #" + b.user_id);
      const when = window.timeAgo ? window.timeAgo(b.created_at) : "";
      const reasonHTML = b.reason
        ? `<div style="font-size:13px; color:var(--nx-text-muted); margin-top:6px; line-height:1.4;">
             Reason: ${window.esc(b.reason)}
           </div>`
        : "";
      const reportBadge = b.also_reported
        ? `<span style="display:inline-block; margin-left:6px; padding:1px 8px; font-size:11px;
              border-radius:8px; background:#2a1a1a; color:#ef4444; border:1px solid #ef4444;">
             Reported
           </span>`
        : "";
      return `
        <div class="nx-respcard" data-user-id="${b.user_id}" style="cursor:default;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <div style="min-width:0; flex:1;">
              <div style="font-family:var(--nx-font-serif); font-size:17px; font-weight:600;">
                ${window.esc(name)}${reportBadge}
              </div>
              ${when ? `<div style="font-size:12px; color:var(--nx-text-muted); margin-top:3px;">Blocked ${window.esc(when)}</div>` : ""}
              ${reasonHTML}
            </div>
            <button class="nx-cta bu-unblock-btn" data-user-id="${b.user_id}" data-name="${window.esc(name)}"
              type="button" style="background:transparent; color:#22c55e; border:1px solid #22c55e;
              padding:8px 16px; min-height:auto; width:auto; font-size:14px;">
              Unblock
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Wire unblock buttons
    list.querySelectorAll(".bu-unblock-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const userId = btn.getAttribute("data-user-id");
        const name = btn.getAttribute("data-name");
        const ok = await window.nxConfirm(
          `Unblock ${name}?\n\nYou’ll see them again, and they’ll see you. ` +
          `Past message threads remain in your history either way.`,
          { okLabel: "Unblock", cancelLabel: "Cancel" }
        );
        if (!ok) return;
        btn.disabled = true;
        btn.textContent = "Unblocking…";
        try {
          await window.apiFetch("/api/blocks/" + encodeURIComponent(userId), { method: "DELETE" });
          if (window.toast) window.toast("Unblocked " + name, "success");
          await this._reload();
        } catch (err) {
          btn.disabled = false;
          btn.textContent = "Unblock";
          if (window.nxAlert) {
            window.nxAlert("Couldn’t unblock: " + (err.message || err));
          }
        }
      });
    });
  },
};
