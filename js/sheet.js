/* =============================================================
   NextUp — Bottom Sheet picker
   Drop-in replacement for native prompt() dialogs.
   Dark themed, slides up from bottom, tap row or outside to close.
   ============================================================= */

/**
 * Show a bottom-sheet picker with a list of options.
 *
 * @param {object} opts
 *   title        — string, header text
 *   options      — array of { value, label, sub?, disabled?, disabledReason? }
 *                  OR plain strings. When `disabled: true`, the row is
 *                  rendered greyed-out with a "Coming soon" badge; tapping
 *                  it does NOT close the sheet — instead it surfaces the
 *                  `disabledReason` as an inline banner so the user can
 *                  pick a different option without losing context.
 *   selectedValue — value to pre-highlight
 *   cancelLabel  — default "Cancel"
 * @returns Promise<any|null> resolved with the chosen `value`, or null if cancelled.
 */
window.nxSheet = function (opts) {
  return new Promise((resolve) => {
    const options = (opts.options || []).map(o =>
      typeof o === "string" ? { value: o, label: o } : o
    );
    const selected = opts.selectedValue;

    const overlay = document.createElement("div");
    overlay.className = "nx-sheet-overlay";

    const rowsHtml = options.map((o, i) => {
      const sel = o.value === selected ? " nx-sheet__row--selected" : "";
      const dis = o.disabled ? " nx-sheet__row--disabled" : "";
      const sub = o.sub ? `<span class="nx-sheet__sub">${window.esc(o.sub)}</span>` : "";
      const badge = o.disabled
        ? `<span style="margin-left:8px; padding:2px 8px; border-radius:999px; background:#3a2a0a; color:#f0b400; font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase;">Coming soon</span>`
        : "";
      const labelStyle = o.disabled
        ? ' style="color:#6b6b6b; text-decoration:line-through; text-decoration-color:#3a3a3a;"'
        : "";
      const checkSpan = o.disabled
        ? `<span aria-hidden="true">⏳</span>`
        : `<span class="nx-sheet__check">✓</span>`;
      return `
        <button type="button" class="nx-sheet__row${sel}${dis}" data-idx="${i}">
          <span><span${labelStyle}>${window.esc(o.label)}</span>${badge}${sub}</span>
          ${checkSpan}
        </button>`;
    }).join("");

    overlay.innerHTML = `
      <div class="nx-sheet" role="dialog" aria-modal="true">
        <div class="nx-sheet__grab" aria-hidden="true"></div>
        <h3 class="nx-sheet__title">${window.esc(opts.title || "Choose")}</h3>
        <div id="nx-sheet-disabled-banner" style="display:none; margin:0 16px 10px; padding:12px 14px; background:#2a1a0a; border:1px solid #f0b400; border-radius:12px; color:#f0b400; font-size:12px; line-height:1.5;"></div>
        <div class="nx-sheet__list">${rowsHtml}</div>
        <button type="button" class="nx-sheet__cancel" data-cancel>${window.esc(opts.cancelLabel || "Cancel")}</button>
      </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const close = (val) => {
      document.body.style.overflow = "";
      overlay.remove();
      resolve(val);
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) return close(null);
      if (e.target.closest("[data-cancel]")) return close(null);
      const row = e.target.closest(".nx-sheet__row");
      if (!row) return;
      const opt = options[parseInt(row.dataset.idx, 10)];
      if (opt && opt.disabled) {
        // Don't close — show the reason inline so the user can pick another row.
        const banner = document.getElementById("nx-sheet-disabled-banner");
        if (banner) {
          banner.textContent = opt.disabledReason || "This option isn't available yet.";
          banner.style.display = "block";
        }
        return;
      }
      close(opt.value);
    });

    // Esc key to cancel
    const onKey = (e) => { if (e.key === "Escape") { document.removeEventListener("keydown", onKey); close(null); } };
    document.addEventListener("keydown", onKey);
  });
};

/**
 * Multi-select bottom sheet. Default: ALL options pre-selected (easy opt-out
 * model — provider unchecks what they don't offer, rather than hunting to tick
 * every box). Returns an array of selected `value`s, or null if cancelled.
 *
 * @param {object} opts
 *   title            string
 *   options          array of { value, label, sub? } OR strings
 *   selectedValues   array of values to pre-check (defaults to all values)
 *   doneLabel        CTA button label (default "Done")
 *   hint             optional small hint line under the title
 */
window.nxMultiSheet = function (opts) {
  return new Promise((resolve) => {
    const options = (opts.options || []).map(o =>
      typeof o === "string" ? { value: o, label: o } : o
    );
    const allValues = options.map(o => o.value);
    let selected = new Set(opts.selectedValues !== undefined ? opts.selectedValues : allValues);

    const overlay = document.createElement("div");
    overlay.className = "nx-sheet-overlay";

    function renderRows() {
      return options.map((o, i) => {
        const isSel = selected.has(o.value);
        const sub = o.sub ? `<div class="nx-sheet__sub" style="margin-left:0;">${window.esc(o.sub)}</div>` : "";
        return `
          <button type="button" class="nx-sheet__row ${isSel ? 'nx-sheet__row--selected' : ''}" data-idx="${i}">
            <span>${window.esc(o.label)}${sub}</span>
            <span class="nx-multi-check" aria-hidden="true">${isSel ? "✓" : ""}</span>
          </button>`;
      }).join("");
    }

    overlay.innerHTML = `
      <div class="nx-sheet" role="dialog" aria-modal="true">
        <div class="nx-sheet__grab" aria-hidden="true"></div>
        <h3 class="nx-sheet__title">${window.esc(opts.title || "Choose")}</h3>
        ${opts.hint ? `<div style="text-align:center; font-size:12px; color:var(--nx-text-muted); padding:0 20px 10px;">${window.esc(opts.hint)}</div>` : ""}
        <div style="display:flex; justify-content:center; gap:8px; padding: 0 20px 10px;">
          <button type="button" class="nx-sheet__toggle" data-all>Select all</button>
          <button type="button" class="nx-sheet__toggle" data-none>Select none</button>
        </div>
        <div class="nx-sheet__list" id="nx-multi-list">${renderRows()}</div>
        <button type="button" class="nx-sheet__datetime-apply" data-done>${window.esc(opts.doneLabel || "Done")}</button>
        <button type="button" class="nx-sheet__cancel" data-cancel>Cancel</button>
      </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const close = (arr) => {
      document.body.style.overflow = "";
      overlay.remove();
      resolve(arr);
    };

    const listEl = overlay.querySelector("#nx-multi-list");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-cancel]")) return close(null);
      if (e.target.closest("[data-done]")) return close(Array.from(selected));
      if (e.target.closest("[data-all]")) {
        selected = new Set(allValues);
        listEl.innerHTML = renderRows();
        return;
      }
      if (e.target.closest("[data-none]")) {
        selected = new Set();
        listEl.innerHTML = renderRows();
        return;
      }
      const row = e.target.closest(".nx-sheet__row");
      if (row) {
        const opt = options[parseInt(row.dataset.idx, 10)];
        if (selected.has(opt.value)) selected.delete(opt.value);
        else selected.add(opt.value);
        listEl.innerHTML = renderRows();
      }
    });
  });
};

