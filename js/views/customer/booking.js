/* =============================================================
   NextUp — Booking Confirmation (dark, matches app design)
   Route: #booking/:requestId
   ============================================================= */

window.Views.CustomerBooking = {
  async render(params) {
    const requestId = params[0];

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body" id="booking-body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-empty">
            <div class="nx-empty__title">Loading…</div>
          </div>
        </div>
        ${window.customerTabBar("requests")}
      </div>
    `);
    window.bindCustomerTabBar();

    try {
      const req = await window.apiFetch(`/api/requests/${requestId}`);
      const accepted = (req.responses || []).find(r => r.status === "accepted");
      const body = document.getElementById("booking-body");

      if (!accepted) {
        body.innerHTML = `
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-empty">
            <div class="nx-empty__title">No booking yet</div>
            <div>This request hasn't been confirmed.</div>
          </div>
          <button class="nx-cta" onclick="window.navigate('responses/${requestId}')">View Responses</button>
        `;
        return;
      }

      const providerName = accepted.business_name || accepted.provider_name;

      body.innerHTML = `
        <header class="nx-appbar nx-appbar--lockup">
          <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
        </header>

        <div class="nx-confirmed">
          <div class="nx-confirmed__check">
            <svg viewBox="0 0 56 56" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="28" cy="28" r="26"/>
              <path d="M17 29l7 7 15-15"/>
            </svg>
          </div>
          <h1 class="nx-confirmed__title">Booking Confirmed</h1>
          <p class="nx-confirmed__sub">${window.esc(providerName)} will see you ${window.esc(accepted.available_time)}.</p>

          <div class="nx-confirmed__details">
            <div class="nx-confirmed__row">
              <span class="nx-confirmed__label">Provider</span>
              <span class="nx-confirmed__val">${window.esc(providerName)}</span>
            </div>
            <div class="nx-confirmed__row">
              <span class="nx-confirmed__label">Service</span>
              <span class="nx-confirmed__val">${window.esc(req.service_description || "—")}</span>
            </div>
            <div class="nx-confirmed__row">
              <span class="nx-confirmed__label">When</span>
              <span class="nx-confirmed__val">${window.esc(accepted.available_time)}</span>
            </div>
            <div class="nx-confirmed__row">
              <span class="nx-confirmed__label">Price</span>
              <span class="nx-confirmed__val">$${Math.round(accepted.price)}</span>
            </div>
          </div>

          <button class="nx-cta" id="message-btn" style="margin-top:8px;">Message ${window.esc(accepted.business_name || accepted.provider_name || "provider")}</button>
          <button class="nx-cta" id="review-btn" style="margin-top:10px; background:transparent; border:1px solid var(--nx-border); color:var(--nx-text);">Rate this provider</button>
          <button class="nx-cta" id="home-btn" style="margin-top:10px; background:transparent;">Back to Home</button>
        </div>
      `;

      document.getElementById("message-btn").addEventListener("click", () => {
        window.navigate(`thread/${requestId}`);
      });

      document.getElementById("review-btn").addEventListener("click", () => {
        sessionStorage.setItem("nextup_review_provider", JSON.stringify({
          provider_id: accepted.provider_id,
          provider_name: accepted.provider_name,
          business_name: accepted.business_name,
        }));
        window.navigate(`review/${requestId}`);
      });
      document.getElementById("home-btn").addEventListener("click", () => window.navigate("home"));
    } catch (e) {
      const body = document.getElementById("booking-body");
      if (body) {
        body.innerHTML = `
          <div class="nx-empty">
            <div class="nx-empty__title">Could not load booking</div>
            <div>${window.esc(e.message)}</div>
          </div>
          <button class="nx-cta" onclick="window.navigate('home')">Back to Home</button>
        `;
      }
    }
  },
};
