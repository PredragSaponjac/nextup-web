/* =============================================================
   NextUp — Welcome / Role Selection
   Two-card picker: "I need a service" (customer) / "I'm a provider".
   Dark Zodiak theme matching the in-app aesthetic.
   ============================================================= */

window.Views.RoleSelect = {
  render() {
    window.mount(`
      <div class="nx-welcome">
        <div class="nx-welcome__top">
          <div class="nx-welcome__logo">NextUp</div>
        </div>

        <div class="nx-welcome__center">
          <p class="nx-welcome__label">On-Demand Services</p>
          <h1 class="nx-welcome__headline">Whatever you need.<br>Whoever's nearby.</h1>
          <p class="nx-welcome__sub">113 services · 14 categories · One tap.</p>

          <div class="nx-role-cards">
            <button class="nx-role-card" id="role-customer" type="button">
              <div class="nx-role-card__title">I need a service</div>
              <div class="nx-role-card__sub">Broadcast your request — nearby providers respond in minutes.</div>
              <div class="nx-role-card__arrow">›</div>
            </button>

            <button class="nx-role-card" id="role-provider" type="button">
              <div class="nx-role-card__title">I'm a provider</div>
              <div class="nx-role-card__sub">Get matched with customers nearby. First month free.</div>
              <div class="nx-role-card__arrow">›</div>
            </button>
          </div>
        </div>

        <div class="nx-welcome__footer">
          <p class="nx-welcome__signin">
            Already have an account? <span class="nx-welcome__link" id="go-login">Sign in</span>
          </p>
        </div>
      </div>
    `);

    document.getElementById("role-customer").addEventListener("click", () => {
      window.persistPendingRole("customer");
      window.navigate("register");
    });

    document.getElementById("role-provider").addEventListener("click", () => {
      window.persistPendingRole("provider");
      window.navigate("register");
    });

    document.getElementById("go-login").addEventListener("click", () => {
      window.navigate("login");
    });
  },
};
