/* =============================================================
   NextUp — Location Picker
   Reusable 3-option picker (current GPS / business / home) used
   in provider registration AND provider profile edit. Returns:

     {
       source: "gps" | "business" | "home",
       lat: number | null,
       lng: number | null,
       city: string | null,
       state: string | null,
       zip: string | null,
       address: string | null,    // street line for business/home
     }

   Geocoding: for business/home, we hit Nominatim (free, no API key)
   to resolve the typed address into lat/lng. This is the same
   service we use elsewhere, so no extra dependency. If the user
   skips geocoding, we still accept manual city/state so matching
   has *something* to work with — the server also runs Smart-Radius
   on lat/lng so providers who skip geocoding simply won't be
   matched until they add location from Profile later.

   Usage:
     const html = window.nxLocationPicker.render("reg-loc", {
       initial: profile,   // optional — pre-selects based on prior value
     });
     // insert html into a form row, then:
     window.nxLocationPicker.bind("reg-loc");
     // ...on submit:
     const loc = await window.nxLocationPicker.getValue("reg-loc");
   ============================================================= */

(function () {
  const US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID",
    "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO",
    "MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA",
    "RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  ];

  const SOURCES = [
    { key: "gps",      icon: "📍", title: "My current location",  sub: "Auto-detect from phone / browser" },
    { key: "business", icon: "🏢", title: "A business address",   sub: "I have a shop or office" },
    { key: "home",     icon: "🏠", title: "My home address",      sub: "I travel to customers from home" },
  ];

  function stateOptions(selected) {
    return US_STATES.map(s => `<option value="${s}" ${selected === s ? "selected" : ""}>${s}</option>`).join("");
  }

  function guessInitialSource(initial) {
    if (!initial) return "gps";
    // If profile has an address line, default to business; else GPS.
    if (initial.address && initial.address.trim()) return "business";
    return "gps";
  }

  window.nxLocationPicker = {
    /** Build the HTML for a location picker. `prefix` must be a unique
     *  string (e.g. "reg-loc" or "edit-loc") so IDs don't collide. */
    render(prefix, opts) {
      const initial = (opts && opts.initial) || {};
      const activeSource = guessInitialSource(initial);
      return `
        <div class="nx-loc-picker" data-prefix="${prefix}" style="display:flex; flex-direction:column; gap:10px;">
          <div class="nx-form__label" style="margin-bottom:0;">Where do you work from?</div>

          ${SOURCES.map(s => `
            <label class="nx-loc-opt" data-source="${s.key}" for="${prefix}-src-${s.key}"
                   style="display:flex; gap:12px; align-items:flex-start; padding:12px 14px; border:1px solid var(--nx-border); border-radius:12px; cursor:pointer; background:${activeSource === s.key ? "rgba(240,180,0,0.06)" : "transparent"};">
              <input type="radio" name="${prefix}-src" id="${prefix}-src-${s.key}" value="${s.key}" ${activeSource === s.key ? "checked" : ""} style="margin-top:2px;">
              <div style="flex:1;">
                <div style="font-weight:600;">${s.icon} ${s.title}</div>
                <div style="font-size:12px; color:var(--nx-text-muted); margin-top:2px;">${s.sub}</div>
              </div>
            </label>
          `).join("")}

          <!-- GPS panel -->
          <div data-panel="gps" style="display:${activeSource === "gps" ? "block" : "none"}; padding:12px 14px; border:1px dashed var(--nx-border); border-radius:10px;">
            <button type="button" id="${prefix}-gps-btn" class="nx-bookbtn" style="width:100%;">Use my current location</button>
            <div id="${prefix}-gps-status" style="margin-top:8px; font-size:12px; color:var(--nx-text-muted);">${initial.lat && !initial.address ? "✓ Location already set — tap to refresh" : "We'll capture your phone's current coordinates."}</div>
          </div>

          <!-- Address panel (reused for business + home) -->
          <div data-panel="address" style="display:${activeSource !== "gps" ? "block" : "none"}; display:flex; flex-direction:column; gap:8px; padding:12px 14px; border:1px dashed var(--nx-border); border-radius:10px;">
            <input id="${prefix}-address" class="nx-auth-input" type="text" placeholder="Street address" value="${window.esc(initial.address || "")}">
            <input id="${prefix}-city" class="nx-auth-input" type="text" placeholder="City" value="${window.esc(initial.city || "")}">
            <select id="${prefix}-state" class="nx-auth-input">
              <option value="">State…</option>
              ${stateOptions(initial.state || "")}
            </select>
            <input id="${prefix}-zip" class="nx-auth-input" type="text" inputmode="numeric" maxlength="10" placeholder="ZIP (optional)" value="${window.esc(initial.zip || "")}">
            <div id="${prefix}-addr-status" style="font-size:12px; color:var(--nx-text-muted);">We'll look this up on a map to match you to nearby customers.</div>
          </div>
        </div>
      `;
    },

    /** Wire event listeners. Call after the picker HTML is in the DOM. */
    bind(prefix) {
      const root = document.querySelector(`.nx-loc-picker[data-prefix="${prefix}"]`);
      if (!root) return;
      const opts = root.querySelectorAll(".nx-loc-opt");
      const gpsPanel = root.querySelector('[data-panel="gps"]');
      const addrPanel = root.querySelector('[data-panel="address"]');
      const gpsBtn = document.getElementById(`${prefix}-gps-btn`);
      const gpsStatus = document.getElementById(`${prefix}-gps-status`);

      const updateVisibility = (src) => {
        opts.forEach(o => {
          o.style.background = o.dataset.source === src ? "rgba(240,180,0,0.06)" : "transparent";
        });
        if (src === "gps") {
          gpsPanel.style.display = "block";
          addrPanel.style.display = "none";
        } else {
          gpsPanel.style.display = "none";
          addrPanel.style.display = "flex";
        }
      };

      opts.forEach(opt => {
        opt.addEventListener("click", () => {
          const radio = opt.querySelector("input[type=radio]");
          if (radio) radio.checked = true;
          updateVisibility(opt.dataset.source);
        });
      });

      if (gpsBtn) {
        gpsBtn.addEventListener("click", async () => {
          gpsBtn.disabled = true;
          gpsStatus.textContent = "Getting location…";
          gpsStatus.style.color = "var(--nx-text-muted)";
          try {
            const pos = await new Promise((resolve, reject) => {
              if (!navigator.geolocation) return reject(new Error("Browser can't access location"));
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 25000,
                maximumAge: 2 * 60 * 1000,
              });
            });
            root._lat = pos.coords.latitude;
            root._lng = pos.coords.longitude;
            gpsStatus.textContent = `✓ Location captured (${root._lat.toFixed(4)}, ${root._lng.toFixed(4)})`;
            gpsStatus.style.color = "#22c55e";
          } catch (e) {
            gpsStatus.textContent = "Couldn't get location. Tap again, or pick a different option.";
            gpsStatus.style.color = "#ef4444";
          }
          gpsBtn.disabled = false;
        });
      }
    },

    /** Read the picker state and (if address mode) geocode via Nominatim.
     *  Resolves to {source, lat, lng, address, city, state, zip}. */
    async getValue(prefix) {
      const root = document.querySelector(`.nx-loc-picker[data-prefix="${prefix}"]`);
      if (!root) return { source: "gps", lat: null, lng: null, address: null, city: null, state: null, zip: null };

      const checked = root.querySelector(`input[name="${prefix}-src"]:checked`);
      const source = checked ? checked.value : "gps";

      if (source === "gps") {
        return {
          source: "gps",
          lat: root._lat ?? null,
          lng: root._lng ?? null,
          address: null,
          city: null,
          state: null,
          zip: null,
        };
      }

      // Address mode — read fields
      const address = (document.getElementById(`${prefix}-address`) || {}).value || "";
      const city    = (document.getElementById(`${prefix}-city`)    || {}).value || "";
      const state   = (document.getElementById(`${prefix}-state`)   || {}).value || "";
      const zip     = (document.getElementById(`${prefix}-zip`)     || {}).value || "";

      const result = {
        source,
        lat: null,
        lng: null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
      };

      // Geocode — only if we have enough signal (any address line + city OR zip)
      const hasSignal = result.address || (result.city && result.state);
      if (!hasSignal) return result;

      const q = [result.address, result.city, result.state, result.zip, "USA"].filter(Boolean).join(", ");
      try {
        const status = document.getElementById(`${prefix}-addr-status`);
        if (status) { status.textContent = "Looking up address…"; status.style.color = "var(--nx-text-muted)"; }
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
          headers: { "Accept": "application/json" },
        });
        const data = await r.json();
        if (Array.isArray(data) && data.length && data[0].lat && data[0].lon) {
          result.lat = parseFloat(data[0].lat);
          result.lng = parseFloat(data[0].lon);
          if (status) { status.textContent = `✓ Located at ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`; status.style.color = "#22c55e"; }
        } else {
          if (status) { status.textContent = "We couldn't pin this address — please double-check spelling."; status.style.color = "#ef4444"; }
        }
      } catch (_) {
        // If geocode fails, we still return the address fields — server-side
        // matching will just skip this provider until they update location.
      }
      return result;
    },
  };
})();
