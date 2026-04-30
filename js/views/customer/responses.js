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

// v1.3.20 — added "asap" tier for tightest urgency (3 mi, ~30 min).
// Buckets cascade smoothly: more time → wider radius → more providers.
const TF_ORDER = ["asap", "within_1h", "within_2h", "today", "tomorrow"];
const TF_LABEL = {
  asap: "As soon as possible",
  within_1h: "Within 1 hour",
  within_2h: "Within 2 hours",
  today: "Today",
  tomorrow: "Tomorrow",
};
const TF_RADIUS = { asap: 3, within_1h: 5, within_2h: 10, today: 25, tomorrow: 50 };

window.Views.CustomerResponses = {
  async render(params) {
    const requestId = params && params[0];
    if (!requestId) { window.navigate("home"); return; }

    this.requestId = requestId;
    // v1.3.21 — fresh visit resets the dismissed timer. Without this,
    // a customer who hit "Keep waiting" on one request and then
    // navigated to a different request would inherit the 3-min
    // suppression — wrong UX.
    this._expandDismissedAt = 0;
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
      // v1.3.18 — TZ-safe timestamp parsing. The backend returns
      // created_at without an explicit timezone (e.g. "2026-04-30
      // 20:30:00"). iOS Safari parses naive timestamps as LOCAL time;
      // for a customer in Houston (CDT, UTC-5) this made elapsedMin
      // negative and the 3-minute expand-card trigger never fired.
      // Fix: force UTC interpretation by appending "Z" when there's
      // no timezone marker. Also handle the "T" separator variant.
      let createdMs = Date.now();
      if (req.created_at) {
        let s = String(req.created_at).trim();
        // Convert "YYYY-MM-DD HH:MM:SS" to ISO "YYYY-MM-DDTHH:MM:SS"
        if (s.indexOf("T") === -1 && s.indexOf(" ") !== -1) {
          s = s.replace(" ", "T");
        }
        // Add Z if no timezone present (safe — backend stores UTC)
        if (!/[Zz]|[+-]\d\d:?\d\d$/.test(s)) {
          s = s + "Z";
        }
        const t = Date.parse(s);
        if (!isNaN(t)) createdMs = t;
      }
      const elapsedMin = Math.max(0, (Date.now() - createdMs) / 60000);
      const ago = this._timeAgo(Date.now() - createdMs);
      const tf = req.timeframe || "within_2h";
      const radius = TF_RADIUS[tf] || 10;
      // v1.3.18 — friendly time label for display. Customer picked
      // "As soon as possible" or "In 15 minutes" etc. — show that
      // verbatim instead of the bucket name "Within 1 hour".
      const friendlyTime = req.preferred_time_label || TF_LABEL[tf] || tf;

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
        // v1.3.21 — "Keep waiting" gives the customer another 3-min
        // breather before the card pops up again. Without this, hiding
        // the card via display:none was instantly undone by the next
        // 15-second polling re-render.
        const dismissedMs = this._expandDismissedAt || 0;
        const sinceDismissMin = (Date.now() - dismissedMs) / 60000;
        const shouldShowExpand = elapsedMin >= 3 && (dismissedMs === 0 || sinceDismissMin >= 3);
        if (shouldShowExpand) {
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
              <div class="nx-listhead__sub">sent ${window.esc(ago)} · ${window.esc(friendlyTime)} · ${radius} mi</div>
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

      // v1.3.20 — expand card has up to 4 buttons. Wire each.
      const expandBtn = document.getElementById("nx-expand-btn");
      if (expandBtn) {
        // Primary one-tap expand to next tier (auto-suggested)
        expandBtn.addEventListener("click", () => this._expandToNext(tf));
      }
      const expandMoreBtn = document.getElementById("nx-expand-more");
      if (expandMoreBtn) {
        // Open the picker for non-default jumps
        expandMoreBtn.addEventListener("click", () => this._expand(tf));
      }
      const keepWaitingBtn = document.getElementById("nx-keep-waiting");
      if (keepWaitingBtn) keepWaitingBtn.addEventListener("click", () => {
        // v1.3.21 — record the dismiss time so the next 15-second poll
        // doesn't immediately re-render the card. The card will
        // re-appear in 3 more minutes if there are still no responses.
        this._expandDismissedAt = Date.now();
        const card = document.getElementById("nx-expand-card");
        if (card) card.style.display = "none";
        window.toast && window.toast("Got it — we'll check back in 3 minutes.", "success");
      });
      const cancelBtn = document.getElementById("nx-cancel-broadcast");
      if (cancelBtn) cancelBtn.addEventListener("click", () => this._cancelBroadcast());

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
            You're already at the widest search — <strong style="color:var(--nx-text);">Tomorrow</strong>
            with a 50 mi radius. Providers may not be online right now in your area. You can keep this
            request open — new providers joining today may still respond.
          </div>
          <button id="nx-keep-waiting" type="button" class="nx-bookbtn" style="background:transparent; border:1px solid var(--nx-border); color:var(--nx-text); width:100%; margin-bottom:8px;">Keep waiting</button>
          <button id="nx-cancel-broadcast" type="button" class="nx-bookbtn" style="background:transparent; border:1px solid #ef4444; color:#ef4444; width:100%;">Cancel broadcast</button>
        </div>
      `;
    }

    // v1.3.20 — three explicit choices when a broadcast goes 3 min
    // with 0 responses:
    //   (1) ONE-TAP suggested expand to next tier (primary green).
    //       Labeled with the exact time + radius change so the
    //       cascade is obvious.
    //   (2) "More options ›" opens a bottom-sheet picker with all
    //       available higher tiers (lets customer leap further in
    //       a single tap — e.g. asap → tomorrow).
    //   (3) "Cancel broadcast" red outlined button — clean exit.
    // Body copy frames the cascade explicitly so customer always
    // knows what they're agreeing to: more time = wider radius =
    // more providers.
    const nextLabel = TF_LABEL[nextTf];
    const currentRadius = TF_RADIUS[currentTf];
    return `
      <div id="nx-expand-card" style="background:#1a1a1a; border:1px solid #44403c; border-radius:14px; padding:16px 18px; margin:14px 16px;">
        <div style="font-family:var(--nx-font-sans); font-size:14px; font-weight:600; color:var(--nx-text); margin-bottom:6px;">🕐 No responses yet</div>
        <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.5; margin-bottom:14px;">
          We searched <strong style="color:var(--nx-text);">${currentRadius} mi</strong> for <strong style="color:var(--nx-text);">${window.esc(TF_LABEL[currentTf] || currentTf)}</strong>. Want to widen the search to find more providers? Each step gives more time AND a wider radius.
        </div>

        <button id="nx-expand-btn" type="button" class="nx-bookbtn" style="width:100%; background:#22c55e; color:#000; font-weight:600; margin-bottom:8px;">
          Expand to ${window.esc(nextLabel)} · ${nextRadius} mi
        </button>

        <button id="nx-expand-more" type="button" class="nx-bookbtn" style="width:100%; background:transparent; border:1px solid var(--nx-border); color:var(--nx-text); margin-bottom:8px;">More options ›</button>

        <div style="display:flex; gap:8px;">
          <button id="nx-keep-waiting" type="button" class="nx-bookbtn" style="flex:1; background:transparent; border:1px solid var(--nx-border); color:var(--nx-text-muted);">Keep waiting</button>
          <button id="nx-cancel-broadcast" type="button" class="nx-bookbtn" style="flex:1; background:transparent; border:1px solid #ef4444; color:#ef4444;">Cancel broadcast</button>
        </div>
      </div>
    `;
  },

  async _expand(currentTf) {
    // v1.3.17 - picker UX. Show available time options as a bottom
    // sheet; customer picks how far to stretch in one tap. Each
    // option lists its associated search radius so the cascade
    // (more time -> wider radius -> more providers) is visible at
    // the moment of choice.
    const i = TF_ORDER.indexOf(currentTf);
    if (i < 0 || i >= TF_ORDER.length - 1) return;
    const options = TF_ORDER.slice(i + 1).map(tf => ({
      value: tf,
      label: TF_LABEL[tf],
      sub: "Searches up to " + TF_RADIUS[tf] + " mi",
    }));
    const picked = await window.nxSheet({
      title: "Expand the search",
      options,
      cancelLabel: "Keep waiting",
    });
    if (picked == null) return;
    const btn = document.getElementById("nx-expand-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Expanding…"; }
    try {
      const res = await window.apiFetch(
        "/api/requests/" + this.requestId + "/expand-search",
        { method: "POST", body: { new_timeframe: picked } }
      );
      const n = (res && res.newly_notified) || 0;
      const tfLabel = TF_LABEL[picked] || picked;
      const r = (res && res.radius_miles) || TF_RADIUS[picked];
      window.toast && window.toast(
        "Expanded to " + tfLabel + " (" + r + " mi) \u00b7 " + n + " more provider" + (n === 1 ? "" : "s") + " notified",
        "success"
      );
    } catch (e) {
      window.nxAlert("Couldn't expand: " + (e.message || "network error"));
      if (btn) { btn.disabled = false; btn.textContent = "Expand search \u203a"; }
    }
    await this._fetchAndRender(true);
  },

  // v1.3.20 — One-tap expand to the NEXT tier (no picker). Used by
  // the green "Expand to X · N mi" primary button on the expand card.
  async _expandToNext(currentTf) {
    const i = TF_ORDER.indexOf(currentTf);
    if (i < 0 || i >= TF_ORDER.length - 1) return;
    const nextTf = TF_ORDER[i + 1];
    const btn = document.getElementById("nx-expand-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Expanding…"; }
    try {
      const res = await window.apiFetch(
        "/api/requests/" + this.requestId + "/expand-search",
        { method: "POST", body: { new_timeframe: nextTf } }
      );
      const n = (res && res.newly_notified) || 0;
      const tfLabel = TF_LABEL[nextTf] || nextTf;
      const r = (res && res.radius_miles) || TF_RADIUS[nextTf];
      window.toast && window.toast(
        "Expanded to " + tfLabel + " (" + r + " mi) · " + n + " more provider" + (n === 1 ? "" : "s") + " notified",
        "success"
      );
    } catch (e) {
      window.nxAlert("Couldn't expand: " + (e.message || "network error"));
      if (btn) { btn.disabled = false; }
    }
    await this._fetchAndRender(true);
  },

  // v1.3.20 — Cancel the open broadcast. Asks for confirmation since
  // this is destructive and can't be undone (the request is closed).
  async _cancelBroadcast() {
    const ok = await window.nxConfirm(
      "Cancel this broadcast?\n\nNo more providers will see it. You can always create a new request anytime.",
      { okLabel: "Cancel broadcast", cancelLabel: "Keep request open", danger: true }
    );
    if (!ok) return;
    try {
      await window.apiFetch(
        "/api/requests/" + this.requestId + "/cancel",
        { method: "POST", body: {} }
      );
      window.toast && window.toast("Broadcast cancelled", "success");
      clearInterval(NX_POLL);
      window.navigate("home");
    } catch (e) {
      window.nxAlert("Couldn't cancel: " + (e.message || "network error"));
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
    const idVerified = r.id_verification_status === "verified";
    const verifiedBadge = idVerified
      ? `<span style="display:inline-block; margin-left:6px; padding:2px 7px; background:rgba(34,197,94,0.12); color:#22c55e; font-size:10px; font-weight:600; border-radius:999px; vertical-align:middle;" aria-label="ID Verified">✓ ID</span>`
      : ``;

    const parts = [ratingDisplay];
    if (miles) parts.push(`<span>${window.esc(miles)}</span>`);
    parts.push(`<span>${window.esc(avail)}</span>`);
    if (price) parts.push(`<span>${window.esc(price)}</span>`);
    const meta = parts.join(`<span class="nx-respcard__dot">·</span>`);

    return `
      <div class="nx-respcard">
        <h3 class="nx-respcard__name">${window.esc(providerName)}${verifiedBadge}</h3>
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
