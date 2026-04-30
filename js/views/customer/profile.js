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

            <div class="nx-form__row" id="row-nickname" style="cursor:pointer;">
              <div class="nx-form__label">
                Nickname
                <div style="font-size:11.5px; color:var(--nx-text-muted); font-weight:400; margin-top:3px; line-height:1.4;">(if you want to hide your real name and last name when broadcasting)</div>
              </div>
              <div class="nx-form__value">
                <span id="val-nickname">${u.nickname ? window.esc(u.nickname) : "Not set"}</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>

            ${(() => {
              const status = u.id_verification_status || "none";
              if (status === "verified") {
                return `<div class="nx-form__row" style="cursor:default;">
                  <div class="nx-form__label">ID Verification</div>
                  <div class="nx-form__value"><span style="color:#22c55e;">✓ Verified</span></div>
                </div>`;
              }
              if (status === "pending") {
                return `<div class="nx-form__row" style="cursor:default;">
                  <div class="nx-form__label">ID Verification</div>
                  <div class="nx-form__value"><span style="color:var(--nx-text-muted);">In review (~24h)</span></div>
                </div>`;
              }
              const isReject = status === "rejected";
              const reason = u.id_rejection_reason || "";
              return `<div style="margin:14px 0; padding:14px 16px; background:${isReject ? "#2a1a1a" : "#1a1a1a"}; border:1px solid ${isReject ? "#ef4444" : "#2a2a2a"}; border-radius:14px;">
                <div style="font-family:var(--nx-font-sans); font-size:14px; font-weight:600; color:${isReject ? "#ef4444" : "var(--nx-text)"}; margin-bottom:4px;">
                  ${isReject ? "ID verification rejected" : "Verify your identity (optional)"}
                </div>
                <div style="font-family:var(--nx-font-sans); font-size:12px; color:var(--nx-text-muted); line-height:1.5; margin-bottom:10px;">
                  ${isReject ? window.esc(reason || "Photos didn't pass review. Try again with a clearer ID and selfie.") : "Optional, but providers can filter for verified customers — verifying makes you eligible for more service categories. $5 one-time fee, automated via Persona, takes about 60 seconds."}
                </div>
                <button class="nx-cta" id="cust-verify-id-btn" type="button" style="background:${isReject ? "#ef4444" : "#22c55e"}; color:#000; font-weight:600; padding:10px 16px; min-height:auto; width:auto; display:inline-block;">
                  ${isReject ? "Try again" : "Start verification"}
                </button>
              </div>`;
            })()}

            <div class="nx-form__row" id="row-change-password" style="cursor:pointer;">
              <div class="nx-form__label">Password</div>
              <div class="nx-form__value">
                <span>Change</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>

            <a href="terms.html" class="nx-form__row" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; text-decoration:none; color:inherit;">
              <div class="nx-form__label">Terms of Service</div>
              <div class="nx-form__value">
                <span class="nx-form__chev">›</span>
              </div>
            </a>

            <a href="privacy.html" class="nx-form__row" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; text-decoration:none; color:inherit;">
              <div class="nx-form__label">Privacy Policy</div>
              <div class="nx-form__value">
                <span class="nx-form__chev">›</span>
              </div>
            </a>

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

    // Nickname — optional display name used as the auto-fallback for
    // anonymous broadcasts and visible across the app instead of the
    // user's full legal name when they want extra privacy.
    document.getElementById("row-nickname").addEventListener("click", async () => {
      const cur = (window.state.currentUser && window.state.currentUser.nickname) || "";
      const next = await window.nxPrompt(
        "Set a nickname (e.g. Alex, S.K., Houston Customer).\n\nWhy: a nickname gives you the option to present yourself to providers as either your real name or this nickname — your choice, every time you broadcast. Leave blank to clear.",
        { okLabel: "Save", placeholder: "Up to 30 characters", type: "text" }
      );
      if (next == null) return;             // user cancelled
      const trimmed = (next || "").trim().slice(0, 30);
      if (trimmed === cur) return;          // no change
      try {
        const res = await window.apiFetch("/api/auth/nickname", {
          method: "POST",
          body: { nickname: trimmed || null },
        });
        const u2 = await window.apiMe();
        window.persistUser(u2);
        window.Views.CustomerProfile.render();
        window.toast && window.toast(res.nickname ? "Nickname saved" : "Nickname cleared", "success");
      } catch (err) {
        window.nxAlert("Couldn't save: " + (err.message || err));
      }
    });

    document.getElementById("sign-out-btn").addEventListener("click", async () => {
      if (!(await window.nxConfirm("Sign out?", { okLabel: "Sign out", danger: true }))) return;
      window.clearSession();
      window.navigate("role-select");
    });

    document.getElementById("delete-account-btn").addEventListener("click", async () => {
      await window.nxDeleteAccountFlow();
    });

    // Customer-side ID verification CTA (shown when not verified)
    const custVerifyBtn = document.getElementById("cust-verify-id-btn");
    if (custVerifyBtn) {
      custVerifyBtn.addEventListener("click", () => window.navigate("verify-id"));
    }

    window.bindCustomerTabBar();
  },
};
