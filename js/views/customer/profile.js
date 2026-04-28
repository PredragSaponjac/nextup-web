/* =============================================================
   NextUp — Customer Profile / Settings
   Sign out · Face ID toggle · Switch to provider mode · Become a provider.
   Route: #profile
   ============================================================= */

window.Views.CustomerProfile = {
  async render() {
    const u = window.state.currentUser || {};
    const name = u.full_name || "NextUp user";
    const email = u.email || "";
    const hasProvider = !!u.has_provider_profile;

    const biometricAvailable = await (window.nxBiometricAvailable ? window.nxBiometricAvailable() : false);
    const biometricOn = !!window.state.biometricEnabled;

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>

          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Profile</h1>
            <div class="nx-listhead__sub">${window.esc(name)} · ${window.esc(email)}</div>
          </div>

          <div class="nx-form" style="padding-top:0;">
            ${hasProvider ? `
              <div class="nx-form__row" id="row-switch-provider" style="cursor:pointer;">
                <div class="nx-form__label">Mode</div>
                <div class="nx-form__value">
                  <span>Switch to provider mode</span>
                  <span class="nx-form__chev">›</span>
                </div>
              </div>
            ` : `
              <div class="nx-form__row" id="row-become-provider" style="cursor:pointer;">
                <div class="nx-form__label">Also offer services?</div>
                <div class="nx-form__value">
                  <span>Become a provider</span>
                  <span class="nx-form__chev">›</span>
                </div>
              </div>
            `}

            ${biometricAvailable ? `
              <div class="nx-form__row" id="row-biometric" style="cursor:pointer;">
                <div class="nx-form__label">Sign in with Face ID</div>
                <div class="nx-form__value">
                  <span id="val-biometric">${biometricOn ? "On" : "Off"}</span>
                  <span class="nx-form__chev" style="color:${biometricOn ? "#22c55e" : ""}">${biometricOn ? "●" : "○"}</span>
                </div>
              </div>
            ` : ``}

            <div class="nx-form__row" id="row-change-password" style="cursor:pointer;">
              <div class="nx-form__label">Password</div>
              <div class="nx-form__value">
                <span>Change</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>

            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">App version</div>
              <div class="nx-form__value">
                <span>${window.esc((window.NEXTUP_CONFIG && window.NEXTUP_CONFIG.VERSION) || "1.0.0")}</span>
              </div>
            </div>
          </div>

          <button class="nx-cta" id="sign-out-btn" style="margin-top:24px;">Sign out</button>

          <button class="nx-cta" id="delete-account-btn"
            style="margin-top:12px; background:transparent; border:1px solid #ef4444; color:#ef4444;">
            Delete account
          </button>
          <div style="font-size:11px; color:var(--nx-text-muted); text-align:center; padding:8px 0 4px;">
            Permanently removes your profile, requests and messages. This can't be undone.
          </div>
        </div>

        ${window.customerTabBar("profile")}
      </div>
    `);

    // Switch into provider mode (existing provider profile)
    const rowSwitch = document.getElementById("row-switch-provider");
    if (rowSwitch) {
      rowSwitch.addEventListener("click", () => {
        window.setActiveMode("provider");
        window.navigate("dashboard");
      });
    }

    // Become a provider (no profile yet)
    const rowBecome = document.getElementById("row-become-provider");
    if (rowBecome) {
      rowBecome.addEventListener("click", () => window.navigate("become-provider"));
    }

    const rowBio = document.getElementById("row-biometric");
    if (rowBio) {
      rowBio.addEventListener("click", async () => {
        const turningOn = !window.state.biometricEnabled;
        if (turningOn) {
          const ok = await window.nxBiometricAuthenticate("Enable Face ID for NextUp");
          if (!ok) return;
        }
        window.setBiometricEnabled(turningOn);
        document.getElementById("val-biometric").textContent = turningOn ? "On" : "Off";
        const chev = rowBio.querySelector(".nx-form__chev");
        chev.textContent = turningOn ? "●" : "○";
        chev.style.color = turningOn ? "#22c55e" : "";
      });
    }

    document.getElementById("row-change-password").addEventListener("click", () => {
      window.navigate("change-password");
    });

    document.getElementById("sign-out-btn").addEventListener("click", async () => {
      if (!(await window.nxConfirm("Sign out?", { okLabel: "Sign out", danger: true }))) return;
      window.clearSession();
      window.navigate("role-select");
    });

    document.getElementById("delete-account-btn").addEventListener("click", async () => {
      await window.nxDeleteAccountFlow();
    });

    window.bindCustomerTabBar();
  },
};
