/* =============================================================
   NextUp — ID Verification (works for customer + provider modes)
   Route: #verify-id

   Two flows, picked at runtime by /api/verify-id/start:
     1. AUTOMATED (Persona configured server-side): user pays $5
        via Stripe Checkout → redirected to Persona's hosted ID +
        selfie + liveness flow → webhook updates status. Most
        verifications complete in 30-60 seconds with no human in
        the loop.
     2. MANUAL (Persona env vars not set, fallback): two-step
        camera capture (ID front + selfie) uploaded as multipart
        to /api/providers/verify-id (provider) or
        /api/auth/verify-id (customer). Admin reviews via email
        link.
   ============================================================= */

window.Views.ProviderVerifyId = {
  // Automated-mode state
  _mode: null,            // "automated" | "manual" | null (loading)
  _checkoutUrl: null,
  _resumeUrl: null,
  _feeUsd: 5,

  // Manual-mode state (preserved across re-renders)
  _idDataUrl: null,
  _selfieDataUrl: null,
  _step: 1,               // 1 = ID, 2 = selfie, 3 = review-and-submit

  async render() {
    this._idDataUrl = null;
    this._selfieDataUrl = null;
    this._step = 1;
    this._mode = null;
    this._checkoutUrl = null;
    this._resumeUrl = null;

    // Show a quick loading state while we ask the server which mode applies
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Get ID verified</span>
            <div></div>
          </header>
          <div style="text-align:center; padding:64px 24px; color:var(--nx-text-muted);">Setting up verification…</div>
        </div>
      </div>
    `);
    document.getElementById("back-btn").addEventListener("click", () => {
      const isProviderMode = window.getActiveMode && window.getActiveMode() === "provider";
      window.navigate(isProviderMode ? "p-profile" : "profile");
    });

    // Probe the server — does it have Persona configured?
    let resp = null;
    try {
      resp = await window.apiFetch("/api/verify-id/start", { method: "POST", body: {} });
    } catch (err) {
      // 4xx ("already verified" etc) → fall back to manual UI as safety net
      console.warn("verify-id/start failed:", err);
    }

    if (resp && resp.mode === "automated") {
      this._mode = "automated";
      this._checkoutUrl = resp.checkout_url || null;
      this._resumeUrl = resp.resume_url || null;
      this._feeUsd = resp.fee_usd || 5;
      this._mountAutomated();
      return;
    }

    // Fall back to the manual camera flow
    this._mode = "manual";
    this._mount();
  },

  _mountAutomated() {
    const isResume = !!this._resumeUrl;
    const url = this._checkoutUrl || this._resumeUrl;
    const fee = this._feeUsd;
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Get ID verified</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:14px 0 18px;">
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:24px; color:var(--nx-text);">
              ${isResume ? "Resume your verification" : "Verify your identity"}
            </div>
          </div>

          ${isResume ? `` : `
            <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:14px; padding:18px; margin-bottom:14px;">
              <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text); font-weight:600; margin-bottom:6px;">$${fee.toFixed(2)} one-time fee</div>
              <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.6;">
                Verification is run by Persona — a global identity vendor used by Robinhood, Coinbase, and others. Takes about 60 seconds: you'll photograph a government ID and take a selfie with a quick liveness check. Result is automatic.
              </div>
            </div>
          `}

          <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:14px; padding:18px; margin-bottom:18px;">
            <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text); font-weight:600; margin-bottom:6px;">What you'll need</div>
            <ul style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.7; padding-left:18px; margin:0;">
              <li>A driver's license, state ID, or passport</li>
              <li>Good lighting and a steady hand</li>
              <li>~60 seconds</li>
            </ul>
          </div>

          <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:14px; padding:14px 16px; margin-bottom:18px;">
            <div style="font-family:var(--nx-font-sans); font-size:12px; color:var(--nx-text-muted); line-height:1.5;">
              <strong style="color:var(--nx-text);">For businesses:</strong> ID verification confirms the registered account-holder (typically the owner). It does NOT extend to employees, sub-contractors, or anyone else you dispatch. You remain fully responsible for hiring, screening, training, supervising, and insuring your team.
            </div>
          </div>

          <button class="nx-cta" id="vid-go" type="button" style="background:#22c55e; color:#000; font-weight:600;">
            ${isResume ? "Continue verification ›" : `Pay $${fee.toFixed(2)} & verify ›`}
          </button>

          <div style="font-size:11px; color:var(--nx-text-muted); margin-top:12px; text-align:center;">
            ID verification confirms identity, not background. By continuing you agree to our <a href="terms.html" style="color:#22c55e;">Terms</a> &middot; <a href="privacy.html" style="color:#22c55e;">Privacy</a>.
          </div>

          <div id="vid-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px; text-align:center;"></div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => {
      const isProviderMode = window.getActiveMode && window.getActiveMode() === "provider";
      window.navigate(isProviderMode ? "p-profile" : "profile");
    });

    document.getElementById("vid-go").addEventListener("click", async () => {
      const btn = document.getElementById("vid-go");
      btn.disabled = true; btn.textContent = "Opening…";
      // Use Capacitor Browser plugin if available (in-app browser); else fall
      // back to plain navigation. Either way, after the user finishes, they
      // come back to the app — we refresh /me so the Profile shows the new
      // verification status (the Persona webhook updates the DB server-side).
      try {
        const Browser = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
        if (Browser && Browser.open) {
          // Listen ONCE for browser dismissal → refresh state + go back
          if (Browser.addListener) {
            const sub = Browser.addListener("browserFinished", async () => {
              try {
                const me = await window.apiMe();
                window.persistUser(me);
              } catch (_) {}
              const isProviderMode = window.getActiveMode && window.getActiveMode() === "provider";
              window.navigate(isProviderMode ? "p-profile" : "profile");
              try { sub.remove && sub.remove(); } catch (_) {}
            });
          }
          await Browser.open({ url, presentationStyle: "popover" });
        } else {
          window.location.href = url;
        }
      } catch (e) {
        const err = document.getElementById("vid-err");
        if (err) { err.textContent = "Couldn't open verification: " + (e.message || e); err.style.display = "block"; }
        btn.disabled = false; btn.textContent = isResume ? "Continue verification ›" : `Pay $${fee.toFixed(2)} & verify ›`;
      }
    });
  },

  _mount() {
    const step = this._step;
    const stepLabel = step === 1 ? "Step 1 of 2" : step === 2 ? "Step 2 of 2" : "Review & submit";

    const stepBody = step === 1
      ? this._stepIdHtml()
      : step === 2
        ? this._stepSelfieHtml()
        : this._stepReviewHtml();

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--with-back">
            <button class="nx-appbar__back" id="back-btn" aria-label="Back">‹</button>
            <span class="nx-appbar__title">Get ID verified</span>
            <div></div>
          </header>

          <div style="text-align:center; padding:14px 0 18px;">
            <div style="font-family:var(--nx-font-sans); font-size:12px; color:var(--nx-text-muted); letter-spacing:0.04em; text-transform:uppercase;">${window.esc(stepLabel)}</div>
            <div style="font-family:var(--nx-font-serif); font-style:italic; font-size:24px; color:var(--nx-text); margin-top:4px;">
              ${step === 1 ? "Upload front of your ID" : step === 2 ? "Take a selfie" : "Confirm and submit"}
            </div>
          </div>

          ${stepBody}

          <div id="vid-err" style="display:none; color:#ef4444; font-size:13px; margin-top:14px; text-align:center;"></div>
        </div>
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => {
      if (this._step > 1) {
        this._step -= 1;
        this._mount();
      } else {
        window.history.length > 1 ? window.history.back() : window.navigate("p-profile");
      }
    });

    if (step === 1) {
      document.getElementById("vid-pick-id").addEventListener("click", () => this._pickPhoto("id"));
      document.getElementById("vid-pick-id-gallery").addEventListener("click", () => this._pickPhoto("id", true));
    } else if (step === 2) {
      document.getElementById("vid-pick-selfie").addEventListener("click", () => this._pickPhoto("selfie"));
    } else {
      document.getElementById("vid-submit").addEventListener("click", () => this._submit());
      document.getElementById("vid-redo-id").addEventListener("click", () => { this._step = 1; this._mount(); });
      document.getElementById("vid-redo-selfie").addEventListener("click", () => { this._step = 2; this._mount(); });
    }
  },

  _stepIdHtml() {
    return `
      <div style="padding:0 4px;">
        <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:14px; padding:18px; margin-bottom:14px;">
          <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.6;">
            <strong style="color:var(--nx-text);">What works:</strong> driver's license, state ID, or passport. The whole document must be visible — all four corners, no glare, no fingers covering text.
          </div>
        </div>

        <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:14px; padding:14px 16px; margin-bottom:18px;">
          <div style="font-family:var(--nx-font-sans); font-size:12px; color:var(--nx-text-muted); line-height:1.5;">
            <strong style="color:var(--nx-text);">For businesses:</strong> ID verification confirms the person registered on this account (typically the owner). For businesses with multiple staff, this verifies the owner only — each staff member is subject to your business's own hiring practices and any applicable professional licenses (e.g. cosmetology, massage therapy, daycare). Business-level verification is coming in a future update.
          </div>
        </div>

        ${this._idDataUrl
          ? `<img src="${this._idDataUrl}" alt="ID preview" style="width:100%; max-height:280px; object-fit:contain; border-radius:14px; background:#0b0b0b; border:1px solid #2a2a2a; margin-bottom:14px;">`
          : `<div style="height:200px; display:flex; align-items:center; justify-content:center; background:#0b0b0b; border:2px dashed #2a2a2a; border-radius:14px; color:var(--nx-text-muted); font-size:13px; margin-bottom:14px;">No photo yet</div>`
        }

        <button class="nx-cta" id="vid-pick-id" type="button" style="margin-top:6px;">
          ${this._idDataUrl ? "Retake photo" : "Take photo"}
        </button>
        <button class="nx-cta" id="vid-pick-id-gallery" type="button" style="margin-top:10px; background:transparent; border:1px solid var(--nx-border); color:var(--nx-text);">
          Choose from photo library
        </button>

        ${this._idDataUrl
          ? `<button class="nx-cta" id="vid-next-1" type="button" onclick="(window.Views.ProviderVerifyId._step=2,window.Views.ProviderVerifyId._mount())" style="margin-top:14px; background:#22c55e; color:#000; font-weight:600;">Continue to selfie ›</button>`
          : ``
        }
      </div>
    `;
  },

  _stepSelfieHtml() {
    return `
      <div style="padding:0 4px;">
        <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:14px; padding:18px; margin-bottom:18px;">
          <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.6;">
            Hold your phone at arm's length and look directly at the camera. Good lighting, no hat, no sunglasses. We use this to confirm the ID belongs to you.
          </div>
        </div>

        ${this._selfieDataUrl
          ? `<img src="${this._selfieDataUrl}" alt="Selfie preview" style="width:100%; max-height:320px; object-fit:contain; border-radius:14px; background:#0b0b0b; border:1px solid #2a2a2a; margin-bottom:14px;">`
          : `<div style="height:240px; display:flex; align-items:center; justify-content:center; background:#0b0b0b; border:2px dashed #2a2a2a; border-radius:14px; color:var(--nx-text-muted); font-size:13px; margin-bottom:14px;">No selfie yet</div>`
        }

        <button class="nx-cta" id="vid-pick-selfie" type="button">
          ${this._selfieDataUrl ? "Retake selfie" : "Open camera"}
        </button>

        ${this._selfieDataUrl
          ? `<button class="nx-cta" type="button" onclick="(window.Views.ProviderVerifyId._step=3,window.Views.ProviderVerifyId._mount())" style="margin-top:14px; background:#22c55e; color:#000; font-weight:600;">Continue to review ›</button>`
          : ``
        }
      </div>
    `;
  },

  _stepReviewHtml() {
    return `
      <div style="padding:0 4px;">
        <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:14px; padding:18px; margin-bottom:18px;">
          <div style="font-family:var(--nx-font-sans); font-size:13px; color:var(--nx-text-muted); line-height:1.6;">
            Review takes about a day. We'll email you when it's done. ID verification confirms your identity — it's <strong style="color:var(--nx-text);">not a criminal background check</strong>.
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
          <div>
            <div style="font-family:var(--nx-font-sans); font-size:11px; color:var(--nx-text-muted); margin-bottom:6px; text-align:center;">ID</div>
            <img src="${this._idDataUrl}" alt="ID preview" style="width:100%; height:140px; object-fit:cover; border-radius:10px; background:#0b0b0b; border:1px solid #2a2a2a;">
            <button id="vid-redo-id" type="button" style="margin-top:6px; width:100%; background:transparent; border:0; color:#22c55e; font-size:12px; padding:0; cursor:pointer;">Retake</button>
          </div>
          <div>
            <div style="font-family:var(--nx-font-sans); font-size:11px; color:var(--nx-text-muted); margin-bottom:6px; text-align:center;">Selfie</div>
            <img src="${this._selfieDataUrl}" alt="Selfie preview" style="width:100%; height:140px; object-fit:cover; border-radius:10px; background:#0b0b0b; border:1px solid #2a2a2a;">
            <button id="vid-redo-selfie" type="button" style="margin-top:6px; width:100%; background:transparent; border:0; color:#22c55e; font-size:12px; padding:0; cursor:pointer;">Retake</button>
          </div>
        </div>

        <button class="nx-cta" id="vid-submit" type="button" style="background:#22c55e; color:#000; font-weight:600;">Submit for review</button>
      </div>
    `;
  },

  async _pickPhoto(which, fromGallery) {
    // Capacitor Camera plugin if available, else <input type=file capture> fallback
    const Camera = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera;
    let dataUrl = null;
    try {
      if (Camera && Camera.getPhoto) {
        const opts = {
          quality: 80,
          resultType: "DataUrl",
          source: fromGallery ? "PHOTOS" : (which === "selfie" ? "CAMERA" : "PROMPT"),
          correctOrientation: true,
          // For selfies, prefer front camera. For ID, use rear.
          direction: which === "selfie" ? "FRONT" : "REAR",
          width: 1600,
          allowEditing: false,
        };
        const res = await Camera.getPhoto(opts);
        dataUrl = res.dataUrl;
      } else {
        // Web/PWA fallback — file input
        dataUrl = await this._webPickPhoto(which === "selfie", fromGallery);
      }
    } catch (e) {
      // User cancelled or permission denied
      if (!e || (e.message || "").toLowerCase().includes("cancel")) return;
      const err = document.getElementById("vid-err");
      if (err) { err.textContent = "Couldn't open the camera: " + (e.message || e); err.style.display = "block"; }
      return;
    }
    if (!dataUrl) return;
    // Compress + cap dimensions before storing in memory
    dataUrl = await this._compress(dataUrl, 1600, 0.82);
    if (which === "id") this._idDataUrl = dataUrl;
    else this._selfieDataUrl = dataUrl;
    this._mount();
  },

  _webPickPhoto(useSelfieCamera, fromGallery) {
    return new Promise((resolve, reject) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "image/*";
      // capture attribute hints to mobile browsers to use camera
      if (!fromGallery) inp.capture = useSelfieCamera ? "user" : "environment";
      inp.style.display = "none";
      document.body.appendChild(inp);
      inp.addEventListener("change", () => {
        const f = inp.files && inp.files[0];
        document.body.removeChild(inp);
        if (!f) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(f);
      });
      inp.click();
    });
  },

  async _compress(dataUrl, maxDim, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (Math.max(w, h) > maxDim) {
          const ratio = maxDim / Math.max(w, h);
          w = Math.round(w * ratio); h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  },

  _dataUrlToBlob(dataUrl) {
    const [header, b64] = dataUrl.split(",");
    const mime = (header.match(/data:(.*?);/) || [])[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  },

  async _submit() {
    const btn = document.getElementById("vid-submit");
    const err = document.getElementById("vid-err");
    if (!this._idDataUrl || !this._selfieDataUrl) {
      err.textContent = "Both photos are required."; err.style.display = "block"; return;
    }
    btn.disabled = true; btn.textContent = "Uploading…";
    err.style.display = "none";
    try {
      const idBlob = this._dataUrlToBlob(this._idDataUrl);
      const selfieBlob = this._dataUrlToBlob(this._selfieDataUrl);
      const fd = new FormData();
      fd.append("id_doc", idBlob, "id.jpg");
      fd.append("selfie", selfieBlob, "selfie.jpg");
      // Mode-aware endpoint + return path: customer mode posts to the
      // generic /api/auth/verify-id (writes to users.X), provider mode
      // keeps the existing /api/providers/verify-id (writes to
      // provider_profiles.X — kept for back-compat with v1.2.0 deploys
      // already in flight; future versions will converge on /auth/).
      const isProviderMode = window.getActiveMode && window.getActiveMode() === "provider";
      const endpoint = isProviderMode ? "/api/providers/verify-id" : "/api/auth/verify-id";
      const returnRoute = isProviderMode ? "p-profile" : "profile";
      await window.apiFetch(endpoint, { method: "POST", body: fd });
      window.toast && window.toast("Submitted — we'll email you within a day.", "success");
      window.navigate(returnRoute);
    } catch (ex) {
      err.textContent = ex.message || "Couldn't upload. Please try again.";
      err.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit for review";
    }
  },
};
