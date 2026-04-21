/* =============================================================
   NextUp — "Become a provider" upgrade flow
   Existing customer attaches a provider_profile to their account
   without creating a new login.
   Route: #become-provider
   ============================================================= */

window.Views.BecomeProvider = {
  async render() {
    const u = window.state.currentUser || {};
    const catKeys = Object.keys(window.SERVICES_TAXONOMY || {});
    const catOptions = catKeys.map(k => ({ value: k, label: window.SERVICES_TAXONOMY[k].label || k }));

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Become a Provider</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:12px 0 24px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:26px; color:var(--nx-text); margin-bottom:6px;">Offer your service.</div>
            <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted);">Same login — flip to provider mode anytime. First month free.</div>
          </div>

          <form id="bp-form" class="nx-form">
            <div class="nx-form__row">
              <div class="nx-form__label">Business name</div>
              <input class="nx-auth-input" type="text" id="bp-business" required placeholder="e.g. Studio Noir">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">Phone</div>
              <input class="nx-auth-input" type="tel" id="bp-phone" required inputmode="tel" placeholder="+1 …" value="${window.esc(u.phone || "")}">
            </div>
            <div class="nx-form__row" id="bp-row-category" style="cursor:pointer;">
              <div class="nx-form__label">Service category</div>
              <div class="nx-form__value">
                <span id="bp-val-category">Select a category…</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>
            <div class="nx-form__row" id="bp-row-subs" style="cursor:pointer; display:none;">
              <div class="nx-form__label">What you offer</div>
              <div class="nx-form__value">
                <span id="bp-val-subs">Pick a category first</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>
            <div class="nx-form__row" id="bp-row-finetune" style="cursor:pointer; display:none;">
              <div class="nx-form__label">Fine-tune specific services <span style="color:var(--nx-text-muted); font-weight:400;">(optional)</span></div>
              <div class="nx-form__value">
                <span id="bp-val-finetune">All services included</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">City</div>
              <input class="nx-auth-input" type="text" id="bp-city" required placeholder="Houston">
            </div>
            <div id="bp-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>
            <button type="submit" class="nx-cta" id="bp-submit">Start Free Month</button>
          </form>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.history.back());

    let selectedCategory = null;
    let selectedSubs = [];
    let selectedServiceNames = [];

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
      const el = document.getElementById("bp-val-subs");
      if (!el) return;
      if (!selectedCategory) { el.textContent = "Pick a category first"; return; }
      const total = Object.keys((window.SERVICES_TAXONOMY[selectedCategory] || {}).subcategories || {}).length;
      if (!selectedSubs.length) el.textContent = "Pick services";
      else if (selectedSubs.length === total) el.textContent = "All service types";
      else el.textContent = `${selectedSubs.length} of ${total} selected`;
    };

    const refreshFinetuneLabel = () => {
      const el = document.getElementById("bp-val-finetune");
      if (!el) return;
      const all = servicesFromSubs(selectedCategory, selectedSubs);
      if (!all.length) { el.textContent = "—"; return; }
      if (selectedServiceNames.length === all.length) el.textContent = `All ${all.length} services included`;
      else el.textContent = `${selectedServiceNames.length} of ${all.length} services`;
    };

    document.getElementById("bp-row-category").addEventListener("click", async () => {
      const picked = await window.nxSheet({
        title: "Your service category",
        options: catOptions,
        selectedValue: selectedCategory,
      });
      if (picked == null) return;
      selectedCategory = picked;
      const cat = window.SERVICES_TAXONOMY[picked];
      document.getElementById("bp-val-category").textContent = cat.label || picked;
      const subKeys = Object.keys(cat.subcategories || {});
      selectedSubs = subKeys.slice();
      selectedServiceNames = servicesFromSubs(picked, selectedSubs);
      document.getElementById("bp-row-subs").style.display = "";
      document.getElementById("bp-row-finetune").style.display = "";
      refreshSubsLabel();
      refreshFinetuneLabel();
      document.getElementById("bp-row-subs").click();
    });

    document.getElementById("bp-row-subs").addEventListener("click", async () => {
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
      selectedServiceNames = servicesFromSubs(selectedCategory, selectedSubs);
      refreshSubsLabel();
      refreshFinetuneLabel();
    });

    document.getElementById("bp-row-finetune").addEventListener("click", async () => {
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

    const form = document.getElementById("bp-form");
    const errEl = document.getElementById("bp-err");
    const btn = document.getElementById("bp-submit");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errEl.style.display = "none";
      if (!selectedCategory) {
        errEl.textContent = "Please pick your service category.";
        errEl.style.display = "block";
        return;
      }
      if (!selectedServiceNames.length) {
        errEl.textContent = "Pick at least one service you offer.";
        errEl.style.display = "block";
        return;
      }
      btn.disabled = true; btn.textContent = "Creating profile…";
      try {
        // Location for provider matching (best-effort)
        let lat = null, lng = null;
        try {
          const pos = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("no geo"));
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          lat = pos.coords.latitude; lng = pos.coords.longitude;
        } catch (_) {}

        await window.apiFetch("/api/providers/profile", {
          method: "POST",
          body: {
            business_name: document.getElementById("bp-business").value.trim(),
            category: selectedCategory,
            services: selectedServiceNames,
            city: document.getElementById("bp-city").value.trim(),
            phone: document.getElementById("bp-phone").value.trim(),
            lat, lng,
          },
        });

        // Refresh user info so has_provider_profile = true
        const me = await window.apiMe();
        window.persistUser(me);

        // Switch the UI into provider mode right away
        window.setActiveMode("provider");
        alert("You're a provider now. Tap Go Online on the Dashboard to start receiving requests.");
        window.navigate("dashboard");
      } catch (ex) {
        errEl.textContent = ex.message || "Could not create provider profile";
        errEl.style.display = "block";
        btn.disabled = false; btn.textContent = "Start Free Month";
      }
    });
  },
};
