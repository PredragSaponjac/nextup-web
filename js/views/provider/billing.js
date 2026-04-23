/* =============================================================
   NextUp — Provider Billing (real Stripe flow, Choice B)
   Route: #billing

   States:
     no subscription yet  \u2192 "Start 3-Month Free Trial" picker (monthly/yearly)
     trialing             \u2192 "Free trial \u2014 88 days left" + Add payment method
                             (soft) + Manage subscription
     active               \u2192 "Active \u2014 renews May 22" + Manage subscription
     past_due / unpaid    \u2192 "Payment failed \u2014 Update payment method" CTA
     canceled             \u2192 "Canceled" + Restart option
     expired (legacy)     \u2192 treat like canceled
   ============================================================= */

window.Views.ProviderBilling = {
  async render(params) {
    // Handle ?success=true after Stripe Checkout redirect. Stripe appends a
    // query string, but with hash routing that string can land either BEFORE
    // the hash (true query) OR AFTER (inside the hash). Check both.
    const href = window.location.href || "";
    const isReturnFromCheckout = href.includes("success=true");

    let status = {};
    let cfg = {};
    try {
      [status, cfg] = await Promise.all([
        window.apiFetch("/api/billing/status").catch(() => ({})),
        window.apiFetch("/api/billing/config").catch(() => ({})),
      ]);
    } catch (_) {}

    const stripeOk = cfg && cfg.configured;
    const trialDays = (cfg && cfg.trial_days) || 90;
    this._render(status, stripeOk, trialDays, isReturnFromCheckout);
  },

  _render(status, stripeOk, trialDays, isReturnFromCheckout) {
    const ourStatus = status && status.status;
    const stripeStatus = status && status.stripe_status;
    const trialLeft = status && status.trial_days_left;
    const plan = status && status.plan;
    const expiresAt = status && (status.expires_at || status.trial_end);

    let body;
    if (!stripeOk) {
      body = `
        <div class="nx-respcard" style="cursor:default; margin-bottom:20px;">
          <h3 class="nx-respcard__name" style="font-size:24px;">Billing coming soon</h3>
          <div style="font-size:14px; color:var(--nx-text-muted); padding:6px 0;">
            Payments aren't set up yet. You can keep using NextUp \u2014 we'll let you know when billing goes live.
          </div>
        </div>
        ${this._plansStatic()}
      `;
    } else if (ourStatus === "none" || !status.stripe_subscription_id) {
      // No subscription yet \u2014 show plan picker + Start trial CTAs
      body = this._startTrialUI(trialDays);
    } else if (stripeStatus === "trialing") {
      body = this._trialingUI(status, trialLeft, plan);
    } else if (stripeStatus === "active" || ourStatus === "active") {
      body = this._activeUI(status, plan, expiresAt);
    } else if (stripeStatus === "past_due" || stripeStatus === "unpaid") {
      body = this._pastDueUI(status);
    } else if (stripeStatus === "canceled" || ourStatus === "cancelled") {
      body = this._canceledUI(status, plan);
    } else {
      // Fallback for unknown states
      body = this._startTrialUI(trialDays);
    }

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>

          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Billing</h1>
            <div class="nx-listhead__sub">${this._subtitle(status, stripeOk)}</div>
          </div>

          ${isReturnFromCheckout ? `
            <div class="nx-respcard" style="cursor:default; margin-bottom:16px; background:rgba(34,197,94,0.08); border-color:#22c55e;">
              <div style="color:#22c55e; font-family:var(--nx-font-serif); font-size:18px;">\u2713 Thanks!</div>
              <div style="font-size:13px; color:var(--nx-text); padding-top:4px;">
                Payment method saved. Your subscription is all set.
              </div>
            </div>
          ` : ""}

          ${body}
        </div>
        ${window.providerTabBar("billing")}
      </div>
    `);

    this._bind(status);
    window.bindProviderTabBar();
  },

  _subtitle(status, stripeOk) {
    if (!stripeOk) return "Payments coming soon";
    const s = status && status.stripe_status;
    if (!s) return "No active subscription";
    if (s === "trialing") return "Free trial";
    if (s === "active") return (status.plan === "yearly" ? "Yearly" : "Monthly") + " subscription";
    if (s === "past_due" || s === "unpaid") return "Payment issue";
    if (s === "canceled") return "Canceled";
    return s;
  },

  _startTrialUI(trialDays) {
    // Display trial length in months when ≥ 30 days for a cleaner headline.
    const headline = trialDays >= 60
      ? `${Math.round(trialDays / 30)}-month free trial`
      : `${trialDays}-day free trial`;
    return `
      <div class="nx-respcard" style="cursor:default; margin-bottom:20px; background:linear-gradient(180deg, rgba(34,197,94,0.08) 0%, transparent 100%); border-color:var(--nx-border);">
        <h3 class="nx-respcard__name" style="font-size:24px;">${headline}</h3>
        <div style="font-size:14px; color:var(--nx-text-muted); padding:6px 0 0; line-height:1.5;">
          No credit card required. Full access to NextUp \u2014 receive broadcasts, send offers, complete bookings. Your trial starts the moment you tap below.
        </div>
      </div>

      <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding-bottom:12px;">
        Choose your plan (billed after trial)
      </div>

      <button type="button" class="nx-plan-card" data-plan="monthly">
        <div>
          <h3 class="nx-respcard__name" style="font-size:22px; margin:0;">Monthly</h3>
          <div style="font-size:13px; color:var(--nx-text-muted);">$19 / month &middot; cancel anytime</div>
        </div>
        <div style="font-family:var(--nx-font-serif); font-size:28px; color:var(--nx-text);">$19</div>
      </button>

      <button type="button" class="nx-plan-card" data-plan="yearly" style="margin-top:10px;">
        <div>
          <h3 class="nx-respcard__name" style="font-size:22px; margin:0;">Yearly <span style="display:inline-block; padding:2px 8px; background:#fafaf9; color:#000; border-radius:999px; font-size:11px; font-weight:500; margin-left:6px; vertical-align:middle;">SAVE $29</span></h3>
          <div style="font-size:13px; color:var(--nx-text-muted);">$199 / year &middot; best value</div>
        </div>
        <div style="font-family:var(--nx-font-serif); font-size:28px; color:var(--nx-text);">$199</div>
      </button>

      <p style="margin:24px 0 0; text-align:center; font-size:12px; color:var(--nx-text-muted);">
        We'll email you before your trial ends.
      </p>
    `;
  },

  _trialingUI(status, trialLeft, plan) {
    const daysLabel = trialLeft === 0 ? "ends today" : `${trialLeft} day${trialLeft === 1 ? "" : "s"} left`;
    const planLabel = plan === "yearly" ? "Yearly ($199/yr)" : "Monthly ($19/mo)";
    return `
      <div class="nx-respcard" style="cursor:default; margin-bottom:16px; background:linear-gradient(180deg, rgba(34,197,94,0.12) 0%, transparent 100%); border-color:#22c55e;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#22c55e;">Free trial</div>
        <h3 style="font-family:var(--nx-font-serif); font-size:32px; color:var(--nx-text); margin:4px 0 0;">${daysLabel}</h3>
        <div style="font-size:13px; color:var(--nx-text-muted); padding-top:6px;">
          After trial: ${planLabel}
        </div>
      </div>

      <button class="nx-cta" id="add-payment-btn">Add payment method now</button>
      <p style="margin:6px 0 16px; text-align:center; font-size:12px; color:var(--nx-text-muted);">
        Optional before trial ends. Prevents missed charge after day ${((status && status.trial_days_left) != null ? (status.trial_days_left + 1) : "trial end")}.
      </p>

      <button class="nx-cta" id="portal-btn" style="background:transparent; border:1px solid var(--nx-border); color:var(--nx-text);">Manage subscription</button>
    `;
  },

  _activeUI(status, plan, expiresAt) {
    const planLabel = plan === "yearly" ? "Yearly" : "Monthly";
    const priceLabel = plan === "yearly" ? "$199 / year" : "$19 / month";
    const renewDate = expiresAt ? this._formatDate(expiresAt) : null;
    return `
      <div class="nx-respcard" style="cursor:default; margin-bottom:16px; background:linear-gradient(180deg, rgba(34,197,94,0.08) 0%, transparent 100%); border-color:#22c55e;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#22c55e;">\u25cf Active</div>
        <h3 style="font-family:var(--nx-font-serif); font-size:26px; color:var(--nx-text); margin:4px 0 0;">${planLabel} &middot; ${priceLabel}</h3>
        ${renewDate ? `<div style="font-size:13px; color:var(--nx-text-muted); padding-top:6px;">Renews ${renewDate}</div>` : ""}
      </div>
      <button class="nx-cta" id="portal-btn">Manage subscription</button>
      <p style="margin:12px 0 0; text-align:center; font-size:12px; color:var(--nx-text-muted);">
        Update card, download invoices, switch plan, or cancel anytime.
      </p>
    `;
  },

  _pastDueUI(status) {
    return `
      <div class="nx-respcard" style="cursor:default; margin-bottom:16px; background:rgba(239,68,68,0.12); border-color:#ef4444;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#ef4444;">Payment failed</div>
        <h3 style="font-family:var(--nx-font-serif); font-size:22px; color:var(--nx-text); margin:4px 0 0;">Update your payment method to continue</h3>
        <div style="font-size:13px; color:var(--nx-text-muted); padding-top:6px;">
          Your most recent charge didn't go through. Add or update your card to keep receiving broadcasts.
        </div>
      </div>
      <button class="nx-cta" id="add-payment-btn">Update payment method</button>
      <button class="nx-cta" id="portal-btn" style="margin-top:10px; background:transparent; border:1px solid var(--nx-border); color:var(--nx-text);">Manage subscription</button>
    `;
  },

  _canceledUI(status, plan) {
    return `
      <div class="nx-respcard" style="cursor:default; margin-bottom:20px;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted);">Subscription canceled</div>
        <h3 style="font-family:var(--nx-font-serif); font-size:22px; color:var(--nx-text); margin:4px 0 0;">You're no longer subscribed</h3>
        <div style="font-size:13px; color:var(--nx-text-muted); padding-top:6px;">
          Start a new subscription anytime to receive broadcasts again.
        </div>
      </div>
      ${this._plansStatic(true)}
    `;
  },

  _plansStatic(clickable) {
    const extra = clickable ? "" : ' style="cursor:default;"';
    return `
      <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding-bottom:12px;">
        Plans
      </div>
      <div class="nx-plan-card"${clickable ? ' data-plan="monthly"' : ""}>
        <div>
          <h3 class="nx-respcard__name" style="font-size:22px; margin:0;">Monthly</h3>
          <div style="font-size:13px; color:var(--nx-text-muted);">$19 / month &middot; cancel anytime</div>
        </div>
        <div style="font-family:var(--nx-font-serif); font-size:28px; color:var(--nx-text);">$19</div>
      </div>
      <div class="nx-plan-card"${clickable ? ' data-plan="yearly"' : ""} style="margin-top:10px;">
        <div>
          <h3 class="nx-respcard__name" style="font-size:22px; margin:0;">Yearly</h3>
          <div style="font-size:13px; color:var(--nx-text-muted);">$199 / year &middot; save 13%</div>
        </div>
        <div style="font-family:var(--nx-font-serif); font-size:28px; color:var(--nx-text);">$199</div>
      </div>
    `;
  },

  _bind(status) {
    // Plan card click \u2192 start trial
    document.querySelectorAll(".nx-plan-card[data-plan]").forEach(el => {
      el.addEventListener("click", async () => {
        const plan = el.dataset.plan;
        if (!plan) return;
        if (!(await window.nxConfirm(
          `Start your 3-month free trial on the ${plan} plan?\n\nNo charge today. We won't bill you until the trial ends, and only if you add a payment method.`,
          { okLabel: "Start trial" }
        ))) return;
        el.disabled = true;
        el.style.opacity = "0.6";
        try {
          await window.apiFetch("/api/billing/start-trial", {
            method: "POST",
            body: { plan },
          });
          window.toast && window.toast("Trial started \u2014 welcome!", "success");
          window.Views.ProviderBilling.render();
        } catch (e) {
          window.nxAlert("Couldn't start trial: " + (e.message || "try again"));
          el.disabled = false;
          el.style.opacity = "";
        }
      });
    });

    // Add payment method \u2192 Stripe Checkout setup session
    const addPay = document.getElementById("add-payment-btn");
    if (addPay) {
      addPay.addEventListener("click", async () => {
        addPay.disabled = true;
        addPay.textContent = "Opening Stripe\u2026";
        try {
          const res = await window.apiFetch("/api/billing/add-payment-method", { method: "POST" });
          if (res && res.url) await window.nxOpenExternal(res.url);
          else throw new Error("No checkout URL");
        } catch (e) {
          window.nxAlert(e.message || "Couldn't open payment screen");
          addPay.disabled = false;
          addPay.textContent = "Add payment method";
        }
      });
    }

    // Manage subscription \u2192 Stripe Customer Portal
    const portal = document.getElementById("portal-btn");
    if (portal) {
      portal.addEventListener("click", async () => {
        portal.disabled = true;
        portal.textContent = "Opening portal\u2026";
        try {
          const res = await window.apiFetch("/api/billing/portal", { method: "POST" });
          if (res && res.url) await window.nxOpenExternal(res.url);
          else throw new Error("No portal URL");
        } catch (e) {
          window.nxAlert(e.message || "Couldn't open portal");
          portal.disabled = false;
          portal.textContent = "Manage subscription";
        }
      });
    }
  },

  _formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (_) { return iso; }
  },
};
