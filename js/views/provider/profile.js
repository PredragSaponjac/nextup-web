/* =============================================================
   NextUp — Provider Profile
   Business name · category · city · phone · availability.
   Tap "Edit" to modify business fields (not category — immutable
   today to avoid breaking service matching mid-bookings).
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

          <div class="nx-form" id="profile-view" style="padding-top:0;">
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
              <div class="nx-form__label">Services</div>
              <div class="nx-form__value"><span style="color:var(--nx-text-muted); font-size:13px;">${window.esc((profile && Array.isArray(profile.services) && profile.services.length) ? profile.services.join(", ") : "All in category")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">City</div>
              <div class="nx-form__value"><span>${window.esc((profile && profile.city) || "Not set")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">State</div>
              <div class="nx-form__value"><span style="color:${profile && profile.state ? "var(--nx-text)" : "#ef4444"};">${window.esc((profile && profile.state) || "Not set \u2014 Edit to fix")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">ZIP</div>
              <div class="nx-form__value"><span>${window.esc((profile && profile.zip) || "\u2014")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">Phone</div>
              <div class="nx-form__value"><span>${window.esc((profile && profile.phone) || u.phone || "Not set")}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">Location</div>
              <div class="nx-form__value"><span style="color:${profile && profile.lat ? "var(--nx-text)" : "#ef4444"};">${profile && profile.lat ? "Set" : "Not set \u2014 Edit to fix"}</span></div>
            </div>
            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">Availability</div>
              <div class="nx-form__value"><span style="color:${profile && profile.is_online ? "#22c55e" : "var(--nx-text-muted)"}">${profile && profile.is_online ? "Online" : "Offline"}</span></div>
            </div>

            <button class="nx-cta" id="edit-btn" type="button" style="background:transparent; border:1px solid var(--nx-border); color:var(--nx-text); margin-top:18px;">Edit profile</button>

            <div class="nx-form__row" id="row-billing" style="cursor:pointer; margin-top:14px;">
              <div class="nx-form__label">Billing</div>
              <div class="nx-form__value">
                <span>Subscription &amp; plans</span>
                <span class="nx-form__chev">\u203a</span>
              </div>
            </div>

            <div class="nx-form__row" id="row-change-password" style="cursor:pointer;">
              <div class="nx-form__label">Password</div>
              <div class="nx-form__value">
                <span>Change</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>

            ${biometricAvailable ? `
              <div class="nx-form__row" id="row-biometric" style="cursor:pointer;">
                <div class="nx-form__label">Sign in with Face ID</div>
                <div class="nx-form__value">
                  <span id="val-biometric">${biometricOn ? "On" : "Off"}</span>
                  <span class="nx-form__chev" style="color:${biometricOn ? "#22c55e" : ""}">${biometricOn ? "\u25cf" : "\u25cb"}</span>
                </div>
              </div>
            ` : ``}

            <div class="nx-form__row" style="cursor:default;">
              <div class="nx-form__label">App version</div>
              <div class="nx-form__value"><span>${window.esc((window.NEXTUP_CONFIG && window.NEXTUP_CONFIG.VERSION) || "1.0.0")}</span></div>
            </div>
          </div>

          <div id="profile-edit" style="display:none; padding-top:0;">
            <form id="edit-form" class="nx-form">
              <div class="nx-form__row">
                <div class="nx-form__label">Business name</div>
                <input class="nx-auth-input" type="text" id="e-business" required value="${window.esc((profile && profile.business_name) || "")}">
              </div>
              <div class="nx-form__row">
                <div class="nx-form__label">Category</div>
                <select class="nx-auth-input" id="e-category" required>
                  <option value="">Select category\u2026</option>
                  ${Object.keys(window.SERVICES_TAXONOMY || {}).map(k => {
                    const cat = window.SERVICES_TAXONOMY[k];
                    const sel = profile && profile.category === k ? "selected" : "";
                    return `<option value="${k}" ${sel}>${window.esc(cat.label || k)}</option>`;
                  }).join("")}
                </select>
              </div>
              <div class="nx-form__row">
                <div class="nx-form__label">Services you offer</div>
                <textarea class="nx-auth-input" id="e-services" rows="3" placeholder="Hair, Nails, Makeup" style="resize:vertical; min-height:68px;">${window.esc((profile && Array.isArray(profile.services)) ? profile.services.join(", ") : "")}</textarea>
                <div style="font-size:11px; color:var(--nx-text-muted); margin-top:6px;">Comma-separated list. Leave empty to receive all requests in the category.</div>
              </div>
              <div class="nx-form__row">
                <div class="nx-form__label">Phone</div>
                <input class="nx-auth-input" type="tel" id="e-phone" value="${window.esc((profile && profile.phone) || "")}" placeholder="+1 \u2026">
              </div>

              <div class="nx-form__row" style="flex-direction:column; align-items:stretch;">
                ${window.nxLocationPicker ? window.nxLocationPicker.render("edit-loc", { initial: profile || {} }) : `<div>Loading location picker\u2026</div>`}
              </div>

              <div id="edit-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>

              <button type="submit" class="nx-cta" id="save-btn" style="margin-top:18px;">Save changes</button>
              <button type="button" class="nx-cta" id="cancel-edit-btn" style="background:transparent; border:1px solid var(--nx-border); color:var(--nx-text); margin-top:10px;">Cancel</button>
            </form>
          </div>

          <button class="nx-cta" id="sign-out-btn" style="margin-top:24px; background:transparent; border:1px solid var(--nx-border-soft); color:var(--nx-text-muted);">Sign out</button>
        </div>
        ${window.providerTabBar("profile")}
      </div>
    `);

    // ---- Mode switch ----
    const rowSwitchCust = document.getElementById("row-switch-customer");
    if (rowSwitchCust) {
      rowSwitchCust.addEventListener("click", () => {
        window.setActiveMode("customer");
        window.navigate("home");
      });
    }

    // ---- Biometric toggle ----
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
        chev.textContent = turningOn ? "\u25cf" : "\u25cb";
        chev.style.color = turningOn ? "#22c55e" : "";
      });
    }

    // ---- Billing ----
    document.getElementById("row-billing").addEventListener("click", () => {
      window.navigate("billing");
    });

    // ---- Change password ----
    document.getElementById("row-change-password").addEventListener("click", () => {
      window.navigate("change-password");
    });

    // ---- Edit <-> View ----
    const viewPanel = document.getElementById("profile-view");
    const editPanel = document.getElementById("profile-edit");
    document.getElementById("edit-btn").addEventListener("click", () => {
      viewPanel.style.display = "none";
      editPanel.style.display = "";
      if (window.nxLocationPicker) window.nxLocationPicker.bind("edit-loc");
    });
    document.getElementById("cancel-edit-btn").addEventListener("click", () => {
      editPanel.style.display = "none";
      viewPanel.style.display = "";
    });

    // ---- Save edits ----
    document.getElementById("edit-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = document.getElementById("edit-err");
      const btn = document.getElementById("save-btn");
      err.style.display = "none";
      const newCategory = (document.getElementById("e-category") && document.getElementById("e-category").value.trim())
        || (profile ? profile.category : "beauty");
      const servicesRaw = (document.getElementById("e-services") && document.getElementById("e-services").value.trim()) || "";
      const servicesList = servicesRaw
        ? servicesRaw.split(",").map(s => s.trim()).filter(Boolean)
        : null;

      // Read from the 3-option location picker; falls back to existing
      // profile values when the user didn't touch it so we never wipe
      // location just by saving an unrelated field.
      const loc = window.nxLocationPicker
        ? await window.nxLocationPicker.getValue("edit-loc")
        : { source: "gps", lat: null, lng: null, address: null, city: null, state: null, zip: null };
      const preserve = loc.lat == null && loc.lng == null && !loc.address && !loc.city && !loc.state && !loc.zip;

      const body = {
        business_name: document.getElementById("e-business").value.trim(),
        category: newCategory,
        address: preserve ? (profile && profile.address) : loc.address,
        city:    preserve ? (profile && profile.city)    : loc.city,
        state:   preserve ? (profile && profile.state)   : loc.state,
        zip:     preserve ? (profile && profile.zip)     : loc.zip,
        lat:     preserve ? (profile && profile.lat)     : loc.lat,
        lng:     preserve ? (profile && profile.lng)     : loc.lng,
        phone: document.getElementById("e-phone").value.trim() || null,
        services: servicesList,
      };
      if (!body.business_name) {
        err.textContent = "Business name is required."; err.style.display = "block"; return;
      }
      if (!body.category) {
        err.textContent = "Category is required."; err.style.display = "block"; return;
      }
      // If category changed and services were previously set, warn user
      if (profile && profile.category && profile.category !== newCategory && body.services && body.services.length) {
        if (!confirm(`You're changing category to "${newCategory}". Your current services list (${body.services.join(", ")}) may not match the new category. Continue?`)) {
          btn.disabled = false; btn.textContent = "Save changes";
          return;
        }
      }
      btn.disabled = true; btn.textContent = "Saving\u2026";
      try {
        await window.apiFetch("/api/providers/profile", { method: "POST", body });
        window.toast && window.toast("Profile updated.", "success");
        // Re-render to reflect saved state
        window.Views.ProviderProfile.render();
      } catch (ex) {
        err.textContent = ex.message || "Couldn't save.";
        err.style.display = "block";
        btn.disabled = false; btn.textContent = "Save changes";
      }
    });

    document.getElementById("sign-out-btn").addEventListener("click", () => {
      if (!confirm("Sign out of NextUp?")) return;
      window.clearSession();
      window.navigate("role-select");
    });

    window.bindProviderTabBar();
  },
};
