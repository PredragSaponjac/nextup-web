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

/** Flatten all services in a category into a single array. Each entry carries
 *  the subcategory key so we can filter providers accordingly at broadcast time. */
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

    // Default anonymous ON for adult_wellness, OFF for everything else.
    const tax = window.SERVICES_TAXONOMY || {};
    const isAdult = !!(tax[catKey] && tax[catKey].is_adult);
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
      isAdult,
      isAnonymous: isAdult,         // adult: anon by default, others: off
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

          ${FORM_STATE.isAdult && !localStorage.getItem("nx_seen_adult_anon_card") ? `
            <div id="adult-info-card" style="margin:12px 0; padding:14px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px; color:#fafaf9; font-size:13px; line-height:1.5;">
              <div style="font-weight:600; margin-bottom:6px;">🔒 Anonymous by default</div>
              <div style="color:var(--nx-text-muted);">Adult Wellness requests hide your name from providers. Your name stays private throughout the booking. You can change this on the form below.</div>
              <button type="button" id="dismiss-adult-card" style="margin-top:10px; background:transparent; border:0; color:#22c55e; font-size:13px; padding:0; cursor:pointer;">Got it</button>
            </div>
          ` : ""}

          <div class="nx-form">
            <div class="nx-form__row" id="row-anon" style="cursor:pointer;">
              <div class="nx-form__label">Hide my name from providers</div>
              <div class="nx-form__value">
                <span id="val-anon">${FORM_STATE.isAnonymous ? "On — providers see ‘Customer #" + ((window.state.currentUser && window.state.currentUser.id) || "?") + "’" : "Off — providers see your name"}</span>
                <span class="nx-form__chev" style="color:${FORM_STATE.isAnonymous ? "#22c55e" : ""}">${FORM_STATE.isAnonymous ? "●" : "○"}</span>
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

    // Adult anon info card — dismiss + remember (one-time per device)
    const dismissCard = document.getElementById("dismiss-adult-card");
    if (dismissCard) {
      dismissCard.addEventListener("click", () => {
        try { localStorage.setItem("nx_seen_adult_anon_card", "1"); } catch (_) {}
        const card = document.getElementById("adult-info-card");
        if (card) card.style.display = "none";
      });
    }

    // Anonymous toggle row — pre-set per category, always editable
    document.getElementById("row-anon").addEventListener("click", () => {
      FORM_STATE.isAnonymous = !FORM_STATE.isAnonymous;
      const val = document.getElementById("val-anon");
      const chev = document.querySelector("#row-anon .nx-form__chev");
      const uid = (window.state.currentUser && window.state.currentUser.id) || "?";
      val.textContent = FORM_STATE.isAnonymous
        ? `On — providers see ‘Customer #${uid}’`
        : "Off — providers see your name";
      chev.textContent = FORM_STATE.isAnonymous ? "●" : "○";
      chev.style.color = FORM_STATE.isAnonymous ? "#22c55e" : "";
    });

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
