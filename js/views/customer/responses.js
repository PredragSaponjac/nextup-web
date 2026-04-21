/* =============================================================
   NextUp — Customer Responses
   Matches official mockup: top-left NextUp lockup →
   "N Responses" bold sans title → "sent X ago" gray sub →
   Cards with huge italic Zodiak business name + metadata
   row (★ rating · distance · time · $price) + white "Book" pill.
   ============================================================= */

let NX_POLL = null;

window.Views.CustomerResponses = {
  async render(params) {
    const requestId = params && params[0];
    if (!requestId) { window.navigate("home"); return; }

    this.requestId = requestId;
    await this._fetchAndRender();

    clearInterval(NX_POLL);
    NX_POLL = setInterval(() => this._fetchAndRender(true), 15000);
    window.addEventListener("hashchange", () => clearInterval(NX_POLL), { once: true });
  },

  async _fetchAndRender(silent) {
    try {
      const req = await window.apiFetch(`/api/requests/${this.requestId}`);
      const responses = (req.responses || []);
      const count = responses.length;
      const createdMs = req.created_at ? Date.parse(req.created_at) : Date.now();
      const ago = this._timeAgo(Date.now() - createdMs);

      const body = count === 0
        ? `<div class="nx-empty">
             <div class="nx-empty__title">Waiting for responses…</div>
             <div>Broadcasting to nearby providers. This usually takes under 5 minutes.</div>
           </div>`
        : responses.map(r => this._renderCard(r)).join("");

      window.mount(`
        <div class="nx-screen">
          <div class="nx-screen__body">
            <header class="nx-appbar nx-appbar--lockup">
              <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
            </header>

            <div class="nx-listhead">
              <h1 class="nx-listhead__title">${count} ${count === 1 ? "Response" : "Responses"}</h1>
              <div class="nx-listhead__sub">sent ${window.esc(ago)}</div>
            </div>

            ${body}
          </div>

          ${window.customerTabBar("requests")}
        </div>
      `);

      document.querySelectorAll("[data-book]").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await this._book(btn.dataset.book);
        });
      });

      window.bindCustomerTabBar();
    } catch (e) {
      if (!silent) alert("Could not load responses: " + e.message);
    }
  },

  _renderCard(r) {
    const providerName = r.business_name || r.provider_name || "Provider";
    const hasReviews = r.total_reviews && r.total_reviews > 0;
    const ratingDisplay = hasReviews
      ? `<span class="nx-respcard__star">★</span><span>${Number(r.avg_rating).toFixed(1)}</span>`
      : `<span>New</span>`;
    const miles = r.distance_miles != null ? `${Number(r.distance_miles).toFixed(1)} mi` : null;
    const avail = r.available_time || "Now";
    const price = r.price != null ? `$${Math.round(r.price)}` : null;

    const parts = [ratingDisplay];
    if (miles) parts.push(`<span>${window.esc(miles)}</span>`);
    parts.push(`<span>${window.esc(avail)}</span>`);
    if (price) parts.push(`<span>${window.esc(price)}</span>`);
    const meta = parts.join(`<span class="nx-respcard__dot">·</span>`);

    return `
      <div class="nx-respcard">
        <h3 class="nx-respcard__name">${window.esc(providerName)}</h3>
        <div class="nx-respcard__row">
          <div class="nx-respcard__meta">${meta}</div>
          <button class="nx-bookbtn" data-book="${r.id}">Book</button>
        </div>
      </div>
    `;
  },

  async _book(responseId) {
    if (!confirm("Book this provider?")) return;
    try {
      await window.apiFetch(`/api/requests/${this.requestId}/accept/${responseId}`, { method: "POST" });
      clearInterval(NX_POLL);
      window.navigate(`booking/${this.requestId}`);
    } catch (e) {
      alert("Could not book: " + e.message);
    }
  },

  _timeAgo(ms) {
    const mins = Math.max(1, Math.round(ms / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.round(hrs / 24)} d ago`;
  },
};
