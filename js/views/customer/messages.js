/* =============================================================
   NextUp — Messages (V1 placeholder, dark themed)
   Route: #messages
   ============================================================= */

window.Views.CustomerMessages = {
  render() {
    window.mount(`
      <div class="nx-screen">
        <div class="nx-screen__body">
          <header class="nx-appbar nx-appbar--lockup">
            <span class="nx-appbar__lockup">Next<span class="nx-appbar__lockup-up">Up</span></span>
          </header>
          <div class="nx-listhead">
            <h1 class="nx-listhead__title">Messages</h1>
            <div class="nx-listhead__sub">Chat with your provider after booking</div>
          </div>
          <div class="nx-empty">
            <div class="nx-empty__title">Coming soon</div>
            <div>You'll be able to coordinate details with your provider here once you've booked.</div>
          </div>
        </div>
        ${window.customerTabBar("messages")}
      </div>
    `);
    window.bindCustomerTabBar();
  },
};
