/* =============================================================
   NextUp — Customer Category Detail
   Route: #category/:key
   Shows subcategories and individual services for the category.
   ============================================================= */

window.Views.CustomerCategory = {
  render(params) {
    const catKey = params[0];
    const cat = window.SERVICES_TAXONOMY[catKey];
    if (!cat) {
      window.navigate("home");
      return;
    }

    const subcatsHTML = Object.entries(cat.subcategories).map(([subKey, sub]) => {
      const servicesHTML = sub.services.map(service => `
        <button class="service-row" data-cat="${catKey}" data-sub="${subKey}" data-service="${window.esc(service)}">
          <span class="service-row__label">${window.esc(service)}</span>
          <span class="service-row__arrow">›</span>
        </button>
      `).join("");
      return `
        <div class="subcategory-group">
          <div class="subcategory-header">${window.esc(sub.label)}</div>
          ${servicesHTML}
        </div>
      `;
    }).join("");

    window.mount(`
      <div class="app-shell">
        <header class="mobile-header">
          <button class="mobile-header__back" id="back-btn">← Back</button>
          <div class="mobile-header__logo" style="font-size:16px;">${window.esc(cat.label)}</div>
          <div style="width:52px;"></div>
        </header>

        <main class="main-content">
          <div class="page-header">
            <h1 class="page-header__title">${window.esc(cat.label)}</h1>
            <p class="page-header__subtitle">${window.CATEGORY_ICONS[catKey] || ""} Tap a service to request it.</p>
          </div>

          ${subcatsHTML}

          <button class="btn-secondary" id="broadcast-any" style="margin-top:20px;">
            Not sure? Just describe what you need
          </button>
        </main>

        ${window.customerTabBar("home")}
      </div>
    `);

    document.getElementById("back-btn").addEventListener("click", () => window.navigate("home"));

    document.querySelectorAll(".service-row").forEach(btn => {
      btn.addEventListener("click", () => {
        const service = btn.dataset.service;
        const cat = btn.dataset.cat;
        const sub = btn.dataset.sub;
        sessionStorage.setItem("nextup_broadcast_prefill", JSON.stringify({
          catKey: cat, subKey: sub, serviceName: service,
        }));
        window.navigate(`broadcast/${cat}`);
      });
    });

    document.getElementById("broadcast-any").addEventListener("click", () => {
      sessionStorage.setItem("nextup_broadcast_prefill", JSON.stringify({ catKey, subKey: "", serviceName: "" }));
      window.navigate(`broadcast/${catKey}`);
    });

    window.bindCustomerTabBar();
  },
};
