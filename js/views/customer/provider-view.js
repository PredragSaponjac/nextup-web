/* =============================================================
   NextUp — Public Provider Profile (customer-facing detail)
   Route: #provider/:providerId
   Rewritten for the dark design system; adds a "Request booking"
   CTA that takes the customer into the broadcast form pre-targeted
   at this specific provider.
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

  window.Views.CustomerProviderView = {
    async render(params) {
      const providerId = params && params[0];
      if (!providerId) { window.navigate("home"); return; }

      window.mount(`
        <div class="nx-screen">
          <div class="nx-screen__body">
            <header class="nx-appbar nx-appbar--with-back">
              <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
              <span class="nx-appbar__title">Provider</span>
              <div></div>
            </header>
            <div id="pv-body">
              <div class="nx-empty"><div class="nx-empty__title">Loading…</div></div>
            </div>
          </div>

          ${window.customerTabBar("home")}
        </div>
      `);

      document.getElementById("back-btn").addEventListener("click", () => window.history.back());
      window.bindCustomerTabBar();

      try {
        const [profile, reviewsData] = await Promise.all([
          window.apiFetch(`/api/providers/${providerId}/profile`),
          window.apiFetch(`/api/providers/${providerId}/reviews`).catch(() => ({ reviews: [], avg_rating: null, total_reviews: 0 })),
        ]);
        this._renderProfile(profile, reviewsData, providerId);
      } catch (e) {
        document.getElementById("pv-body").innerHTML = `
          <div class="nx-empty">
            <div class="nx-empty__title">Couldn't load provider</div>
            <div>${window.esc(e.message || "")}</div>
          </div>
        `;
      }
    },

    _renderProfile(p, reviewsData, providerId) {
      const name = p.business_name || p.full_name || "Provider";
      const cat = CATEGORY_LABELS[p.category] || p.category || "";
      const city = p.city || "";
      const phone = p.phone || "";
      const avg = reviewsData.avg_rating || p.avg_rating;
      const total = reviewsData.total_reviews || p.total_reviews || 0;
      const hasReviews = total > 0;

      const services = Array.isArray(p.services) ? p.services : [];
      const servicesHTML = services.length
        ? services.map(s => `<span class="nx-chip">${window.esc(s)}</span>`).join("")
        : `<span style="color:var(--nx-text-muted); font-size:13px;">All services in ${window.esc(cat)}</span>`;

      const reviewsHTML = (reviewsData.reviews || []).map(r => `
        <div class="nx-respcard" style="cursor:default;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <strong style="font-family:var(--nx-font-serif); font-size:18px;">${window.esc(r.reviewer_name || "Customer")}</strong>
            <span class="nx-respcard__star">★ ${Number(r.rating).toFixed(1)}</span>
          </div>
          ${r.comment ? `<p style="margin:6px 0 0; font-size:14px; color:var(--nx-text);">${window.esc(r.comment)}</p>` : ""}
          ${r.created_at ? `<p style="margin:6px 0 0; font-size:12px; color:var(--nx-text-muted);">${window.esc(window.timeAgo(r.created_at) || "")}</p>` : ""}
        </div>
      `).join("");

      document.getElementById("pv-body").innerHTML = `
        <div class="nx-listhead">
          <h1 class="nx-listhead__title" style="font-family:var(--nx-font-serif); font-style:italic;">${window.esc(name)}</h1>
          <div class="nx-listhead__sub">
            ${hasReviews ? `<span class="nx-respcard__star">★</span> ${Number(avg).toFixed(1)} · ${total} review${total === 1 ? "" : "s"}` : "New on NextUp"}
            ${city ? ` · ${window.esc(city)}` : ""}
          </div>
        </div>

        <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding:0 0 10px;">
          Category
        </div>
        <div style="color:var(--nx-text); font-size:15px; padding:0 0 18px; border-bottom:1px solid var(--nx-border-soft); margin-bottom:18px;">
          ${window.esc(cat)}
        </div>

        <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding:0 0 10px;">
          Services offered
        </div>
        <div class="nx-chipstack" style="padding-bottom:22px;">${servicesHTML}</div>

        <button class="nx-cta" id="pv-request-btn" type="button" style="margin-bottom:24px;">Request booking</button>

        ${phone ? `
          <button class="nx-cta" id="pv-call-btn" type="button"
            style="background:transparent; color:var(--nx-text); border:1px solid var(--nx-border); margin-bottom:14px;">
            Call ${window.esc(phone)}
          </button>
        ` : ""}

        ${p.google_business_url ? `
          <button class="nx-cta" id="pv-google-btn" type="button"
            style="background:transparent; color:var(--nx-text); border:1px solid var(--nx-border); margin-bottom:24px; display:flex; align-items:center; justify-content:center; gap:8px;">
            <span style="font-family:var(--nx-font-sans); font-size:14px;">View on Google</span>
            <span style="font-size:14px; color:var(--nx-text-muted);">\u2197</span>
          </button>
        ` : ""}

        <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding:8px 0 12px;">
          Reviews
        </div>
        ${reviewsHTML || `<div class="nx-empty" style="padding:16px 0 0;"><div style="color:var(--nx-text-muted); font-size:14px;">No reviews yet.</div></div>`}
      `;

      document.getElementById("pv-request-btn").addEventListener("click", () => {
        // Jump into the broadcast form with this provider's category pre-selected
        // and targetProviderId set, so the form sends directly to them.
        window.navigate(`broadcast/${p.category}/${providerId}`);
      });

      const callBtn = document.getElementById("pv-call-btn");
      if (callBtn) {
        callBtn.addEventListener("click", () => {
          window.location.href = `tel:${phone.replace(/[^+\d]/g, "")}`;
        });
      }

      const googleBtn = document.getElementById("pv-google-btn");
      if (googleBtn && p.google_business_url) {
        googleBtn.addEventListener("click", () => {
          window.nxOpenExternal(p.google_business_url);
        });
      }
    },
  };
})();
