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
        hint.textContent = "Searching…";
        results.innerHTML = "";
        try {
          const list = await window.apiFetch(`/api/providers/search?${qs.toString()}`, { signal: _abortCtrl.signal });
          this._renderList(list || [], q);
        } catch (e) {
          if (e.name === "AbortError") return;
          hint.textContent = "Couldn't search: " + (e.message || "network error");
        }
      };

      input.addEventListener("input", (e) => {
        const q = e.target.value.trim();
        clearBtn.style.display = q ? "" : "none";
        clearTimeout(_debounceT);
        if (q.length < 2) {
          results.innerHTML = "";
          hint.textContent = "Type at least 2 letters to search.";
          return;
        }
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
      const metaParts = [rating];
      if (miles) metaParts.push(`<span>${window.esc(miles)}</span>`);
      if (city) metaParts.push(`<span>${window.esc(city)}</span>`);
      const meta = metaParts.join(`<span class="nx-respcard__dot">·</span>`);
      return `
        <div class="nx-respcard" data-provider-id="${p.user_id}" style="cursor:pointer;">
          <h3 class="nx-respcard__name">${window.esc(name)}</h3>
          <div class="nx-respcard__meta" style="font-size:14px;">${meta}</div>
          <div class="nx-respcard__meta" style="font-size:12px; color:var(--nx-text-muted); padding-top:4px; border-top:1px solid var(--nx-border-soft); margin-top:4px;">
            ${window.esc(cat)}
          </div>
        </div>
      `;
    },
  };
})();
