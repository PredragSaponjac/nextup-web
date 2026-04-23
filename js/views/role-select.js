/* =============================================================
   NextUp — Welcome / Role Selection
   Two-card picker: "I need a service" (customer) / "I'm a provider".
   Dark Zodiak theme matching the in-app aesthetic.
   ============================================================= */

window.Views.RoleSelect = {
  render() {
    window.mount(`
      <div class="nx-welcome">
        <div class="nx-welcome__grid" aria-hidden="true">
          <div class="nx-welcome__tile" style="background-image:url('assets/grid-beauty.png');"></div>
          <div class="nx-welcome__tile" style="background-image:url('assets/grid-cleaning.png');"></div>
          <div class="nx-welcome__tile" style="background-image:url('assets/grid-dogs.png');"></div>
          <div class="nx-welcome__tile" style="background-image:url('assets/grid-fitness.png');"></div>
          <div class="nx-welcome__tile" style="background-image:url('assets/grid-repair.png');"></div>
          <div class="nx-welcome__tile" style="background-image:url('assets/grid-spa.png');"></div>
        </div>
        <div class="nx-welcome__overlay" aria-hidden="true"></div>

        <div class="nx-welcome__top">
          <div class="nx-welcome__logo">NextUp</div>
        </div>

        <div class="nx-welcome__center">
          <p class="nx-welcome__label">On-Demand Services</p>
          <h1 class="nx-welcome__headline">Whatever you need.<br>Whoever's nearby.</h1>
          <p class="nx-welcome__sub">334 services &middot; 14 categories &middot; One tap.</p>

          <div class="nx-role-cards">
            <button class="nx-role-card" id="role-customer" type="button">
              <div class="nx-role-card__title">I need a service</div>
              <div class="nx-role-card__sub">Broadcast your request — nearby providers respond in minutes.</div>
              <div class="nx-role-card__arrow">›</div>
            </button>

            <button class="nx-role-card" id="role-provider" type="button">
              <div class="nx-role-card__title">I'm a provider</div>
              <div class="nx-role-card__sub">Get matched with customers nearby. 3 months free.</div>
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
