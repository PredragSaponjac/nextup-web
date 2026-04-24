/* =============================================================
   NextUp — App Initialization
   Native plugin setup, biometric gate, session restore, initial route.
   ============================================================= */

function _nxBootMsg(text) {
  try {
    const el = document.getElementById("nx-boot-msg");
    if (el) el.textContent = text;
  } catch (_) {}
}

(async function initApp() {
  _nxBootMsg("Starting…");

  // --------------- Native Plugin Setup (Capacitor) ---------------
  // Wrapped in try/catch so any plugin failure NEVER blocks the UI from rendering.
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    try {
      if (window.Capacitor.Plugins.StatusBar) {
        window.Capacitor.Plugins.StatusBar.setStyle({ style: "DARK" }).catch(() => {});
        window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: "#000000" }).catch(() => {});
      }
      if (window.Capacitor.Plugins.SplashScreen) {
        setTimeout(() => {
          try { window.Capacitor.Plugins.SplashScreen.hide(); } catch (_) {}
        }, 500);
      }
      if (window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener("backButton", () => {
          const hash = (window.location.hash || "").replace(/^#/, "");
          if (!hash || hash === "home" || hash === "role-select" || hash === "dashboard") {
            window.Capacitor.Plugins.App.exitApp();
          } else {
            window.history.back();
          }
        });
      }
    } catch (e) {
      console.warn("Native plugin init error:", e);
    }
  }

  // --------------- Biometric Gate (Face ID / Touch ID) ---------------
  // Must complete before routing so a protected session doesn't flash content.
  if (window.nxBiometricGateAtLaunch) {
    _nxBootMsg("Unlocking…");
    try { await window.nxBiometricGateAtLaunch(); } catch (_) {}
  }

  _nxBootMsg("Loading…");
  // --------------- Initial Route (FAST PATH — do not block on network) ---------------
  // Use cached user info (from localStorage) to pick the first screen. We refresh
  // the user record in the background after the UI is already up, so a cold-start
  // Render backend never leaves the user staring at a black screen.
  try {
    // Dual-role UX: every cold launch lands on the customer Home grid,
    // even if the last session was left on #dashboard (Capacitor WebView
    // persists the hash across cold launches). Home is the welcoming
    // entry point with all 14 categories; provider mode is one tap away
    // via Profile -> "Switch to provider mode".
    //
    // We preserve the hash ONLY for a small allowlist of routes that
    // indicate an intentional deep-link arrival (push notifications,
    // from-email magic links, etc.). For everything else we force home.
    const DEEP_LINK_ROUTES = ["responses/", "booking/", "review/", "thread/", "broadcast/"];
    const currentHash = (window.location.hash || "").replace(/^#/, "");
    const isDeepLink = DEEP_LINK_ROUTES.some(r => currentHash.startsWith(r));

    if (!window.state.token) {
      window.navigate("role-select");
    } else if (isDeepLink) {
      await window.router();
    } else {
      window.navigate("home");
    }
  } catch (e) {
    console.error("Initial route error:", e);
    // Last-resort fallback so app never locks up on a blank screen
    try { window.navigate("role-select"); } catch (_) {}
  }

  // --------------- Background Session Refresh ---------------
  // Validate the stored token / refresh user profile AFTER the UI is live.
  // If the token is invalid (401), session clears and the app redirects.
  if (window.state.token) {
    (async () => {
      try {
        const me = await window.apiMe();
        const prevProv = !!(window.state.currentUser && window.state.currentUser.has_provider_profile);
        window.persistUser(me);
        if (me.role && me.role !== window.state.role) {
          window.persistRole(me.role);
        }
        // If has_provider_profile flipped, re-render home so the mode chip updates
        const curProv = !!me.has_provider_profile;
        const hash = (window.location.hash || "").replace(/^#/, "");
        if (prevProv !== curProv && hash === "home" && window.Views.CustomerHome) {
          window.Views.CustomerHome.render();
        }
      } catch (e) {
        // apiFetch already handles 401 by clearing session + navigating to role-select.
        // Any other failure (network down, cold start timing out) we silently ignore —
        // the user can retry from the UI.
        console.warn("Background session refresh failed:", e && e.message);
      }
      try { window.nxPushRegister && window.nxPushRegister(); } catch (_) {}
      try { window.nxAutoDetectCity && window.nxAutoDetectCity(); } catch (_) {}
    })();
  }
})();
