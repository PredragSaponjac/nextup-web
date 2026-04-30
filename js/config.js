/* =============================================================
   NextUp App — Global Configuration
   Edit this file before `npx cap sync` when deploying.
   ============================================================= */

// API backend URL.
// Production: deployed on Render.com.
// Local dev: http://localhost:8000 (runs alongside `npx serve www` on same machine).
window.NEXTUP_CONFIG = {
  // Backend API base URL — production deploy on Render
  API_URL: (() => {
    // On a native device (iPhone/Android), always use production URL
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      return "https://nextup-api-39l9.onrender.com";
    }
    // In a browser — if hostname is localhost, use local dev backend; otherwise use prod.
    if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      return "http://localhost:8000";
    }
    return "https://nextup-api-39l9.onrender.com";
  })(),

  // Stripe publishable key (from Stripe.txt — test mode). Live key goes here before launch.
  STRIPE_PUBLISHABLE_KEY: "", // filled at Stage 8 billing integration

  // Smart Radius: search distance by request urgency (miles)
  RADIUS_BY_TIMEFRAME: {
    within_1h: 5,
    within_2h: 10,
    today: 25,
    tomorrow: 50,
  },

  // Response polling interval (ms) while a request is open
  RESPONSE_POLL_MS: 15000,

  // Multi-market currency display
  MARKETS: {
    US: { currency: "USD", symbol: "$", monthly: 19, yearly: 199 },
    GB: { currency: "GBP", symbol: "£", monthly: 15, yearly: 159 },
    CA: { currency: "CAD", symbol: "$", monthly: 25, yearly: 259 },
    AU: { currency: "AUD", symbol: "$", monthly: 29, yearly: 299 },
  },

  // App version
  VERSION: "1.3.18",
};
