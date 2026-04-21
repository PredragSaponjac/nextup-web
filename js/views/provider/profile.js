/* =============================================================
   NextUp — Provider Profile
   Business name, category, city, phone, availability, sign out.
   Route: #p-profile
   ============================================================= */

window.Views.ProviderProfile = {
  async render() {
    const u = window.state.currentUser || {};
    let profile = null;
    try {
      profile = await window.apiFetch("/api/providers/profile");
    } catch (_) {}
    const biometricAvailable = await (window.nxBiometricAvailable ? window.nxBiometricAvailable() : false);
    const biometricOn = !!window.state.biometricEnabled;

    const catLabel = (profile && window.SERVICES_TAXONOMY && window.SERVICES_TAXONOMY[profile.category])
      ? window.SERVICES_TAXONOMY[profile.category].label
      : (profile && profile.category) || "Not set";

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>

          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Profile</h1>
            <div class="nx-listhead__sub">${window.esc(u.full_name || "")}${u.email ? " · " + window.esc(u.email) : ""}</div>
          </div>

          <div class="nx-form" style="padding-top:0;">
            <div class="nx-form__row" id="row-switch-customer" style="cursor:pointer;">
              <div class="nx-form__label">Mode</div>
              <div class="nx-form__value">
                <span>Switch to customer mode</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">Business</div>
              <div class="nx-form__value"><span>${window.esc((profile && profile.business_name) || "Not set")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">Category</div>
              <div class="nx-form__value"><span>${window.esc(catLabel)}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">City</div>
              <div class="nx-form__value"><span>${window.esc((profile && profile.city) || "Not set")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">Phone</div>
              <div class="nx-form__value"><span>${window.esc((profile && profile.phone) || u.phone || "Not set")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">Availability</div>
              <div class="nx-form__value"><span style="color:${profile && profile.is_online ? "#22c55e" : "var(--nx-text-muted)"}">${profile && profile.is_online ? "Online" : "Offline"}</span></div>
            </div>
            ${biometricAvailable ? `
              <div class="nx-form__row" id="row-biometric" style="cursor:pointer;">
                <div class="nx-form__label">Sign in with Face ID</div>
                <div class="nx-form__value">
                  <span id="val-biometric">${biometricOn ? "On" : "Off"}</span>
                  <span class="nx-form__chev" style="color:${biometricOn ? "#22c55e" : ""}">${biometricOn ? "●" : "○"}</span>
                </div>
              </div>
            ` : ``}
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">App version</div>
              <div class="nx-form__value"><span>${window.esc((window.NEXTUP_CONFIG && window.NEXTUP_CONFIG.VERSION) || "1.0.0")}</span></div>
            </div>
          </div>

          <button class="nx-cta" id="sign-out-btn" style="margin-top:24px;">Sign out</button>
        </div>
        ${window.providerTabBar("profile")}
      </div>
    `);

    const rowSwitchCust = document.getElementById("row-switch-customer");
    if (rowSwitchCust) {
      rowSwitchCust.addEventListener("click", () => {
        window.setActiveMode("customer");
        window.navigate("home");
      });
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

    document.getElementById("sign-out-btn").addEventListener("click", () => {
      if (!confirm("Sign out of NextUp?")) return;
      window.clearSession();
      window.navigate("role-select");
    });

    window.bindProviderTabBar();
  },
};
