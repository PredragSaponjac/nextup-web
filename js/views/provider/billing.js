/* =============================================================
   NextUp — Provider Billing
   Subscription status + plan selection (Stripe not wired yet).
   Route: #billing
   ============================================================= */

window.Views.ProviderBilling = {
  async render() {
    let status = {};
    try {
      status = await window.apiFetch("/api/billing/status").catch(() => ({}));
    } catch (_) {}

    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>

          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Billing</h1>
            <div class="nx-listhead__sub">${status.plan ? window.esc(status.plan) : "Free trial"}</div>
          </div>

          <div class="nx-respcard" style="cursor:default; margin-bottom:20px;">
            <h3 class="nx-respcard__name" style="font-size:24px;">Free Trial</h3>
            <div style="font-size:14px; color:var(--nx-text-muted); padding:6px 0;">
              ${status.trial_ends_at ? "Ends " + window.esc(status.trial_ends_at) : "30 days free — no card required"}
            </div>
          </div>

          <div style="font-family:var(--nx-font-sans); font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted); padding-bottom:12px;">
            Choose a plan after trial
          </div>

          <div class="nx-respcard" style="cursor:pointer; margin-bottom:10px;">
            <div class="nx-respcard__row">
              <div>
                <h3 class="nx-respcard__name" style="font-size:22px;">Monthly</h3>
                <div style="font-size:13px; color:var(--nx-text-muted);">$19 / month · cancel anytime</div>
              </div>
              <div style="font-family:var(--nx-font-serif); font-size:26px; color:var(--nx-text);">$19</div>
            </div>
          </div>

          <div class="nx-respcard" style="cursor:pointer; margin-bottom:24px;">
            <div class="nx-respcard__row">
              <div>
                <h3 class="nx-respcard__name" style="font-size:22px;">Yearly</h3>
                <div style="font-size:13px; color:var(--nx-text-muted);">$199 / year · save 13%</div>
              </div>
              <div style="font-family:var(--nx-font-serif); font-size:26px; color:var(--nx-text);">$199</div>
            </div>
          </div>

          <button class="nx-cta" disabled style="opacity:0.5;">Stripe checkout coming soon</button>
          <div style="text-align:center; font-size:12px; color:var(--nx-text-muted); padding-top:10px;">
            Payment integration ships after TestFlight. No card needed during trial.
          </div>
        </div>
        ${window.providerTabBar("billing")}
      </div>
    `);

    window.bindProviderTabBar();
  },
};
