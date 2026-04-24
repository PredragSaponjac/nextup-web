/* =============================================================
   NextUp — Customer Responses
   Matches official mockup: top-left NextUp lockup →
   "N Responses" bold sans title → "sent X ago" gray sub →
   Cards with huge italic Zodiak business name + metadata
   row (★ rating · distance · time · $price) + white "Book" pill.

   Beta UX additions (April 2026):
   - Warm "we're growing our provider network" note shown from
     second 0 when there are no responses yet. Sets expectations
     for early users so slow responses feel explained, not broken.
   - After 3 minutes with 0 responses, an "Expand search" card
     appears with clear next-step buttons (bump timeframe, wait).
   - Auto-expand is deliberately NOT implemented — user stays in
     control of their original urgency. The server endpoint
     POST /api/requests/{id}/expand-search widens both timeframe
     AND Smart-Radius in one hop.
   ============================================================= */

let NX_POLL = null;
let NX_SORT = "rating"; // rating | price | distance | speed

const TF_ORDER = ["within_1h", "within_2h", "today", "tomorrow"];
const TF_LABEL = {
  within_1h: "Within 1 hour",
  within_2h: "Within 2 hours",
  today: "Today",
  tomorrow: "Tomorrow",
};
const TF_RADIUS = { within_1h: 5, within_2h: 10, today: 25, tomorrow: 50 };

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
      const elapsedMin = Math.max(0, (Date.now() - createdMs) / 60000);
      const ago = this._timeAgo(Date.now() - createdMs);
      const tf = req.timeframe || "within_2h";
      const radius = TF_RADIUS[tf] || 10;

      // Body: a stack of pieces (beta note, waiting state, expand prompt, cards)
      const pieces = [];

      if (count === 0) {
        pieces.push(this._renderBetaNote());
        pieces.push(`
          <div class="nx-empty">
            <div class="nx-empty__title">Waiting for responses…</div>
            <div>Broadcasting to online providers within ${radius} mi (${window.esc(TF_LABEL[tf] || tf)}).</div>
          </div>
        `);
        if (elapsedMin >= 3) {
          pieces.push(this._renderExpandCard(tf));
        }
      } else {
        if (responses.length > 1) {
          pieces.push(this._renderSortChips());
        }
        const sorted = this._sortResponses(responses.slice());
        pieces.push(sorted.map(r => this._renderCard(r)).join(""));
      }

      window.mount(`
        <div class="nx-screen">
          <div class="nx-screen__body">
            <header class="nx-appbar nx-appbar--with-back">
              <button class="nx-appbar__back" id="resp-back-btn" aria-label="Back">\u2039</button>
              <span class="nx-appbar__title">Responses</span>
              <div></div>
            </header>

            <div class="nx-listhead">
              <h1 class="nx-listhead__title">${count} ${count === 1 ? "Response" : "Responses"}</h1>
              <div class="nx-listhead__sub">sent ${window.esc(ago)} · ${window.esc(TF_LABEL[tf] || tf)} · ${radius} mi</div>
            </div>

            ${pieces.join("")}
          </div>

          ${window.customerTabBar("requests")}
        </div>
      `);

      const backBtn = document.getElementById("resp-back-btn");
      if (backBtn) backBtn.addEventListener("click", () => {
        clearInterval(NX_POLL);
        window.navigate("my-requests");
      });

      // Sort chips
      document.querySelectorAll("[data-sort]").forEach(chip => {
        chip.addEventListener("click", () => {
          NX_SORT = chip.dataset.sort;
          this._fetchAndRender(true);
        });
      });

      document.querySelectorAll("[data-book]").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await this._book(btn.dataset.book);
        });
      });

      const expandBtn = document.getElementById("nx-expand-btn");
      if (expandBtn) expandBtn.addEventListener("click", () => this._expand(tf));

      const keepWaitingBtn = document.getElementById("nx-keep-waiting");
      if (keepWaitingBtn) keepWaitingBtn.addEventListener("click", () => {
        const card = document.getElementById("nx-expand-card");
        if (card) card.style.display = "none";
      });

      window.bindCustomerTabBar();
    } catch (e) {
      if (!silent) window.nxAlert("Could not load responses: " + e.message);
    }
  },

  _renderSortChips() {
    const chips = [
      { key: "rating",   label: "Best rated" },
      { key: "price",    label: "Cheapest" },
      { key: "distance", label: "Closest" },
      { key: "speed",    label: "Fastest to reply" },
    ];
    return `
      <div style="padding:4px 0 12px;">
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
          ${chips.map(c => `
            <button type="button" class="nx-filter-chip ${c.key === NX_SORT ? 'is-active' : ''}" data-sort="${c.key}">${c.label}</button>
          `).join("")}
        </div>
        <div style="font-size:11px; color:var(--nx-text-muted); font-family:var(--nx-font-sans);">
          Sort \u00b7 ratings from NextUp customers only (Beta)
        </div>
      </div>
    `;
  },

  _sortResponses(list) {
    const last = Number.POSITIVE_INFINITY;
    const lowFirst = (v) => (v == null ? last : v);
    switch (NX_SORT) {
      case "price":
        return list.sort((a, b) => lowFirst(a.price) - lowFirst(b.price));
      case "distance":
        return list.sort((a, b) => lowFirst(a.distance_miles) - lowFirst(b.distance_miles));
      case "speed":
        return list.sort((a, b) => {
          const ta = a.created_at ? Date.parse(a.created_at) : last;
          const tb = b.created_at ? Date.parse(b.created_at) : last;
          return ta - tb;
        });
      case "rating":
      default:
        return list.sort((a, b) => (Number(b.avg_rating || 0)) - (Number(a.avg_rating || 0)));
    }
  },

  _renderBetaNote() {
    return `
      <div style="background:#1a1a1a; border:1px solid #2e2e2e; border-radius:14px; padding:16px 18px; margin:12px 16px 4px; font-family:var(--nx-font-sans); font-size:13px; line-height:1.5; color:var(--nx-text-muted);">
        <div style="color:#f0b400; font-weight:600; margin-bottom:6px;">🌱 We're in beta</div>
        <div>
          Our provider network is still growing. Early users may see fewer responses while we
          onboard more pros in your area. Thanks for being here while we build —
          you'll see speeds improve noticeably as more providers join each week.
        </div>
      </div>
    `;
  },

  _renderExpandCard(currentTf) {
    const i = TF_ORDER.indexOf(currentTf);
    const atMax = i < 0 || i >= TF_ORDER.length - 1;
    const nextTf = atMax ? null : TF_ORDER[i + 1];
    const nextRadius = nextTf ? TF_RADIUS[nextTf] : null;

    if (atMax) {
      return `
        <div id="nx-expand-card" style="background:#1a1a1a; border:1px solid #44403c; border-radius:14px; padding:16px 18px; margin:14px 16px;">
          <div style="font-family:var(--nx-font-sans); font-size:14px; font-weight:600; color:var(--nx-text); margin-bottom:6px;">🕐 Still no responses</div>
          <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.5; margin-bottom:10px;">
            You're already at the widest search (50 mi, tomorrow). Providers may not be online right now
            in your area. You can keep this request open — new providers joining today may still respond.
          </div>
          <button id="nx-keep-waiting" type="button" class="nx-bookbtn" style="background:transparent; border:1px solid var(--nx-border); color:var(--nx-text); width:100%;">Keep waiting</button>
        </div>
      `;
    }

    return `
      <div id="nx-expand-card" style="background:#1a1a1a; border:1px solid #44403c; border-radius:14px; padding:16px 18px; margin:14px 16px;">
        <div style="font-family:var(--nx-font-sans); font-size:14px; font-weight:600; color:var(--nx-text); margin-bottom:6px;">🕐 No responses yet — want to expand?</div>
        <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.5; margin-bottom:12px;">
          Since we're still growing, try widening to <strong style="color:#f0b400;">${window.esc(TF_LABEL[nextTf])}</strong>
          (${nextRadius} mi radius). We'll notify any additional providers now in range.
        </div>
        <div style="display:flex; gap:8px;">
          <button id="nx-expand-btn" type="button" class="nx-bookbtn" style="flex:1;">Expand to ${nextRadius} mi</button>
          <button id="nx-keep-waiting" type="button" class="nx-bookbtn" style="flex:1; background:transparent; border:1px solid var(--nx-border); color:var(--nx-text);">Keep waiting</button>
        </div>
      </div>
    `;
  },

  async _expand(currentTf) {
    const btn = document.getElementById("nx-expand-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Expanding…"; }
    try {
      const res = await window.apiFetch(`/api/requests/${this.requestId}/expand-search`, { method: "POST", body: {} });
      const n = (res && res.newly_notified) || 0;
      const r = (res && res.radius_miles) || null;
      window.toast && window.toast(`Expanded to ${r} mi \u00b7 notified ${n} more`, "success");
    } catch (e) {
      window.nxAlert("Couldn't expand: " + (e.message || "network error"));
    }
    await this._fetchAndRender(true);
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
    if (!(await window.nxConfirm("Book this provider?", { okLabel: "Book now" }))) return;
    try {
      await window.apiFetch(`/api/requests/${this.requestId}/accept/${responseId}`, { method: "POST" });
      clearInterval(NX_POLL);
      window.navigate(`booking/${this.requestId}`);
    } catch (e) {
      window.nxAlert("Could not book: " + e.message);
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
