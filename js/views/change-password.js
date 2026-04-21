/* =============================================================
   NextUp — Change Password (logged-in flow)
   Route: #change-password
   Requires the current password (no magic-link / no email roundtrip).
   ============================================================= */

window.Views.ChangePassword = {
  render() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Change password</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:18px 0 24px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:26px; color:var(--nx-text); margin-bottom:6px;">Update password</div>
            <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); max-width:320px; margin:0 auto;">
              Enter your current password, then a new one. You'll stay signed in.
            </div>
          </div>

          <form id="cp-form" class="nx-form">
            <div class="nx-form__row">
              <div class="nx-form__label">Current password</div>
              <input class="nx-auth-input" type="password" id="cp-current" required autocomplete="current-password" placeholder="Current password">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">New password</div>
              <input class="nx-auth-input" type="password" id="cp-new" required minlength="6" autocomplete="new-password" placeholder="At least 6 characters">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">Confirm new password</div>
              <input class="nx-auth-input" type="password" id="cp-confirm" required minlength="6" autocomplete="new-password" placeholder="Re-enter new password">
            </div>
            <div id="cp-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>
            <button type="submit" class="nx-cta" id="cp-submit">Update password</button>
          </form>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.history.back());

    const form = document.getElementById("cp-form");
    const err = document.getElementById("cp-err");
    const btn = document.getElementById("cp-submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.style.display = "none";
      const current = document.getElementById("cp-current").value;
      const next = document.getElementById("cp-new").value;
      const confirm = document.getElementById("cp-confirm").value;
      if (next !== confirm) {
        err.textContent = "New passwords don't match.";
        err.style.display = "block";
        return;
      }
      if (next.length < 6) {
        err.textContent = "New password must be at least 6 characters.";
        err.style.display = "block";
        return;
      }
      if (current === next) {
        err.textContent = "New password must be different from the current one.";
        err.style.display = "block";
        return;
      }
      btn.disabled = true; btn.textContent = "Updating…";
      try {
        await window.apiFetch("/api/auth/change-password", {
          method: "POST",
          body: { current_password: current, new_password: next },
        });
        window.toast && window.toast("Password updated.", "success");
        window.history.back();
      } catch (ex) {
        err.textContent = ex.message || "Couldn't update password.";
        err.style.display = "block";
        btn.disabled = false; btn.textContent = "Update password";
      }
    });
  },
};
