/* =============================================================
   NextUp — Auth (customer-only, dark theme)
   Login + Register screens.
   ============================================================= */

window.Views.Auth = {
  renderLogin() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Sign In</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:12px 0 30px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:26px; color:var(--nx-text);">Welcome back</div>
          </div>

          <form id="login-form" class="nx-form">
            <div class="nx-form__row">
              <div class="nx-form__label">Email</div>
              <input class="nx-auth-input" type="email" id="login-email" required autocomplete="email" inputmode="email" placeholder="you@example.com">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">Password</div>
              <input class="nx-auth-input" type="password" id="login-password" required autocomplete="current-password" placeholder="••••••••">
            </div>
            <div id="login-error" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>
            <button type="submit" class="nx-cta" id="submit-btn">Sign In</button>
          </form>

          <div style="text-align:center; padding:14px 0 4px;">
            <span class="link-inline" id="go-forgot" style="font-size:13px; color:var(--nx-text-muted);">Forgot password?</span>
          </div>
          <div style="text-align:center; padding:10px 0 18px; font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted);">
            New here? <span class="link-inline" id="go-register">Create an account</span>
          </div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.navigate("role-select"));
    window.nxAttachEye && window.nxAttachEye("login-password");
    document.getElementById("go-register").addEventListener("click", () => {
      window.persistPendingRole("customer");
      window.navigate("register");
    });
    document.getElementById("go-forgot").addEventListener("click", () => {
      window.navigate("forgot-password");
    });

    const form = document.getElementById("login-form");
    const errEl = document.getElementById("login-error");
    const btn = document.getElementById("submit-btn");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errEl.style.display = "none";
      btn.disabled = true; btn.textContent = "Signing in…";
      try {
        const data = await window.apiLogin(
          document.getElementById("login-email").value.trim(),
          document.getElementById("login-password").value,
        );
        window.persistToken(data.access_token);
        const me = await window.apiMe();
        window.persistUser(me);
        const role = me.role === "provider" ? "provider" : "customer";
        window.persistRole(role);
        // Active mode defaults to "provider" if they have a provider profile AND that was their primary role.
        // Otherwise customer. User can toggle anytime from Profile.
        const mode = (me.has_provider_profile && me.role === "provider") ? "provider" : "customer";
        window.setActiveMode(mode);
        window.state.biometricUnlocked = true;
        await window.maybeOfferBiometricAfterLogin();
        window.nxPushRegister && window.nxPushRegister();
        window.navigate(mode === "provider" ? "dashboard" : "home");
      } catch (ex) {
        errEl.textContent = ex.message || "Could not sign in";
        errEl.style.display = "block";
        btn.disabled = false; btn.textContent = "Sign In";
      }
    });
  },

  renderRegister() {
    const role = window.state.pendingRole || "customer";
    const isProvider = role === "provider";
    const title = isProvider ? "Become a Provider" : "Create Account";
    const subHeadline = isProvider ? "Get matched with customers nearby." : "Find nearby providers.";
    const subSubline = isProvider ? "3 months free, then $19/month. Cancel anytime." : "Broadcast your request in seconds.";

    // Build category options for provider — pulled from the taxonomy
    const catKeys = Object.keys(window.SERVICES_TAXONOMY || {});
    const catOptions = catKeys.map(k => ({ value: k, label: (window.SERVICES_TAXONOMY[k].label || k) }));

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">${window.esc(title)}</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:12px 0 24px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:26px; color:var(--nx-text); margin-bottom:6px;">${window.esc(subHeadline)}</div>
            <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted);">${window.esc(subSubline)}</div>
          </div>

          <form id="register-form" class="nx-form">
            ${isProvider ? `
              <div class="nx-form__row">
                <div class="nx-form__label">Business name</div>
                <input class="nx-auth-input" type="text" id="reg-business" required placeholder="e.g. Studio Noir">
              </div>
            ` : ``}
            <div class="nx-form__row">
              <div class="nx-form__label">${isProvider ? "Your name (owner)" : "Full name"}</div>
              <input class="nx-auth-input" type="text" id="reg-name" required autocomplete="name" placeholder="Your name">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">Email</div>
              <input class="nx-auth-input" type="email" id="reg-email" required autocomplete="email" inputmode="email" placeholder="you@example.com">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">Phone${isProvider ? "" : " (optional)"}</div>
              <input class="nx-auth-input" type="tel" id="reg-phone" ${isProvider ? "required" : ""} autocomplete="tel" inputmode="tel" placeholder="+1 …">
            </div>
            ${isProvider ? `
              <div class="nx-form__row" id="row-category" style="cursor:pointer;">
                <div class="nx-form__label">Service category</div>
                <div class="nx-form__value">
                  <span id="val-category">Select a category…</span>
                  <span class="nx-form__chev">›</span>
                </div>
              </div>
              <div class="nx-form__row" id="row-subs" style="cursor:pointer; display:none;">
                <div class="nx-form__label">What you offer</div>
                <div class="nx-form__value">
                  <span id="val-subs">Pick a category first</span>
                  <span class="nx-form__chev">›</span>
                </div>
              </div>
              <div class="nx-form__row" id="row-finetune" style="cursor:pointer; display:none;">
                <div class="nx-form__label">Fine-tune specific services <span style="color:var(--nx-text-muted); font-weight:400;">(optional)</span></div>
                <div class="nx-form__value">
                  <span id="val-finetune">All services included</span>
                  <span class="nx-form__chev">›</span>
                </div>
              </div>
              <div class="nx-form__row" style="flex-direction:column; align-items:stretch;">
                ${window.nxLocationPicker ? window.nxLocationPicker.render("reg-loc", {}) : `<div>Loading location picker…</div>`}
              </div>
            ` : ``}
            <div class="nx-form__row">
              <div class="nx-form__label">Password</div>
              <input class="nx-auth-input" type="password" id="reg-password" required minlength="6" autocomplete="new-password" placeholder="At least 6 characters">
            </div>
            <div id="reg-error" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>
            <button type="submit" class="nx-cta" id="submit-btn">${isProvider ? "Start 3 Months Free" : "Create Account"}</button>
          </form>

          <div style="text-align:center; padding:18px 0; font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted);">
            Have an account? <span class="link-inline" id="go-login">Sign in</span>
          </div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.navigate("role-select"));
    document.getElementById("go-login").addEventListener("click", () => window.navigate("login"));
    window.nxAttachEye && window.nxAttachEye("reg-password");

    // Location picker (provider only) — wire radio/panel + GPS button listeners
    if (isProvider && window.nxLocationPicker) {
      window.nxLocationPicker.bind("reg-loc");
    }

    // Category + subcategory + optional fine-tune flow (provider only)
    let selectedCategory = null;
    let selectedSubs = [];          // subcategory keys the provider offers
    let selectedServiceNames = [];  // specific service names (auto-populated from subs, optionally fine-tuned)

    const servicesFromSubs = (catKey, subKeys) => {
      const cat = (window.SERVICES_TAXONOMY || {})[catKey];
      if (!cat) return [];
      const list = [];
      subKeys.forEach(k => {
        const sub = (cat.subcategories || {})[k];
        if (sub && sub.services) list.push(...sub.services);
      });
      return list;
    };

    const refreshSubsLabel = () => {
      const el = document.getElementById("val-subs");
      if (!el) return;
      if (!selectedCategory) { el.textContent = "Pick a category first"; return; }
      const total = Object.keys((window.SERVICES_TAXONOMY[selectedCategory] || {}).subcategories || {}).length;
      if (!selectedSubs.length) el.textContent = "Pick services";
      else if (selectedSubs.length === total) el.textContent = `All service types`;
      else el.textContent = `${selectedSubs.length} of ${total} selected`;
    };

    const refreshFinetuneLabel = () => {
      const el = document.getElementById("val-finetune");
      if (!el) return;
      const all = servicesFromSubs(selectedCategory, selectedSubs);
      if (!all.length) { el.textContent = "—"; return; }
      if (selectedServiceNames.length === all.length) el.textContent = `All ${all.length} services included`;
      else el.textContent = `${selectedServiceNames.length} of ${all.length} services`;
    };

    if (isProvider) {
      document.getElementById("row-category").addEventListener("click", async () => {
        const picked = await window.nxSheet({
          title: "Your service category",
          options: catOptions,
          selectedValue: selectedCategory,
        });
        if (picked == null) return;
        selectedCategory = picked;
        const cat = window.SERVICES_TAXONOMY[picked];
        document.getElementById("val-category").textContent = cat.label || picked;

        // Default: ALL subcategories selected = offer everything in that category
        const subKeys = Object.keys(cat.subcategories || {});
        selectedSubs = subKeys.slice();
        selectedServiceNames = servicesFromSubs(picked, selectedSubs);
        document.getElementById("row-subs").style.display = "";
        document.getElementById("row-finetune").style.display = "";
        refreshSubsLabel();
        refreshFinetuneLabel();
        document.getElementById("row-subs").click();
      });

      document.getElementById("row-subs").addEventListener("click", async () => {
        if (!selectedCategory) return;
        const cat = window.SERVICES_TAXONOMY[selectedCategory];
        const subOptions = Object.entries(cat.subcategories || {}).map(([k, v]) => ({
          value: k,
          label: v.label || k,
          sub: (v.services || []).slice(0, 3).join(", ") + ((v.services || []).length > 3 ? "…" : ""),
        }));
        const picked = await window.nxMultiSheet({
          title: "What service types do you offer?",
          hint: "All are pre-selected. Uncheck what you don't do.",
          options: subOptions,
          selectedValues: selectedSubs,
          doneLabel: "Save",
        });
        if (picked == null) return;
        selectedSubs = picked;
        // Reset fine-tune to "all services in new sub selection"
        selectedServiceNames = servicesFromSubs(selectedCategory, selectedSubs);
        refreshSubsLabel();
        refreshFinetuneLabel();
      });

      document.getElementById("row-finetune").addEventListener("click", async () => {
        const all = servicesFromSubs(selectedCategory, selectedSubs);
        if (!all.length) return;
        const picked = await window.nxMultiSheet({
          title: "Fine-tune your services",
          hint: "Uncheck any specific service you don't offer.",
          options: all.map(name => ({ value: name, label: name })),
          selectedValues: selectedServiceNames.length ? selectedServiceNames : all,
          doneLabel: "Save",
        });
        if (picked == null) return;
        selectedServiceNames = picked;
        refreshFinetuneLabel();
      });
    }

    const form = document.getElementById("register-form");
    const errEl = document.getElementById("reg-error");
    const btn = document.getElementById("submit-btn");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errEl.style.display = "none";

      if (isProvider && !selectedCategory) {
        errEl.textContent = "Please pick your service category.";
        errEl.style.display = "block";
        return;
      }
      if (isProvider && !selectedServiceNames.length) {
        errEl.textContent = "Pick at least one service you offer.";
        errEl.style.display = "block";
        return;
      }

      btn.disabled = true; btn.textContent = "Creating…";
      try {
        const data = await window.apiRegister({
          full_name: document.getElementById("reg-name").value.trim(),
          email: document.getElementById("reg-email").value.trim(),
          phone: document.getElementById("reg-phone").value.trim() || null,
          password: document.getElementById("reg-password").value,
          role: isProvider ? "provider" : "customer",
        });
        window.persistToken(data.access_token);
        window.persistRole(isProvider ? "provider" : "customer");
        window.persistPendingRole(null);
        const me = await window.apiMe();
        window.persistUser(me);
        window.state.biometricUnlocked = true;

        // For providers: create the provider_profile row
        if (isProvider) {
          btn.textContent = "Setting up profile…";
          // Try to get lat/lng from device to save on the profile so provider matching works
          // Read from the 3-option location picker (GPS / business / home).
          // If GPS selected but user hasn't tapped the button, try a silent grab.
          let loc = await window.nxLocationPicker.getValue("reg-loc");
          if (loc.source === "gps" && loc.lat == null) {
            try {
              const pos = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) return reject(new Error("no geo"));
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: false,
                  timeout: 30000,
                  maximumAge: 5 * 60 * 1000,
                });
              });
              loc.lat = pos.coords.latitude;
              loc.lng = pos.coords.longitude;
            } catch (_) { /* can set later from Profile */ }
          }

          await window.apiFetch("/api/providers/profile", {
            method: "POST",
            body: {
              business_name: document.getElementById("reg-business").value.trim(),
              category: selectedCategory,
              services: selectedServiceNames,        // explicit service-name list
              address: loc.address,
              city: loc.city,
              state: loc.state,
              zip: loc.zip,
              lat: loc.lat,
              lng: loc.lng,
              phone: document.getElementById("reg-phone").value.trim(),
            },
          });
        }

        window.setActiveMode(isProvider ? "provider" : "customer");
        // Refresh user info so has_provider_profile is true after the POST /api/providers/profile call above
        try { const me2 = await window.apiMe(); window.persistUser(me2); } catch (_) {}
        await window.maybeOfferBiometricAfterLogin();
        window.nxPushRegister && window.nxPushRegister();
        window.navigate(isProvider ? "dashboard" : "home");
      } catch (ex) {
        errEl.textContent = ex.message || "Could not create account";
        errEl.style.display = "block";
        btn.disabled = false; btn.textContent = isProvider ? "Start 3 Months Free" : "Create Account";
      }
    });
  },
};
