/* =============================================================
   NextUp — Customer Broadcast (Category detail form)
   Matches official mockup: back chevron → centered Zodiak title →
   stacked form rows (What service? / When? / Preferred gender) →
   Notes textarea → dark bordered "Broadcast Request" CTA.
   ============================================================= */

/** Pull label for a backend-category key from the taxonomy (e.g. "beauty" → "Beauty & Personal Care"). */
function nxCategoryLabel(catKey) {
  const tax = window.SERVICES_TAXONOMY || {};
  return (tax[catKey] && tax[catKey].label) || catKey;
}

/** Flatten all services in a category into a single array. */
function nxServicesForCategory(catKey) {
  const tax = window.SERVICES_TAXONOMY || {};
  const cat = tax[catKey];
  if (!cat || !cat.subcategories) return ["General Service"];
  const list = [];
  Object.entries(cat.subcategories).forEach(([subKey, sub]) => {
    (sub.services || []).forEach(s => list.push(s));
  });
  return list.length ? list : ["General Service"];
}

/** Services where the anonymous-broadcast toggle defaults to ON.
 *  These are services where customer privacy is typically expected
 *  by default. The toggle is still always editable — this just
 *  changes the default state. No taxonomy flag, no special routing. */
const NX_ANON_DEFAULT_SERVICES = new Set([
  "Personal Companion",
  "Couples Bodywork",
]);
function nxServiceDefaultsAnon(serviceLabel) {
  return NX_ANON_DEFAULT_SERVICES.has(serviceLabel);
}

/** Reverse lookup: given a service label + category, return the subcategory key.
 *  Used at broadcast time to tell the backend which subset of providers to match. */
function nxSubcategoryForService(catKey, serviceLabel) {
  const cat = (window.SERVICES_TAXONOMY || {})[catKey];
  if (!cat || !cat.subcategories) return null;
  for (const [subKey, sub] of Object.entries(cat.subcategories)) {
    if ((sub.services || []).includes(serviceLabel)) return subKey;
  }
  return null;
}

/** Backend Timeframe enum: within_1h | within_2h | today | tomorrow.
    We give customers finer-grained options in the UI and map them to the
    nearest backend bucket. A picked date/time also uses the buckets. */
const TIMING_PRESETS = [
  { value: "asap",      label: "As soon as possible", tf: "within_1h" },
  { value: "in_15m",    label: "In 15 minutes",       tf: "within_1h" },
  { value: "in_30m",    label: "In 30 minutes",       tf: "within_1h" },
  { value: "in_1h",     label: "In 1 hour",           tf: "within_1h" },
  { value: "in_2h",     label: "In 2 hours",          tf: "within_2h" },
  { value: "later_today", label: "Later today",       tf: "today" },
  { value: "tomorrow",  label: "Tomorrow",            tf: "tomorrow" },
  { value: "pick_date", label: "Pick a date & time…", tf: null },
];

const GENDERS = [
  { value: "any",    label: "No preference" },
  { value: "female", label: "Female" },
  { value: "male",   label: "Male" },
];

let FORM_STATE = {};

