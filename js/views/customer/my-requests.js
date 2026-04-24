/* =============================================================
   NextUp — Request History
   Route: #my-requests

   Swipe a row LEFT to reveal the action button:
     - open / booked → red "Cancel" (soft cancel, notifies provider if booked)
     - cancelled / completed → "Delete" (removes from history)
   ============================================================= */

window.Views.CustomerMyRequests = {
  async render() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body" id="req-body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-empty"><div class="nx-empty__title">Loading\u2026</div></div>
        </div>
        ${window.customerTabBar("requests")}
      </div>
    `);
    window.bindCustomerTabBar();
    await this._load();
  },

  async _load() {
    try {
      const requests = await window.apiFetch("/api/requests");
      this._paint(requests);
    } catch (e) {
      document.getElementById("req-body").innerHTML = `
        <div class="nx-empty">
          <div class="nx-empty__title">Couldn't load</div>
          <div>${window.esc(e.message)}</div>
        </div>`;
    }
  },

  _paint(requests) {
    const body = document.getElementById("req-body");
    const count = requests.length;

    if (!count) {
      body.innerHTML = `
        <header class="nx-appbar nx-appbar--lockup">
          <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
        </header>
        <div class="nx-listhead">
          <h1 class="nx-listhead__title">My Requests</h1>
          <div class="nx-listhead__sub">0 total</div>
        </div>
        <div class="nx-empty">
          <div class="nx-empty__title">No requests yet</div>
          <div>Tap Home to broadcast your first request.</div>
        </div>
        <button class="nx-cta" onclick="window.navigate('home')">Browse Services</button>
      `;
      return;
    }

    const rows = requests.map(r => {
      const active = r.status === "open" || r.status === "booked";
      const action = active ? "Cancel" : "Delete";
      const actionBg = active ? "#ef4444" : "#3f3f46";
      return `
        <div class="nx-swipe" data-req-id="${r.id}" data-status="${window.esc(r.status)}">
          <button class="nx-swipe__action" data-action="${active ? "cancel" : "delete"}"
                  style="background:${actionBg};">
            ${action}
          </button>
          <div class="nx-swipe__card nx-respcard" style="cursor:pointer;">
            <h3 class="nx-respcard__name" style="font-size:22px;">${window.esc(r.service_description || "Request")}</h3>
            <div class="nx-respcard__row">
              <div class="nx-respcard__meta">
                <span>${window.esc(this._timeAgo(r.created_at))}</span>
                <span class="nx-respcard__dot">\u00b7</span>
                <span>${r.response_count || 0} response${(r.response_count || 0) === 1 ? "" : "s"}</span>
                <span class="nx-respcard__dot">\u00b7</span>
                <span>${window.esc(r.status)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    body.innerHTML = `
      <header class="nx-appbar nx-appbar--lockup">
        <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
      </header>
      <div class="nx-listhead">
        <h1 class="nx-listhead__title">My Requests</h1>
        <div class="nx-listhead__sub">${count} total &middot; swipe left to cancel or delete</div>
      </div>
      ${rows}
    `;

    this._wire(body);
  },

  _wire(body) {
    const THRESHOLD = 60;    // px dragged before snap-open
    const OPEN_AT = 90;      // final open offset (matches button width)
    let current = null;      // the .nx-swipe being dragged
    let startX = 0;
    let offset = 0;          // running translateX
    let dragged = false;

    const closeAll = (except) => {
      body.querySelectorAll(".nx-swipe.is-open").forEach(el => {
        if (el === except) return;
        el.classList.remove("is-open");
        const card = el.querySelector(".nx-swipe__card");
        if (card) card.style.transform = "";
      });
    };

    body.querySelectorAll(".nx-swipe").forEach(wrap => {
      const card = wrap.querySelector(".nx-swipe__card");
      const action = wrap.querySelector(".nx-swipe__action");

      // Tap the card when closed → navigate. When open → close instead.
      card.addEventListener("click", (e) => {
        if (dragged) { dragged = false; return; }
        if (wrap.classList.contains("is-open")) {
          e.preventDefault();
          wrap.classList.remove("is-open");
          card.style.transform = "";
          return;
        }
        window.navigate(`responses/${wrap.dataset.reqId}`);
      });

      action.addEventListener("click", async (e) => {
        e.stopPropagation();
        const kind = action.dataset.action;
        const status = wrap.dataset.status;
        const id = wrap.dataset.reqId;
        if (kind === "cancel") {
          const label = status === "booked" ? "Cancel this appointment?" : "Cancel this request?";
          const sub = status === "booked"
            ? "The provider will be notified. You can't undo this."
            : "The request will be pulled. Providers who responded are notified.";
          const ok = await window.nxConfirm(label + "\n\n" + sub, { okLabel: "Cancel request", danger: true });
          if (!ok) return;
          try {
            await window.apiFetch(`/api/requests/${id}/cancel`, { method: "POST" });
            window.toast && window.toast("Cancelled", "success");
          } catch (err) {
            window.nxAlert("Couldn't cancel: " + err.message);
            return;
          }
        } else {
          const ok = await window.nxConfirm("Delete this request from history?", { okLabel: "Delete", danger: true });
          if (!ok) return;
          try {
            await window.apiFetch(`/api/requests/${id}`, { method: "DELETE" });
            window.toast && window.toast("Deleted", "success");
          } catch (err) {
            window.nxAlert("Couldn't delete: " + err.message);
            return;
          }
        }
        await window.Views.CustomerMyRequests._load();
      });

      const onDown = (e) => {
        const t = e.touches ? e.touches[0] : e;
        current = wrap;
        startX = t.clientX;
        offset = wrap.classList.contains("is-open") ? -OPEN_AT : 0;
        dragged = false;
        card.style.transition = "none";
      };
      const onMove = (e) => {
        if (current !== wrap) return;
        const t = e.touches ? e.touches[0] : e;
        const dx = t.clientX - startX;
        let next = Math.min(0, offset + dx);
        if (next < -OPEN_AT - 20) next = -OPEN_AT - 20;
        card.style.transform = `translateX(${next}px)`;
        if (Math.abs(dx) > 6) dragged = true;
      };
      const onUp = (e) => {
        if (current !== wrap) return;
        current = null;
        card.style.transition = "transform 160ms ease-out";
        const t = (e.changedTouches && e.changedTouches[0]) || e;
        const dx = t.clientX - startX;
        const finalOffset = offset + dx;
        if (finalOffset < -THRESHOLD) {
          closeAll(wrap);
          wrap.classList.add("is-open");
          card.style.transform = `translateX(-${OPEN_AT}px)`;
        } else {
          wrap.classList.remove("is-open");
          card.style.transform = "";
        }
      };

      card.addEventListener("touchstart", onDown, { passive: true });
      card.addEventListener("touchmove",  onMove, { passive: true });
      card.addEventListener("touchend",   onUp);
      // Mouse fallback for desktop testing
      card.addEventListener("mousedown",  onDown);
      card.addEventListener("mousemove",  (e) => { if (current === wrap && e.buttons === 1) onMove(e); });
      card.addEventListener("mouseup",    onUp);
      card.addEventListener("mouseleave", (e) => { if (current === wrap) onUp(e); });
    });

    // Tap outside any row closes open swipes
    body.addEventListener("click", (e) => {
      if (!e.target.closest(".nx-swipe")) closeAll();
    });
  },

  _timeAgo(iso) {
    if (!iso) return "just now";
    const ms = Date.now() - Date.parse(iso);
    const mins = Math.max(1, Math.round(ms / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.round(hrs / 24)} d ago`;
  },
};
