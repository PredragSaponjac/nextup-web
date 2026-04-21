/* =============================================================
   NextUp — Taxonomy Helpers
   Cascading selects, service search autocomplete, Google Places lookup.
   Extracted from nextup-portal/app.js.
   ============================================================= */

// --------------- Cascading dropdowns ---------------

/** Build Category dropdown HTML (Level 1). */
window.categorySelectHTML = function (id, selectedCat) {
  return `<select id="${id}" required>
    <option value="">Select category…</option>
    ${window.optionsFrom(window.SERVICES_TAXONOMY, selectedCat)}
  </select>`;
};

/** Build Subcategory dropdown HTML (Level 2). */
window.subcategorySelectHTML = function (id, catKey, selectedSub) {
  if (!catKey || !window.SERVICES_TAXONOMY[catKey]) {
    return `<select id="${id}" disabled><option>Select category first…</option></select>`;
  }
  return `<select id="${id}" required>
    <option value="">Select subcategory…</option>
    ${window.optionsFrom(window.SERVICES_TAXONOMY[catKey].subcategories, selectedSub)}
  </select>`;
};

/** Build Services checkboxes HTML (Level 3). */
window.servicesCheckboxesHTML = function (containerId, catKey, subKey, selectedServices) {
  if (!catKey || !subKey || !window.SERVICES_TAXONOMY[catKey]?.subcategories[subKey]) {
    return `<div id="${containerId}" class="services-checkboxes"><p class="hint">Select a subcategory to see available services.</p></div>`;
  }
  const services = window.SERVICES_TAXONOMY[catKey].subcategories[subKey].services;
  const selected = Array.isArray(selectedServices) ? selectedServices : [];
  const boxes = services.map(s => {
    const checked = selected.includes(s) ? "checked" : "";
    return `<label class="service-checkbox"><input type="checkbox" value="${window.esc(s)}" ${checked}><span>${window.esc(s)}</span></label>`;
  }).join("");
  return `<div id="${containerId}" class="services-checkboxes">${boxes}</div>`;
};

/** Bind cascading dropdown logic: category → subcategory → services. */
window.bindCascade = function (catId, subId, servicesContainerId, onChange) {
  const catEl = document.getElementById(catId);
  if (!catEl) return;
  const form = catEl.closest("form") || catEl.closest(".cascade-wrap") || document;

  form.addEventListener("change", (e) => {
    if (e.target.id === catId) {
      const catKey = e.target.value;
      const currentSub = document.getElementById(subId);
      if (currentSub) {
        const tmp = document.createElement("div");
        tmp.innerHTML = window.subcategorySelectHTML(subId, catKey, "");
        currentSub.replaceWith(tmp.firstElementChild);
      }
      const container = document.getElementById(servicesContainerId);
      if (container) container.outerHTML = window.servicesCheckboxesHTML(servicesContainerId, catKey, "", []);
      if (onChange) onChange();
    }
    if (e.target.id === subId) {
      const catKey = document.getElementById(catId).value;
      const subKey = e.target.value;
      const container = document.getElementById(servicesContainerId);
      if (container) container.outerHTML = window.servicesCheckboxesHTML(servicesContainerId, catKey, subKey, []);
      if (onChange) onChange();
    }
  });
};

/** Get checked services from a container. */
window.getCheckedServices = function (containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
};

// --------------- Service Search Autocomplete ---------------

let _flatIndex = null;

/** Flat index of all services for search: [{service, catKey, subcatKey, catLabel, subcatLabel}]. */
window.getFlatIndex = function () {
  if (_flatIndex) return _flatIndex;
  _flatIndex = [];
  for (const [catKey, cat] of Object.entries(window.SERVICES_TAXONOMY)) {
    for (const [subKey, sub] of Object.entries(cat.subcategories)) {
      for (const service of sub.services) {
        _flatIndex.push({
          service,
          serviceLower: service.toLowerCase(),
          subcatKey: subKey,
          subcatLabel: sub.label,
          catKey,
          catLabel: cat.label,
        });
      }
    }
  }
  return _flatIndex;
};

/** Highlight matching portion of text. */
window.highlightMatch = function (text, query) {
  if (!query) return window.esc(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return window.esc(text);
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return `${window.esc(before)}<strong>${window.esc(match)}</strong>${window.esc(after)}`;
};

/** Search input HTML. */
window.serviceSearchHTML = function (inputId, placeholder) {
  return `
    <div class="service-search-wrap">
      <input type="text" id="${inputId}" class="service-search-input"
        placeholder="${window.esc(placeholder || 'Start typing, e.g. Massage, Haircut, Plumbing…')}"
        autocomplete="off">
      <div class="service-search-results" id="${inputId}-results"></div>
    </div>`;
};

/** Bind search autocomplete with optional onSelect callback. */
window.bindServiceSearch = function (inputId, catId, subId, servicesContainerId, onSelect) {
  const input = document.getElementById(inputId);
  const resultsEl = document.getElementById(inputId + "-results");
  if (!input || !resultsEl) return;

  let debounceTimer = null;

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("open");
      return;
    }
    debounceTimer = setTimeout(() => {
      const index = window.getFlatIndex();
      const matches = index.filter(item => item.serviceLower.includes(q)).slice(0, 12);
      if (matches.length === 0) {
        resultsEl.innerHTML = `<div class="search-no-results">No services found for "${window.esc(input.value.trim())}"</div>`;
        resultsEl.classList.add("open");
        return;
      }
      resultsEl.innerHTML = matches.map((m) => `
        <button type="button" class="search-result-item"
          data-cat="${m.catKey}" data-sub="${m.subcatKey}" data-service="${window.esc(m.service)}">
          <span class="search-result-service">${window.highlightMatch(m.service, input.value.trim())}</span>
          <span class="search-result-path">${window.esc(m.catLabel)} › ${window.esc(m.subcatLabel)}</span>
        </button>
      `).join("");
      resultsEl.classList.add("open");
    }, 120);
  });

  resultsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".search-result-item");
    if (!btn) return;
    const catKey = btn.dataset.cat;
    const subKey = btn.dataset.sub;
    const serviceName = btn.dataset.service;

    if (onSelect) {
      onSelect({ catKey, subKey, serviceName });
      input.value = "";
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("open");
      return;
    }

    // Default: fill cascading selects
    const catEl = document.getElementById(catId);
    if (catEl) {
      catEl.value = catKey;
      catEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setTimeout(() => {
      const subEl = document.getElementById(subId);
      if (subEl) {
        subEl.value = subKey;
        subEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setTimeout(() => {
        const container = document.getElementById(servicesContainerId);
        if (container) {
          container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (cb.value === serviceName) cb.checked = true;
          });
        }
      }, 50);
    }, 50);

    input.value = "";
    resultsEl.innerHTML = "";
    resultsEl.classList.remove("open");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".service-search-wrap")) {
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("open");
    }
  });
};

// Google Places business-lookup helper removed from the customer app.
// Customers don't register businesses — that flow belongs to the separate web provider portal.
// The Google Places API key is still available for the provider portal deployment (see memory/reference_nextup_google_api.md).