window.Views.CustomerBroadcast = {
  async render(params) {
    const catKey = (params && params[0]) || "beauty";
    const targetProviderId = (params && params[1]) ? parseInt(params[1], 10) : null;
    const catLabel = nxCategoryLabel(catKey);
    let services = nxServicesForCategory(catKey);

    FORM_STATE = {
      catKey,
      service: services[0],
      timeframeKey: "within_1h",
      timeLabel: "As soon as possible",
      scheduledAt: null,  // Date, if user picked a specific future date/time
      radius: 5,
      genderKey: "any",
      genderLabel: "No preference",
      notes: "",
      targetProviderId,
      targetProviderName: null,     // resolved below if targetProviderId is set
      // Anonymous toggle defaults ON for a small set of privacy-sensitive
      // services (see NX_ANON_DEFAULT_SERVICES); OFF for everything else.
      // Always editable on the form — this just sets the initial state.
      isAnonymous: nxServiceDefaultsAnon(services[0]),
      // Optional pseudonym shown to providers in place of "Customer #<id>"
      // when isAnonymous is true. Pre-fills from the user's profile-level
      // nickname (window.state.currentUser.nickname) so the customer
      // doesn't have to retype it for every broadcast. Empty = use the
      // numeric fallback "Customer #<id>".
      anonDisplayName: (window.state.currentUser && window.state.currentUser.nickname) || "",
    };

    // When a specific provider was picked, fetch their profile so we can:
    //   (1) show their name in a banner at the top of the form
    //   (2) restrict the service picker to what that provider actually offers
    if (targetProviderId) {
      try {
        const p = await window.apiFetch(`/api/providers/${targetProviderId}/profile`);
        FORM_STATE.targetProviderName = p.business_name || p.full_name || "this provider";
        const offered = Array.isArray(p.services) ? p.services : [];
        if (offered.length) {
          services = offered;
          FORM_STATE.service = offered[0];
        }
      } catch (_) {
        // If the fetch fails, fall back to showing the full category list (the
        // backend will still route the request correctly via target_provider_id).
      }
    }

    this._mount(catLabel, services);
  },

  _mount(catLabel, services) {
    const isTargeted = !!FORM_STATE.targetProviderId;
    const targetBanner = isTargeted ? `
      <div class="nx-target-banner">
        <div class="nx-target-banner__label">Requesting from</div>
        <div class="nx-target-banner__name">${window.esc(FORM_STATE.targetProviderName || "Selected provider")}</div>
        <div class="nx-target-banner__hint">Only they will receive this request. You can cancel and broadcast instead at any time.</div>
      </div>
    ` : "";
    const hideGender = isTargeted;  // no point in preference when they're picked already
    const ctaLabel = isTargeted ? "Send Request" : "Broadcast Request";

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">${window.esc(isTargeted ? "New request" : catLabel)}</span>
            <div></div>
          </header>

          ${targetBanner}

          <div class="nx-form">
            <div class="nx-form__row" id="row-anon" style="cursor:pointer;">
              <div class="nx-form__label">Hide my name from providers</div>
              <div class="nx-form__value">
                <span id="val-anon">${FORM_STATE.isAnonymous ? "On" : "Off — providers see your name"}</span>
                <span class="nx-form__chev" style="color:${FORM_STATE.isAnonymous ? "#22c55e" : ""}">${FORM_STATE.isAnonymous ? "●" : "○"}</span>
              </div>
            </div>
            <div class="nx-form__row" id="row-anon-name" style="display:${FORM_STATE.isAnonymous ? "flex" : "none"}; flex-direction:column; align-items:stretch;">
              <div class="nx-form__label" style="margin-bottom:6px;">Display as <span style="color:var(--nx-text-muted); font-weight:400;">(optional)</span></div>
              <input class="nx-auth-input" type="text" id="bc-anon-name" maxlength="30"
                placeholder="${window.esc("e.g. Alex, S.K., Houston Customer")}"
                value="${window.esc(FORM_STATE.anonDisplayName || "")}"
                autocapitalize="words" autocorrect="off" spellcheck="false">
              <div style="font-size:11px; color:var(--nx-text-muted); margin-top:6px;">
                Leave blank and providers see <em>Customer #${(window.state.currentUser && window.state.currentUser.id) || "?"}</em>.
              </div>
            </div>

            <div class="nx-form__row" id="row-service">
              <div class="nx-form__label">What service?</div>
              <div class="nx-form__value">
                <span id="val-service">${window.esc(FORM_STATE.service)}</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>

            <div class="nx-form__row" id="row-time">
              <div class="nx-form__label">When?</div>
              <div class="nx-form__value">
                <span id="val-time">${window.esc(FORM_STATE.timeLabel)}</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>

            ${hideGender ? "" : `
            <div class="nx-form__row" id="row-gender">
              <div class="nx-form__label">Preferred gender</div>
              <div class="nx-form__value">
                <span id="val-gender">${window.esc(FORM_STATE.genderLabel)}</span>
                <span class="nx-form__chev">›</span>
              </div>
            </div>
            `}

            <div class="nx-notes">
              <div class="nx-notes__label">Notes</div>
              <textarea class="nx-notes__input" id="bc-notes" placeholder="Any special requests…"></textarea>
            </div>

            <button class="nx-cta" id="broadcast-btn" type="button">${ctaLabel}</button>
          </div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.history.length > 1 ? window.history.back() : window.navigate("home"));

    // Anonymous toggle row — defaults set per-service, always editable.
    // Tapping the toggle also reveals/hides the optional pseudonym row.
    document.getElementById("row-anon").addEventListener("click", () => {
      FORM_STATE.isAnonymous = !FORM_STATE.isAnonymous;
      const val = document.getElementById("val-anon");
      const chev = document.querySelector("#row-anon .nx-form__chev");
      val.textContent = FORM_STATE.isAnonymous
        ? "On"
        : "Off — providers see your name";
      chev.textContent = FORM_STATE.isAnonymous ? "●" : "○";
      chev.style.color = FORM_STATE.isAnonymous ? "#22c55e" : "";
      const anonName = document.getElementById("row-anon-name");
      if (anonName) anonName.style.display = FORM_STATE.isAnonymous ? "flex" : "none";
    });

    // Track the chosen pseudonym
    const anonNameInput = document.getElementById("bc-anon-name");
    if (anonNameInput) {
      anonNameInput.addEventListener("input", (e) => {
        FORM_STATE.anonDisplayName = e.target.value;
      });
    }

    // Service picker — in-app bottom sheet
    document.getElementById("row-service").addEventListener("click", async () => {
      const picked = await window.nxSheet({
        title: "What service?",
        options: services,
        selectedValue: FORM_STATE.service,
      });
      if (picked == null) return;
      FORM_STATE.service = picked;
      document.getElementById("val-service").textContent = picked;
      // Re-default the anonymous toggle based on the new service. If
      // the picked service is in NX_ANON_DEFAULT_SERVICES we flip the
      // toggle ON for them; otherwise OFF. The user can still override.
      const newDefault = nxServiceDefaultsAnon(picked);
      if (newDefault !== FORM_STATE.isAnonymous) {
        FORM_STATE.isAnonymous = newDefault;
        const valAnon = document.getElementById("val-anon");
        const chevAnon = document.querySelector("#row-anon .nx-form__chev");
        if (valAnon && chevAnon) {
          valAnon.textContent = FORM_STATE.isAnonymous
            ? "On"
            : "Off — providers see your name";
          chevAnon.textContent = FORM_STATE.isAnonymous ? "●" : "○";
          chevAnon.style.color = FORM_STATE.isAnonymous ? "#22c55e" : "";
        }
        const anonName = document.getElementById("row-anon-name");
        if (anonName) anonName.style.display = FORM_STATE.isAnonymous ? "flex" : "none";
      }
    });

    // Time picker — bottom sheet with fine-grained presets + "pick date/time" option
    document.getElementById("row-time").addEventListener("click", async () => {
      const picked = await window.nxSheet({
        title: "When do you need it?",
        options: TIMING_PRESETS,
        selectedValue: FORM_STATE.timeValue || "asap",
      });
      if (picked == null) return;

      if (picked === "pick_date") {
        const d = await window.nxDateTimeSheet({
          title: "Pick date & time",
          applyLabel: "Confirm",
          minDate: new Date(),
          initial: FORM_STATE.scheduledAt || new Date(Date.now() + 60 * 60 * 1000),
        });
        if (!d) return;
        FORM_STATE.scheduledAt = d;
        FORM_STATE.timeValue = "pick_date";
        FORM_STATE.timeframeKey = this._bucketForDate(d);
        FORM_STATE.timeLabel = this._formatScheduled(d);
      } else {
        const preset = TIMING_PRESETS.find(p => p.value === picked);
        FORM_STATE.timeValue = preset.value;
        FORM_STATE.timeframeKey = preset.tf;
        FORM_STATE.timeLabel = preset.label;
        FORM_STATE.scheduledAt = null;
      }
      document.getElementById("val-time").textContent = FORM_STATE.timeLabel;
    });

    // Gender picker — bottom sheet (only present on non-targeted requests)
    const rowGender = document.getElementById("row-gender");
    if (rowGender) {
      rowGender.addEventListener("click", async () => {
        const picked = await window.nxSheet({
          title: "Preferred gender",
          options: GENDERS,
          selectedValue: FORM_STATE.genderKey,
        });
        if (picked == null) return;
        const g = GENDERS.find(x => x.value === picked);
        FORM_STATE.genderKey = g.value;
        FORM_STATE.genderLabel = g.label;
        document.getElementById("val-gender").textContent = g.label;
      });
    }

    document.getElementById("bc-notes").addEventListener("input", (e) => { FORM_STATE.notes = e.target.value; });

    document.getElementById("broadcast-btn").addEventListener("click", () => this._submit());
  },

  /** Map a future Date to the nearest backend timeframe bucket. */
  _bucketForDate(d) {
    const hoursAhead = (d.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursAhead <= 1) return "within_1h";
    if (hoursAhead <= 2) return "within_2h";
    const sameDay = d.toDateString() === new Date().toDateString();
    if (sameDay) return "today";
    return "tomorrow";
  },

  /** Human-friendly label for a picked date/time. */
  _formatScheduled(d) {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const sameDay = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const hh = d.getHours();
    const mm = d.getMinutes();
    const ampm = hh >= 12 ? "PM" : "AM";
    const hh12 = hh % 12 === 0 ? 12 : hh % 12;
    const time = `${hh12}:${mm < 10 ? "0" + mm : mm} ${ampm}`;
    if (sameDay)    return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
  },

  async _submit() {
    const btn = document.getElementById("broadcast-btn");
    btn.disabled = true;
    btn.textContent = "Getting your location…";

    try {
      // Get location — mandatory (providers matched by distance)
      let coords;
      try {
        coords = await this._getLocation();
      } catch (geoErr) {
        await window.nxAlert(
          "Location required\n\n" +
          "NextUp needs your location to find nearby service providers. " +
          "Please enable Location access for NextUp in iPhone Settings \u2192 Privacy & Security \u2192 Location Services, then try again.\n\n" +
          "Details: " + (geoErr.message || geoErr)
        );
        btn.disabled = false;
        btn.textContent = FORM_STATE.targetProviderId ? "Send Request" : "Broadcast Request";
        return;
      }

      btn.textContent = FORM_STATE.targetProviderId ? "Sending…" : "Broadcasting…";
      const body = {
        category: FORM_STATE.catKey,
        subcategory: nxSubcategoryForService(FORM_STATE.catKey, FORM_STATE.service),
        service_name: FORM_STATE.service,          // exact service label for provider matching
        service_description: `${FORM_STATE.service} — ${nxCategoryLabel(FORM_STATE.catKey)}`.trim(),
        timeframe: FORM_STATE.timeframeKey,
        preferred_gender: FORM_STATE.genderKey === "any" ? null : FORM_STATE.genderKey,
        notes: FORM_STATE.notes || null,
        lat: coords.lat,
        lng: coords.lng,
        target_provider_id: FORM_STATE.targetProviderId || null,
        is_anonymous: !!FORM_STATE.isAnonymous,
        anon_display_name: (FORM_STATE.isAnonymous && FORM_STATE.anonDisplayName)
          ? FORM_STATE.anonDisplayName.trim().slice(0, 30)
          : null,
      };

      const res = await window.apiFetch("/api/requests", { method: "POST", body });
      if (res && res.id) {
        window.navigate(`responses/${res.id}`);
      } else {
        throw new Error("No request id returned");
      }
    } catch (e) {
      window.nxAlert("Could not " + (FORM_STATE.targetProviderId ? "send request" : "broadcast") + ": " + (e.message || e));
      btn.disabled = false;
      btn.textContent = FORM_STATE.targetProviderId ? "Send Request" : "Broadcast Request";
    }
  },

  async _getLocation() {
    // 1. Prefer Capacitor Geolocation plugin on native (iOS/Android) — more reliable
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      const Geo = window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation;
      if (Geo) {
        try {
          // Request permission explicitly (iOS shows dialog once)
          const perm = await Geo.requestPermissions({ permissions: ["location"] });
          if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
            throw new Error("Location permission denied. Please allow location access to find nearby providers.");
          }
        } catch (permErr) {
          // Some versions use different permission API — try anyway
        }
        const pos = await Geo.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    }
    // 2. Fallback: browser Web Geolocation API
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not available on this device.");
    }
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 30000,
      });
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  },
};