/**
 * Bottom-sheet with a native date-time input (dark styled).
 * @param {object} opts  { title, minDate (ISO), initial (ISO), applyLabel }
 * @returns Promise<Date|null>
 */
window.nxDateTimeSheet = function (opts) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "nx-sheet-overlay";

    // Default: now + 1 hour, rounded to next 15 min
    let initial = opts.initial ? new Date(opts.initial) : new Date(Date.now() + 60 * 60 * 1000);
    initial.setSeconds(0, 0);
    initial.setMinutes(Math.ceil(initial.getMinutes() / 15) * 15);

    // Format for <input type="datetime-local"> — YYYY-MM-DDTHH:MM in local tz
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const minAttr = opts.minDate ? iso(new Date(opts.minDate)) : iso(new Date());

    overlay.innerHTML = `
      <div class="nx-sheet" role="dialog" aria-modal="true">
        <div class="nx-sheet__grab" aria-hidden="true"></div>
        <h3 class="nx-sheet__title">${window.esc(opts.title || "Pick date & time")}</h3>
        <div class="nx-sheet__datetime">
          <input type="datetime-local" id="nx-sheet-dt" value="${iso(initial)}" min="${minAttr}">
        </div>
        <button type="button" class="nx-sheet__datetime-apply" data-apply>${window.esc(opts.applyLabel || "Set time")}</button>
        <button type="button" class="nx-sheet__cancel" data-cancel>Cancel</button>
      </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const close = (d) => {
      document.body.style.overflow = "";
      overlay.remove();
      resolve(d);
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-cancel]")) return close(null);
      if (e.target.closest("[data-apply]")) {
        const v = document.getElementById("nx-sheet-dt").value;
        if (!v) return close(null);
        close(new Date(v));
      }
    });
  });
};
