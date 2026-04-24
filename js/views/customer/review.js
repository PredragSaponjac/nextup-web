/* =============================================================
   NextUp — Leave Review (stars-only, one tap to rate)
   Design: 5 big stars side-by-side → tap the number you feel.
   Optional comment below. Submit enables on any star tap.
   Route: #review/:requestId
   ============================================================= */

window.Views.CustomerReview = {
  async render(params) {
    const requestId = params && params[0];
    const stored = sessionStorage.getItem("nextup_review_provider");
    let provider = stored ? JSON.parse(stored) : null;

    if (!provider && requestId) {
      try {
        const req = await window.apiFetch(`/api/requests/${requestId}`);
        const accepted = (req.responses || []).find(r => r.status === "accepted");
        if (accepted) {
          provider = {
            provider_id: accepted.provider_id,
            provider_name: accepted.provider_name,
            business_name: accepted.business_name,
          };
        }
      } catch (_) { /* swallow */ }
    }
    if (!provider) { window.navigate("my-requests"); return; }

    const name = provider.business_name || provider.provider_name || "Provider";

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">\u2039</button>
            <span class="nx-appbar__title">Rate provider</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:32px 0 12px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:30px; color:var(--nx-text); margin-bottom:6px;">${window.esc(name)}</div>
            <div style="font-family:var(--nx-font-sans); font-size:15px; color:var(--nx-text-muted);">How was it?</div>
          </div>

          <div class="nx-stars" style="display:flex; justify-content:center; gap:14px; padding:20px 0 8px;">
            ${[1,2,3,4,5].map(n => `
              <button type="button" class="nx-star-btn" data-n="${n}"
                aria-label="${n} star${n === 1 ? '' : 's'}"
                style="background:none; border:0; color:#3a3a3a; font-size:44px; line-height:1; padding:4px; cursor:pointer; transition:color 120ms ease;">\u2605</button>
            `).join("")}
          </div>
          <div id="rating-label" style="text-align:center; font-size:13px; color:var(--nx-text-muted); min-height:18px;">Tap a star</div>

          <div class="nx-notes" style="margin-top:26px;">
            <div class="nx-notes__label">Add a note <span style="color:var(--nx-text-muted); font-weight:400;">(optional)</span></div>
            <textarea class="nx-notes__input" id="review-text" placeholder="Anything worth saying?"></textarea>
          </div>

          <button class="nx-cta" id="submit-btn" disabled>Submit</button>
        </div>
      </div>
    `);

    let ratingValue = 0;

    const LABELS = ["Tap a star", "Bad", "Not great", "Okay", "Good", "Amazing"];

    const $ = id => document.getElementById(id);
    const submitBtn = $("submit-btn");
    const ratingLabel = $("rating-label");

    $("back-btn").addEventListener("click", () => window.history.back());

    const paintStars = (val) => {
      document.querySelectorAll(".nx-star-btn").forEach((b, i) => {
        b.style.color = i < val ? "#f5c518" : "#3a3a3a";
      });
      ratingLabel.textContent = LABELS[val] || LABELS[0];
    };

    document.querySelectorAll(".nx-star-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        ratingValue = parseInt(btn.dataset.n, 10);
        paintStars(ratingValue);
        submitBtn.disabled = false;
      });
    });

    submitBtn.addEventListener("click", async () => {
      if (!ratingValue) return;
      const comment = $("review-text").value.trim();
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting\u2026";
      try {
        await window.apiFetch("/api/reviews", {
          method: "POST",
          body: { provider_id: provider.provider_id, rating: ratingValue, comment: comment || null },
        });
        sessionStorage.removeItem("nextup_review_provider");
        window.toast && window.toast("Thanks for rating!", "success");
        window.navigate("my-requests");
      } catch (e) {
        window.nxAlert("Could not submit: " + (e.message || "network error"));
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }
    });
  },
};
