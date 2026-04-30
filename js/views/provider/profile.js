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

    const labelForCat = (k) => (window.SERVICES_TAXONOMY && window.SERVICES_TAXONOMY[k] && window.SERVICES_TAXONOMY[k].label) || k;
    const primaryLabel = (profile && profile.category) ? labelForCat(profile.category) : "Not set";
    const extraList = (profile && Array.isArray(profile.extra_categories)) ? profile.extra_categories : [];
    const catLabel = extraList.length
      ? `${primaryLabel} + ${extraList.map(labelForCat).join(", ")}`
      : primaryLabel;

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
              <div class="nx-form__label">${extraList.length ? "Categories" : "Category"}</div>
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

            ${(() => {
              const status = (profile && profile.id_verification_status) || "none";
              if (status === "verified") {
                return `<div class="nx-form__row" style="cursor:default; margin-top:14px;">
                  <div class="nx-form__label">ID Verification</div>
                  <div class="nx-form__value"><span style="color:#22c55e;">\u2713 Verified</span></div>
                </div>`;
              }
              if (status === "pending") {
                return `<div class="nx-form__row" style="cursor:default; margin-top:14px;">
                  <div class="nx-form__label">ID Verification</div>
                  <div class="nx-form__value"><span style="color:var(--nx-text-muted);">In review (~24h)</span></div>
                </div>`;
              }
              const isReject = status === "rejected";
              const reason = (profile && profile.id_rejection_reason) || "";
              return `<div style="margin-top:14px; padding:14px 16px; background:${isReject ? "#2a1a1a" : "#1a1a1a"}; border:1px solid ${isReject ? "#ef4444" : "#f0b400"}; border-radius:14px;">
                <div style="font-family:var(--nx-font-sans); font-size:14px; font-weight:600; color:${isReject ? "#ef4444" : "#f0b400"}; margin-bottom:4px;">
                  ${isReject ? "ID verification rejected" : "Get ID verified"}
                </div>
                <div style="font-family:var(--nx-font-sans); font-size:12px; color:var(--nx-text-muted); line-height:1.5; margin-bottom:10px;">
                  ${isReject ? window.esc(reason || "Photos didn't pass review. Try again with a clearer ID and selfie.") : "Required to respond to childcare, senior care, and specialty wellness requests. Optional but recommended for every other category \u2014 verified providers get more bookings. Upload your ID and a selfie. Free during launch (future automated checks paid by provider)."}
                </div>
                <button class="nx-cta" id="bp-verify-id-btn" type="button" style="background:${isReject ? "#ef4444" : "#f0b400"}; color:#000; font-weight:600; padding:10px 16px; min-height:auto; width:auto; display:inline-block;">
                  ${isReject ? "Try again" : "Start verification"}
                </button>
              </div>`;
            })()}

            <div class="nx-form__row" id="row-billing" style="cursor:pointer; margin-top:14px;">
              <div class="nx-form__label">Billing</div>
              <div class="nx-form__value">
                <span>Subscription &amp; plans</span>
                <span class="nx-form__chev">\u203a</span>
              </div>
            </div>

            <div class="nx-form__row" id="row-nickname" style="cursor:pointer;">
              <div class="nx-form__label">
                Nickname
                <div style="font-size:11.5px; color:var(--nx-text-muted); font-weight:400; margin-top:3px; line-height:1.4;">(if you want to hide your real name and last name when responding to customers)</div>
              </div>
              <div class="nx-form__value">
                <span id="val-nickname">${u.nickname ? window.esc(u.nickname) : "Not set"}</span>
                <span class="nx-form__chev">›</span>
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
              <div class="nx-form__row" style="flex-direction:column; align-items:stretch;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
                  <div class="nx-form__label" style="margin:0;">Services you offer</div>
                  <div style="font-size:11px; color:var(--nx-text-muted);">up to 3 categories</div>
                </div>
                <div id="e-cats-list"></div>
                <button type="button" id="e-add-cat-btn" class="nx-cta"
                  style="background:transparent; border:1px dashed var(--nx-border); color:var(--nx-text-muted); margin-top:8px; padding:12px;">
                  + Add another category
                </button>
              </div>
              <div class="nx-form__row">
                <div class="nx-form__label">Phone</div>
                <input class="nx-auth-input" type="tel" id="e-phone" value="${window.esc((profile && profile.phone) || "")}" placeholder="+1 \u2026">
              </div>

              <div class="nx-form__row">
                <div class="nx-form__label">Google Business <span style="color:var(--nx-text-muted); font-weight:400;">(optional)</span></div>
                <input class="nx-auth-input" type="url" id="e-google-url" value="${window.esc((profile && profile.google_business_url) || "")}" placeholder="https://g.page/your-business">
                <div style="font-size:11px; color:var(--nx-text-muted); margin-top:6px;">If set, customers see a "View on Google" link on your profile.</div>
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

          <button class="nx-cta" id="delete-account-btn"
            style="margin-top:12px; background:transparent; border:1px solid #ef4444; color:#ef4444;">
            Delete account
          </button>
          <div style="font-size:11px; color:var(--nx-text-muted); text-align:center; padding:8px 0 4px;">
            Permanently removes your business profile, history and messages. Cancels your subscription. This can't be undone.
          </div>
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

    // ---- ID Verification CTA (when not verified) ----
    const verifyBtn = document.getElementById("bp-verify-id-btn");
    if (verifyBtn) {
      verifyBtn.addEventListener("click", () => window.navigate("verify-id"));
    }

    // ---- Billing ----
    document.getElementById("row-billing").addEventListener("click", () => {
      window.navigate("billing");
    });

    // ---- Change password ----
    document.getElementById("row-change-password").addEventListener("click", () => {
      window.navigate("change-password");
    });

    // ---- Nickname ----
    // Personal display name. The provider's public-facing identity to
    // customers is `business_name`; this nickname is for any flows that
    // surface the personal user name (e.g. messages, future anonymous-
    // response feature). Leave blank to skip.
    document.getElementById("row-nickname").addEventListener("click", async () => {
      const cur = (window.state.currentUser && window.state.currentUser.nickname) || "";
      const next = await window.nxPrompt(
        "Set a personal nickname (separate from your business name).\n\nWhy: a nickname gives you the option to present yourself to customers as either your real name or this nickname — your choice, every time you respond. Leave blank to clear.",
        { okLabel: "Save", placeholder: "Up to 30 characters", type: "text" }
      );
      if (next == null) return;
      const trimmed = (next || "").trim().slice(0, 30);
      if (trimmed === cur) return;
      try {
        const res = await window.apiFetch("/api/auth/nickname", {
          method: "POST",
          body: { nickname: trimmed || null },
        });
        const u2 = await window.apiMe();
        window.persistUser(u2);
        window.Views.ProviderProfile.render();
        window.toast && window.toast(res.nickname ? "Nickname saved" : "Nickname cleared", "success");
      } catch (err) {
        window.nxAlert("Couldn't save: " + (err.message || err));
      }
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

    // ---- Multi-category services picker ----
    // State: array of { key, services: [...] } (order matters — first = primary)
    const catList = [];
    // Seed from existing profile: primary + extra_categories. Split the
    // services array across categories by looking up each service in each
    // category's service names.
    const taxonomy = window.SERVICES_TAXONOMY || {};
    // v1.3.5 — Coming Soon subs (mirror of backend DISABLED_SUBCATEGORIES).
    // The provider profile editor must NOT surface services from these
    // subcategories — providers can't legally accept work in them yet.
    const NX_DISABLED_SUBS = new Set([
      "home_repair/plumbing",
      "home_repair/electrical",
      "home_repair/hvac",
      "home_repair/roofing",
      "automotive/mobile_mechanic",
    ]);
    const servicesForCategory = (catKey) => {
      const cat = taxonomy[catKey];
      if (!cat) return [];
      const out = [];
      Object.entries(cat.subcategories || {}).forEach(([subKey, sub]) => {
        if (NX_DISABLED_SUBS.has(`${catKey}/${subKey}`)) return;
        (sub.services || []).forEach(s => out.push(s));
      });
      return out;
    };
    if (profile) {
      const primary = profile.category;
      const extras = Array.isArray(profile.extra_categories) ? profile.extra_categories : [];
      const allCats = primary ? [primary, ...extras.filter(e => e !== primary)] : extras;
      const existingServices = Array.isArray(profile.services) ? profile.services : [];
      const byCat = new Map();
      allCats.forEach(k => byCat.set(k, []));
      // Services that don't map to any known category are preserved on the
      // primary card so they don't silently vanish when the user saves.
      const unrecognized = [];
      existingServices.forEach(svc => {
        let placed = false;
        for (const k of allCats) {
          if (servicesForCategory(k).includes(svc)) {
            byCat.get(k).push(svc);
            placed = true;
            break;
          }
        }
        if (!placed) unrecognized.push(svc);
      });
      if (unrecognized.length && allCats.length) {
        byCat.get(allCats[0]).push(...unrecognized);
      }
      allCats.forEach(k => catList.push({ key: k, services: byCat.get(k) || [] }));
    }

    const renderCatList = () => {
      const host = document.getElementById("e-cats-list");
      if (!host) return;
      if (!catList.length) {
        host.innerHTML = `
          <div style="padding:14px; border:1px dashed var(--nx-border); border-radius:12px; font-size:13px; color:var(--nx-text-muted); text-align:center;">
            No category picked yet. Tap <strong>Add another category</strong> to start.
          </div>`;
      } else {
        host.innerHTML = catList.map((c, idx) => {
          const cat = taxonomy[c.key] || {};
          const total = servicesForCategory(c.key).length;
          const count = (c.services || []).length;
          const isPrimary = idx === 0;
          return `
            <div class="nx-cat-card" data-cat-idx="${idx}">
              <div class="nx-cat-card__head">
                <div>
                  <div class="nx-cat-card__label">
                    ${window.esc(cat.label || c.key)}
                    ${isPrimary ? '<span class="nx-cat-card__primary">Primary</span>' : ''}
                  </div>
                  <div class="nx-cat-card__sub">${count} of ${total} services \u00b7 tap to edit</div>
                </div>
                <button type="button" class="nx-cat-card__remove" data-remove="${idx}" aria-label="Remove category">\u00d7</button>
              </div>
            </div>`;
        }).join("");
      }

      // Wire: tap card → edit services; tap × → remove
      host.querySelectorAll("[data-cat-idx]").forEach(card => {
        card.addEventListener("click", async (e) => {
          if (e.target.closest("[data-remove]")) return; // X button handles itself
          const idx = Number(card.dataset.catIdx);
          await editCategoryServices(idx);
        });
      });
      host.querySelectorAll("[data-remove]").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const idx = Number(btn.dataset.remove);
          if (catList.length === 1) {
            window.nxAlert("You need at least one category. Pick a replacement before removing this one.");
            return;
          }
          const name = taxonomy[catList[idx].key]?.label || catList[idx].key;
          const ok = await window.nxConfirm(`Remove "${name}" from your services?`, { okLabel: "Remove", danger: true });
          if (!ok) return;
          catList.splice(idx, 1);
          renderCatList();
          updateAddButton();
        });
      });
    };

    const updateAddButton = () => {
      const btn = document.getElementById("e-add-cat-btn");
      if (!btn) return;
      if (catList.length >= 3) {
        btn.style.display = "none";
      } else {
        btn.style.display = "";
        btn.textContent = catList.length === 0 ? "+ Pick your first category" : "+ Add another category";
      }
    };

    const editCategoryServices = async (idx) => {
      const entry = catList[idx];
      if (!entry) return;
      const all = servicesForCategory(entry.key);
      if (!all.length) {
        window.nxAlert("This category has no services defined yet. Remove it and pick another.");
        return;
      }
      // Merge taxonomy services with any unrecognized legacy services
      // pinned to this card so the user can see and uncheck them too.
      const known = new Set(all);
      const extras = (entry.services || []).filter(s => !known.has(s));
      const options = all.map(s => ({ value: s, label: s }))
        .concat(extras.map(s => ({ value: s, label: s + " (legacy)" })));
      const picked = await window.nxMultiSheet({
        title: taxonomy[entry.key]?.label || entry.key,
        hint: "Tap the services you offer. Uncheck any you don't.",
        options,
        selectedValues: entry.services && entry.services.length ? entry.services : all,
        doneLabel: "Save",
      });
      if (picked == null) return;
      entry.services = picked;
      renderCatList();
    };

    const addCategoryFlow = async () => {
      if (catList.length >= 3) return;
      const chosen = catList.map(c => c.key);
      const options = Object.keys(taxonomy)
        .filter(k => !chosen.includes(k))
        .map(k => ({ value: k, label: taxonomy[k].label || k }));
      if (!options.length) return;
      const picked = await window.nxSheet({
        title: catList.length === 0 ? "Pick your main category" : "Add a category",
        options,
      });
      if (picked == null) return;
      // Default: all services in that category selected
      const allSvcs = servicesForCategory(picked);
      catList.push({ key: picked, services: allSvcs });
      renderCatList();
      updateAddButton();
      // Immediately let them refine
      await editCategoryServices(catList.length - 1);
    };

    document.getElementById("e-add-cat-btn").addEventListener("click", addCategoryFlow);
    renderCatList();
    updateAddButton();

    // ---- Save edits ----
    document.getElementById("edit-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = document.getElementById("edit-err");
      const btn = document.getElementById("save-btn");
      err.style.display = "none";

      if (!catList.length) {
        err.textContent = "Pick at least one service category."; err.style.display = "block"; return;
      }
      const primaryCategory = catList[0].key;
      const extraCategories = catList.slice(1).map(c => c.key);
      // Flatten services across all selected categories
      const mergedServices = [];
      const seen = new Set();
      catList.forEach(c => (c.services || []).forEach(s => {
        if (!seen.has(s)) { mergedServices.push(s); seen.add(s); }
      }));
      if (!mergedServices.length) {
        err.textContent = "Pick at least one service you offer."; err.style.display = "block"; return;
      }

      // Read from the 3-option location picker; falls back to existing
      // profile values when the user didn't touch it so we never wipe
      // location just by saving an unrelated field.
      const loc = window.nxLocationPicker
        ? await window.nxLocationPicker.getValue("edit-loc")
        : { source: "gps", lat: null, lng: null, address: null, city: null, state: null, zip: null };
      const preserve = loc.lat == null && loc.lng == null && !loc.address && !loc.city && !loc.state && !loc.zip;

      const body = {
        business_name: document.getElementById("e-business").value.trim(),
        category: primaryCategory,
        extra_categories: extraCategories,
        address: preserve ? (profile && profile.address) : loc.address,
        city:    preserve ? (profile && profile.city)    : loc.city,
        state:   preserve ? (profile && profile.state)   : loc.state,
        zip:     preserve ? (profile && profile.zip)     : loc.zip,
        lat:     preserve ? (profile && profile.lat)     : loc.lat,
        lng:     preserve ? (profile && profile.lng)     : loc.lng,
        phone: document.getElementById("e-phone").value.trim() || null,
        services: mergedServices,
        google_business_url: (document.getElementById("e-google-url").value.trim() || null),
      };
      if (!body.business_name) {
        err.textContent = "Business name is required."; err.style.display = "block"; return;
      }
      btn.disabled = true; btn.textContent = "Saving\u2026";
      try {
        await window.apiFetch("/api/providers/profile", { method: "POST", body });
        window.toast && window.toast("Profile updated.", "success");
        // Re-render to reflect saved state. Await + re-enable the button in
        // finally so the user is never stuck with a dead Save button if the
        // re-render itself throws.
        try { await window.Views.ProviderProfile.render(); }
        catch (re) { console.error("profile re-render after save failed:", re); }
      } catch (ex) {
        err.textContent = ex.message || "Couldn't save.";
        err.style.display = "block";
      } finally {
        btn.disabled = false; btn.textContent = "Save changes";
      }
    });

    document.getElementById("sign-out-btn").addEventListener("click", async () => {
      if (!(await window.nxConfirm("Sign out of NextUp?", { okLabel: "Sign out", danger: true }))) return;
      window.clearSession();
      window.navigate("role-select");
    });

    document.getElementById("delete-account-btn").addEventListener("click", async () => {
      await window.nxDeleteAccountFlow();
    });

    window.bindProviderTabBar();
  },
};
