/* =============================================================
   NextUp — Customer: Search Providers by Name
   Lets a customer skip the broadcast flow and pick a specific
   business directly when they already know whom they want.
   Route: #search-providers
   ============================================================= */

(function () {
  const CATEGORY_LABELS = {
    beauty: "Beauty & Personal Care",
    spa_wellness: "Spa & Wellness",
    health_fitness: "Health & Fitness",
    home_cleaning: "Home Cleaning",
    home_repair: "Home Maintenance",
    lawn_outdoor: "Lawn & Outdoor",
    pets: "Pet Services",
    childcare: "Childcare & Family",
    senior_care: "Senior & Elder Care",
    moving: "Moving & Delivery",
    automotive: "Automotive",
    tech: "Tech & Smart Home",
    events: "Events & Entertainment",
    laundry: "Laundry & Clothing",
  };

  let _abortCtrl = null;
  let _coords = null;       // cached for the duration of this screen
  let _debounceT = null;
  let _lastResults = [];    // what the API returned last time (unfiltered)
  let _minRating = 0;       // 0 = all, 4 = 4★+, 4.5 = 4.5★+
  let _onlyGoogle = false;  // show only providers with google_business_url

  window.Views.CustomerSearchProviders = {
    async render() {
      window.mount(`
        <div class="nx-screen">
          <div class="nx-screen__body">
            <header class="nx-appbar nx-appbar--with-back">
              <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
              <span class="nx-appbar__title">Find a provider</span>
              <div></div>
            </header>

            <div style="padding-top:4px;">
              <div class="nx-search">
                <svg class="nx-search__icon" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="9" cy="9" r="6"></circle>
                  <path d="M14 14l4 4" stroke-linecap="round"></path>
                </svg>
                <input
                  id="sp-query"
                  type="search"
                  autocomplete="off"
                  autofocus
                  placeholder="Business or provider name…"
                  class="nx-search__input">
                <button id="sp-clear" class="nx-search__clear" aria-label="Clear" style="display:none;">×</button>
              </div>
              <p class="nx-search__hint" id="sp-hint">Type at least 2 letters to search.</p>
            </div>

            <div id="sp-filters" style="display:none; padding:4px 0 8px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:var(--nx-text-muted);">Rating</span>
                <span style="display:inline-block; padding:2px 7px; background:#f0b400; color:#000; font-size:9px; font-weight:700; letter-spacing:0.08em; border-radius:999px; text-transform:uppercase;">Beta</span>
              </div>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
                <button type="button" class="nx-filter-chip is-active" data-rating="0">All \u2605</button>
                <button type="button" class="nx-filter-chip" data-rating="4">4\u2605+</button>
                <button type="button" class="nx-filter-chip" data-rating="4.5">4.5\u2605+</button>
              </div>
              <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--nx-text-muted); cursor:pointer;">
                <input type="checkbox" id="sp-google-only"> Only providers also on Google
              </label>
              <div style="font-size:11px; color:var(--nx-text-muted); font-family:var(--nx-font-sans); margin-top:8px; line-height:1.45;">
                Beta: ratings come from NextUp customers only (not Google). If results are thin, try broadcasting instead.
              </div>
            </div>

            <div id="sp-results" class="nx-search__results"></div>
          </div>

          ${window.customerTabBar("home")}
        </div>
      `);

      document.getElementById("back-btn").addEventListener("click", () => window.history.back());
      window.bindCustomerTabBar();

      const input = document.getElementById("sp-query");
      const clearBtn = document.getElementById("sp-clear");
      const hint = document.getElementById("sp-hint");
      const results = document.getElementById("sp-results");

      // Warm up the coords once so ranking by distance works (no permission prompt — only if already granted)
      if (window.nxGetCoordsIfPermitted) {
        window.nxGetCoordsIfPermitted().then(c => { _coords = c; });
      }

      const doSearch = async (q) => {
        if (_abortCtrl) _abortCtrl.abort();
        _abortCtrl = new AbortController();
        const qs = new URLSearchParams({ q });
        if (_coords) { qs.set("lat", _coords.lat); qs.set("lng", _coords.lng); }
        hint.textContent = "Searching\u2026";
        results.innerHTML = "";
        try {
          const list = await window.apiFetch(`/api/providers/search?${qs.toString()}`, { signal: _abortCtrl.signal });
          _lastResults = list || [];
          this._applyFilters(q);
        } catch (e) {
          if (e.name === "AbortError") return;
          hint.textContent = "Couldn't search: " + (e.message || "network error");
        }
      };

      // Filter chip handlers
      const filterPanel = document.getElementById("sp-filters");
      filterPanel.querySelectorAll(".nx-filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          filterPanel.querySelectorAll(".nx-filter-chip").forEach(c => c.classList.remove("is-active"));
          chip.classList.add("is-active");
          _minRating = parseFloat(chip.dataset.rating) || 0;
          const q = input.value.trim();
          if (q.length >= 2) this._applyFilters(q);
        });
      });
      document.getElementById("sp-google-only").addEventListener("change", (e) => {
        _onlyGoogle = e.target.checked;
        const q = input.value.trim();
        if (q.length >= 2) this._applyFilters(q);
      });

      input.addEventListener("input", (e) => {
        const q = e.target.value.trim();
        clearBtn.style.display = q ? "" : "none";
        clearTimeout(_debounceT);
        if (q.length < 2) {
          results.innerHTML = "";
          hint.textContent = "Type at least 2 letters to search.";
          document.getElementById("sp-filters").style.display = "none";
          return;
        }
        document.getElementById("sp-filters").style.display = "";
        _debounceT = setTimeout(() => doSearch(q), 250);
      });

      clearBtn.addEventListener("click", () => {
        input.value = "";
        clearBtn.style.display = "none";
        results.innerHTML = "";
        hint.textContent = "Type at least 2 letters to search.";
        input.focus();
      });
    },

    _applyFilters(q) {
      let filtered = _lastResults.slice();
      if (_minRating > 0) {
        filtered = filtered.filter(p => Number(p.avg_rating || 0) >= _minRating);
      }
      if (_onlyGoogle) {
        filtered = filtered.filter(p => !!p.google_business_url);
      }
      this._renderList(filtered, q);
    },

    _renderList(list, q) {
      const hint = document.getElementById("sp-hint");
      const results = document.getElementById("sp-results");
      if (!list.length) {
        hint.textContent = `No providers match "${q}". Try a different spelling, or broadcast your request to everyone nearby.`;
        results.innerHTML = `
          <button class="nx-cta" id="sp-broadcast-instead" type="button" style="margin-top:24px;">
            Broadcast to everyone nearby
          </button>
        `;
        const b = document.getElementById("sp-broadcast-instead");
        if (b) b.addEventListener("click", () => window.navigate("home"));
        return;
      }
      hint.textContent = `${list.length} provider${list.length === 1 ? "" : "s"} found`;
      results.innerHTML = list.map(p => this._renderCard(p)).join("");
      document.querySelectorAll("[data-provider-id]").forEach(card => {
        card.addEventListener("click", () => {
          const pid = card.dataset.providerId;
          window.navigate(`provider/${pid}`);
        });
      });
    },

    _renderCard(p) {
      const name = p.business_name || p.full_name || "Provider";
      const cat = CATEGORY_LABELS[p.category] || p.category || "";
      const city = p.city || "";
      const miles = p.distance_miles != null ? `${Number(p.distance_miles).toFixed(1)} mi` : null;
      const hasReviews = p.total_reviews && p.total_reviews > 0;
      const rating = hasReviews
        ? `<span class="nx-respcard__star">★</span> ${Number(p.avg_rating).toFixed(1)} <span style="color:var(--nx-text-muted); font-weight:400;">(${p.total_reviews})</span>`
        : `New`;
      const googleBadge = p.google_business_url
        ? `<span class="nx-google-badge" title="Also listed on Google">\u2605 Google</span>`
        : "";
      const metaParts = [rating];
      if (miles) metaParts.push(`<span>${window.esc(miles)}</span>`);
      if (city) metaParts.push(`<span>${window.esc(city)}</span>`);
      const meta = metaParts.join(`<span class="nx-respcard__dot">\u00b7</span>`);
      return `
        <div class="nx-respcard" data-provider-id="${p.user_id}" style="cursor:pointer;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <h3 class="nx-respcard__name">${window.esc(name)}</h3>
            ${googleBadge}
          </div>
          <div class="nx-respcard__meta" style="font-size:14px;">${meta}</div>
          <div class="nx-respcard__meta" style="font-size:12px; color:var(--nx-text-muted); padding-top:4px; border-top:1px solid var(--nx-border-soft); margin-top:4px;">
            ${window.esc(cat)}
          </div>
        </div>
      `;
    },
  };
})();
