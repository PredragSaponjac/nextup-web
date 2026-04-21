/* =============================================================
   NextUp — Forgot Password
   Two-step: (1) enter email → backend emails a 6-digit code
             (2) enter code + new password → backend verifies + logs in
   Route: #forgot-password
   ============================================================= */

window.Views.AuthForgot = {
  async render() {
    this._renderStep1();
  },

  _renderStep1(prefillEmail) {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Forgot password</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:16px 0 24px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:26px; color:var(--nx-text); margin-bottom:6px;">No worries.</div>
            <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); max-width:320px; margin:0 auto;">
              Enter the email you signed up with. We'll send you a 6-digit code so you can set a new password.
            </div>
          </div>

          <form id="fp-form" class="nx-form">
            <div class="nx-form__row">
              <div class="nx-form__label">Email</div>
              <input class="nx-auth-input" type="email" id="fp-email" required autocomplete="email" inputmode="email"
                placeholder="you@example.com" value="${window.esc(prefillEmail || "")}">
            </div>
            <div id="fp-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>
            <button type="submit" class="nx-cta" id="fp-submit">Send code</button>
          </form>

          <div style="text-align:center; padding:18px 0; font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted);">
            Remembered it? <span class="link-inline" id="go-login">Sign in</span>
          </div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.navigate("login"));
    document.getElementById("go-login").addEventListener("click", () => window.navigate("login"));

    const form = document.getElementById("fp-form");
    const err = document.getElementById("fp-err");
    const btn = document.getElementById("fp-submit");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.style.display = "none";
      const email = document.getElementById("fp-email").value.trim();
      if (!email) return;
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        await window.apiFetch("/api/auth/forgot-password", {
          method: "POST",
          body: { email },
        });
        // Backend always returns 200 — whether the email exists or not — to prevent
        // account enumeration. So we always advance the UI; if the email is unknown
        // the user just won't get anything in their inbox.
        this._renderStep2(email);
      } catch (ex) {
        err.textContent = ex.message || "Could not send. Try again.";
        err.style.display = "block";
        btn.disabled = false; btn.textContent = "Send code";
      }
    });
  },

  _renderStep2(email) {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Enter code</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:16px 0 24px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:26px; color:var(--nx-text); margin-bottom:6px;">Check your email.</div>
            <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); max-width:320px; margin:0 auto;">
              We sent a 6-digit code to <strong style="color:var(--nx-text);">${window.esc(email)}</strong>. It expires in 15 minutes.
            </div>
          </div>

          <form id="rp-form" class="nx-form">
            <div class="nx-form__row">
              <div class="nx-form__label">6-digit code</div>
              <input class="nx-auth-input" type="text" id="rp-code" required
                inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"
                placeholder="123456" style="font-family:'SF Mono',Menlo,monospace; letter-spacing:0.2em; font-size:18px;">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">New password</div>
              <input class="nx-auth-input" type="password" id="rp-pass" required minlength="6"
                autocomplete="new-password" placeholder="At least 6 characters">
            </div>
            <div id="rp-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>
            <button type="submit" class="nx-cta" id="rp-submit">Set new password</button>
          </form>

          <div style="text-align:center; padding:18px 0; font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted);">
            Didn't get it?
            <span class="link-inline" id="resend">Resend code</span>
            &middot; <span class="link-inline" id="wrong-email">Wrong email?</span>
          </div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => this._renderStep1(email));
    document.getElementById("wrong-email").addEventListener("click", () => this._renderStep1(email));

    document.getElementById("resend").addEventListener("click", async () => {
      try {
        await window.apiFetch("/api/auth/forgot-password", {
          method: "POST",
          body: { email },
        });
        window.toast && window.toast("New code sent. Check your email.", "success");
      } catch (e) {
        alert("Couldn't resend: " + (e.message || ""));
      }
    });

    const form = document.getElementById("rp-form");
    const err = document.getElementById("rp-err");
    const btn = document.getElementById("rp-submit");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.style.display = "none";
      const code = document.getElementById("rp-code").value.trim();
      const newPass = document.getElementById("rp-pass").value;
      if (!code || !newPass) return;
      btn.disabled = true; btn.textContent = "Setting password…";
      try {
        const data = await window.apiFetch("/api/auth/reset-password", {
          method: "POST",
          body: { email, code, new_password: newPass },
        });
        // Backend returns a fresh JWT so we can log them in immediately
        window.persistToken(data.access_token);
        const me = await window.apiMe();
        window.persistUser(me);
        window.persistRole(me.role === "provider" ? "provider" : "customer");
        const mode = (me.has_provider_profile && me.role === "provider") ? "provider" : "customer";
        window.setActiveMode(mode);
        window.state.biometricUnlocked = true;
        window.toast && window.toast("Password reset. You're signed in.", "success");
        window.navigate(mode === "provider" ? "dashboard" : "home");
      } catch (ex) {
        err.textContent = ex.message || "That didn't work. Double-check the code.";
        err.style.display = "block";
        btn.disabled = false; btn.textContent = "Set new password";
      }
    });
  },
};
