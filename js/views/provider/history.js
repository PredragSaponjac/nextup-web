/* =============================================================
   NextUp — Provider History (responses / completed jobs)
   Route: #p-history
   ============================================================= */

window.Views.ProviderHistory = {
  async render() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body" id="body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-empty"><div class="nx-empty__title">Loading…</div></div>
        </div>
        ${window.providerTabBar("history")}
      </div>
    `);
    window.bindProviderTabBar();

    let rows = [];
    try {
      // Backend doesn't have a dedicated "my responses" endpoint — use dashboard stats for now.
      // For history we'll show the latest N incoming requests the provider has seen.
      rows = await window.apiFetch("/api/providers/dashboard").catch(() => ({}));
    } catch (_) {}

    const body = document.getElementById("body");
    body.innerHTML = `
      <header class="nx-appbar nx-appbar--lockup">
        <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
      </header>
      <div class="nx-listhead">
        <h1 class="nx-listhead__title">History</h1>
        <div class="nx-listhead__sub">Your recent activity</div>
      </div>
      <div class="nx-respcard" style="cursor:default;">
        <div class="nx-respcard__row">
          <div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted);">Total responses</div>
            <div style="font-family:var(--nx-font-serif); font-size:30px; color:var(--nx-text); margin-top:4px;">${rows.total_responses != null ? rows.total_responses : 0}</div>
          </div>
          <div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--nx-text-muted);">Jobs booked</div>
            <div style="font-family:var(--nx-font-serif); font-size:30px; color:var(--nx-text); margin-top:4px;">${rows.accepted_count != null ? rows.accepted_count : 0}</div>
          </div>
        </div>
      </div>
      <div class="nx-empty" style="padding-top:32px;">
        <div class="nx-empty__title">Full list coming soon</div>
        <div>We'll show every broadcast you've seen and every offer you've sent.</div>
      </div>
    `;
  },
};
