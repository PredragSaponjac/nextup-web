/* =============================================================
   NextUp — Leave Review (ultra-simple, one-tap)
   Primary: 👍 / 👎  (stored as 5★ or 1★ internally so existing
   aggregation + provider cards keep working unchanged).
   Secondary: "More detail?" expands a 5-star picker for power users.
   Optional comment. One button to submit.
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
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Rate provider</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:24px 0 6px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:28px; color:var(--nx-text); margin-bottom:8px;">${window.esc(name)}</div>
            <div style="font-family:var(--nx-font-sans); font-size:15px; color:var(--nx-text-muted);">Would you recommend them?</div>
          </div>

          <div class="nx-thumbs" id="thumbs-row">
            <button type="button" class="nx-thumb nx-thumb--down" data-val="down" aria-label="No, wouldn't recommend">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 14V5h10l3 7v4h-6l1 4a2 2 0 01-2 2l-4-8H7z"/>
              </svg>
              <span>No</span>
            </button>
            <button type="button" class="nx-thumb nx-thumb--up" data-val="up" aria-label="Yes, would recommend">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10v9h10l3-7v-4h-6l1-4a2 2 0 00-2-2L9 10H7z"/>
              </svg>
              <span>Yes</span>
            </button>
          </div>

          <button type="button" class="nx-link-inline" id="more-detail-btn"
            style="display:block; margin:18px auto 4px; background:none; border:0; color:var(--nx-text); font-family:var(--nx-font-sans); font-size:14px; font-weight:500; cursor:pointer; text-decoration:underline;">
            Add more detail \u2014 rate with stars
          </button>

          <div id="stars-row" style="display:none; padding:8px 0 12px;">
            <div style="text-align:center; color:var(--nx-text-muted); font-size:13px; margin-bottom:6px;">Rate 1 to 5 stars</div>
            <div class="nx-stars" style="display:flex; justify-content:center; gap:6px;">
              ${[1,2,3,4,5].map(n => `<button type="button" class="nx-star-btn" data-n="${n}" style="background:none; border:0; color:#3a3a3a; font-size:38px; line-height:1; padding:0; cursor:pointer;">★</button>`).join("")}
            </div>
          </div>

          <div class="nx-notes" style="margin-top:22px;">
            <div class="nx-notes__label">Add a note <span style="color:var(--nx-text-muted); font-weight:400;">(optional)</span></div>
            <textarea class="nx-notes__input" id="review-text" placeholder="Anything worth saying?"></textarea>
          </div>

          <button class="nx-cta" id="submit-btn" disabled>Submit</button>
          <p id="submit-hint" style="margin:10px 0 0; text-align:center; color:var(--nx-text-muted); font-size:12px;">Pick Yes or No (or tap stars) first.</p>
        </div>
      </div>
    `);

    let ratingValue = 0;   // 1..5, what we actually send
    let thumbChoice = null; // "up" | "down" | null (for UI highlight)

    const $ = id => document.getElementById(id);
    const submitBtn = $("submit-btn");
    const hint = $("submit-hint");

    const setReady = () => {
      submitBtn.disabled = !ratingValue;
      hint.style.display = ratingValue ? "none" : "block";
    };

    $("back-btn").addEventListener("click", () => window.history.back());

    document.querySelectorAll(".nx-thumb").forEach(btn => {
      btn.addEventListener("click", () => {
        thumbChoice = btn.dataset.val;
        ratingValue = (thumbChoice === "up") ? 5 : 1;
        document.querySelectorAll(".nx-thumb").forEach(b => b.classList.remove("nx-thumb--active"));
        btn.classList.add("nx-thumb--active");
        // Clear any previous star selection — the last-touched control wins
        document.querySelectorAll(".nx-star-btn").forEach(s => s.style.color = "#3a3a3a");
        setReady();
      });
    });

    $("more-detail-btn").addEventListener("click", () => {
      const row = $("stars-row");
      row.style.display = row.style.display === "none" ? "" : "none";
    });

    document.querySelectorAll(".nx-star-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        ratingValue = parseInt(btn.dataset.n, 10);
        thumbChoice = null;
        document.querySelectorAll(".nx-thumb").forEach(b => b.classList.remove("nx-thumb--active"));
        document.querySelectorAll(".nx-star-btn").forEach((b, i) => {
          b.style.color = i < ratingValue ? "#ffffff" : "#3a3a3a";
        });
        setReady();
      });
    });

    submitBtn.addEventListener("click", async () => {
      if (!ratingValue) return;
      const comment = $("review-text").value.trim();
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
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
