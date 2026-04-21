/* =============================================================
   NextUp — Provider Respond Form
   Provider sees request detail + submits price / time / message.
   Route: #respond/:requestId
   ============================================================= */

window.Views.ProviderRespond = {
  async render(params) {
    const requestId = (params && params[0]) || sessionStorage.getItem("nx_respond_request_id");
    if (!requestId) { window.navigate("dashboard"); return; }

    let req = null;
    try {
      req = await window.apiFetch(`/api/requests/${requestId}`);
    } catch (e) {
      alert("Could not load request: " + e.message);
      window.navigate("dashboard");
      return;
    }

    const timeLbl = {
      within_1h: "Within 1 hour",
      within_2h: "Within 2 hours",
      today: "Today",
      tomorrow: "Tomorrow",
    }[req.timeframe] || req.timeframe;

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Respond</span>
            <div></div>
          </header>

          <div class="nx-listhead" style="padding-bottom:14px;">
            <h1 class="nx-listhead__title" style="font-size:26px;">${window.esc(req.service_description || "Request")}</h1>
            <div class="nx-listhead__sub">${window.esc(timeLbl)}${req.preferred_gender && req.preferred_gender !== "any" ? " · prefers " + window.esc(req.preferred_gender) : ""}</div>
          </div>

          ${req.notes ? `
            <div class="nx-respcard" style="cursor:default; margin-bottom:16px;">
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); margin-bottom:6px;">Customer notes</div>
              <div style="font-size:14px; color:var(--nx-text);">${window.esc(req.notes)}</div>
            </div>
          ` : ""}

          <form id="respond-form" class="nx-form">
            <div class="nx-form__row">
              <div class="nx-form__label">Your price (USD)</div>
              <input class="nx-auth-input" type="number" id="r-price" required min="1" step="1" placeholder="e.g. 85">
            </div>
            <div class="nx-form__row">
              <div class="nx-form__label">When can you do it?</div>
              <input class="nx-auth-input" type="text" id="r-time" required placeholder="e.g. Today 2 PM, or In 30 min">
            </div>
            <div class="nx-notes">
              <div class="nx-notes__label">Message to customer (optional)</div>
              <textarea class="nx-notes__input" id="r-msg" placeholder="Let them know why you're the right fit…"></textarea>
            </div>
            <div id="r-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px;"></div>
            <button type="submit" class="nx-cta" id="r-submit">Send offer</button>
          </form>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.history.back());

    const form = document.getElementById("respond-form");
    const errEl = document.getElementById("r-err");
    const btn = document.getElementById("r-submit");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errEl.style.display = "none";
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        await window.apiFetch(`/api/requests/${requestId}/respond`, {
          method: "POST",
          body: {
            available_time: document.getElementById("r-time").value.trim(),
            price: parseFloat(document.getElementById("r-price").value),
            message: document.getElementById("r-msg").value.trim() || null,
          },
        });
        sessionStorage.removeItem("nx_respond_request_id");
        alert("Offer sent. The customer will see it right away.");
        window.navigate("dashboard");
      } catch (ex) {
        errEl.textContent = ex.message || "Could not send offer";
        errEl.style.display = "block";
        btn.disabled = false; btn.textContent = "Send offer";
      }
    });
  },
};
