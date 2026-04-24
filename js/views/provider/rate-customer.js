/* =============================================================
   NextUp — Provider rates customer
   Ambient modal overlay, same stars-only UX as customer review.
   Triggered from History "★ Rate customer" chip. Never forced.

   Open via:
     window.Views.ProviderRateCustomer.open({
       requestId, customerId, customerName, onDone
     });
   ============================================================= */

window.Views.ProviderRateCustomer = {
  open({ requestId, customerId, customerName, onDone }) {
    const existing = document.getElementById("nx-rate-cust-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "nx-rate-cust-modal";
    overlay.style.cssText =
      "position:fixed; inset:0; z-index:10000; display:flex; align-items:flex-end; " +
      "justify-content:center; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); " +
      "-webkit-backdrop-filter:blur(4px);";

    const LABELS = ["Tap a star", "Bad", "Not great", "Okay", "Good", "Amazing"];
    const safeName = window.esc(customerName || "Customer");
    overlay.innerHTML = `
      <div style="width:100%; max-width:520px; background:#111; border-top:1px solid #2a2a2a; border-radius:20px 20px 0 0; padding:22px 22px 30px; color:#fafaf9; font-family:var(--nx-font-sans, system-ui);">
        <div style="text-align:center; padding:6px 0 14px;">
          <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:24px; margin-bottom:4px;">${safeName}</div>
          <div style="font-size:14px; color:var(--nx-text-muted);">How was it?</div>
        </div>
        <div style="display:flex; justify-content:center; gap:14px; padding:14px 0 6px;" id="rcm-stars">
          ${[1,2,3,4,5].map(n => `
            <button type="button" data-n="${n}" aria-label="${n} star${n === 1 ? '' : 's'}"
              style="background:none; border:0; color:#3a3a3a; font-size:42px; line-height:1; padding:4px; cursor:pointer;">\u2605</button>
          `).join("")}
        </div>
        <div id="rcm-label" style="text-align:center; font-size:13px; color:var(--nx-text-muted); min-height:18px;">${LABELS[0]}</div>
        <textarea id="rcm-comment" placeholder="Anything worth saying? (optional)" class="nx-notes__input" style="margin-top:18px; width:100%;"></textarea>
        <div style="display:flex; gap:10px; margin-top:14px;">
          <button id="rcm-cancel" type="button"
            style="flex:1; padding:13px; border-radius:10px; border:1px solid #2a2a2a; background:transparent; color:#fafaf9; font-size:15px;">
            Cancel
          </button>
          <button id="rcm-submit" type="button" disabled
            style="flex:2; padding:13px; border-radius:10px; border:0; background:#3a3a3a; color:#888; font-weight:600; font-size:15px;">
            Submit
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let ratingValue = 0;
    const starButtons = overlay.querySelectorAll("#rcm-stars button");
    const label = overlay.querySelector("#rcm-label");
    const submit = overlay.querySelector("#rcm-submit");
    const cancel = overlay.querySelector("#rcm-cancel");
    const comment = overlay.querySelector("#rcm-comment");

    const paintStars = (val) => {
      starButtons.forEach((b, i) => {
        b.style.color = i < val ? "#f5c518" : "#3a3a3a";
      });
      label.textContent = LABELS[val] || LABELS[0];
    };

    starButtons.forEach(b => {
      b.addEventListener("click", () => {
        ratingValue = parseInt(b.dataset.n, 10);
        paintStars(ratingValue);
        submit.disabled = false;
        submit.style.background = "#22c55e";
        submit.style.color = "#000";
      });
    });

    const cleanup = () => overlay.remove();
    cancel.addEventListener("click", cleanup);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(); });

    submit.addEventListener("click", async () => {
      if (!ratingValue) return;
      submit.disabled = true;
      submit.textContent = "Submitting\u2026";
      try {
        await window.apiFetch("/api/customer-reviews", {
          method: "POST",
          body: {
            customer_id: customerId,
            request_id: requestId,
            rating: ratingValue,
            comment: (comment.value || "").trim() || null,
          },
        });
        window.toast && window.toast("Thanks for rating!", "success");
        cleanup();
        if (typeof onDone === "function") onDone();
      } catch (e) {
        window.nxAlert("Couldn't submit: " + (e.message || "try again"));
        submit.disabled = false;
        submit.textContent = "Submit";
      }
    });
  },
};
