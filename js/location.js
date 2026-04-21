/* =============================================================
   NextUp — Location helpers
   Auto-detect city on app launch when location is already permitted,
   without pre-prompting the user. Reverse-geocodes via Nominatim
   (OpenStreetMap) — free, no API key.
   ============================================================= */

/** Check whether iOS/Android has already granted location permission.
 *  Returns "granted" | "denied" | "prompt" | "unknown" */
window.nxLocationPermission = async function () {
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    const Geo = window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation;
    if (Geo && Geo.checkPermissions) {
      try {
        const p = await Geo.checkPermissions();
        return p.location || p.coarseLocation || "unknown";
      } catch (_) { return "unknown"; }
    }
  }
  // Web fallback — permissions API (not all browsers)
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const p = await navigator.permissions.query({ name: "geolocation" });
      return p.state;  // "granted" | "denied" | "prompt"
    } catch (_) { return "unknown"; }
  }
  return "unknown";
};

/** Get current coords without triggering a new permission prompt unless
 *  permission was already granted. Returns null if not granted. */
window.nxGetCoordsIfPermitted = async function () {
  const perm = await window.nxLocationPermission();
  if (perm !== "granted") return null;

  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    const Geo = window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation;
    if (Geo) {
      try {
        const pos = await Geo.getCurrentPosition({ enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 });
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (_) { return null; }
    }
  }
  if (navigator.geolocation) {
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }
  return null;
};

/** Reverse-geocode lat/lng → short city label like "Houston, TX".
 *  Uses OpenStreetMap Nominatim — free, no key required, ~1 req/sec limit. */
window.nxReverseGeocode = async function (lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "NextUp iOS (contact: pedjap1980@gmail.com)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county || "";
    const state = a.state_code || a.state || a.region || "";
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    return null;
  } catch (_) { return null; }
};

/** Run auto-detection ONCE per app launch when needed.
 *  - Skips if the user has already set a city (manually or previously auto-detected)
 *  - Skips if location permission isn't already granted (we don't pre-prompt)
 *  - On success, updates currentUser.city + persists to localStorage
 *  - Fires a custom event so the home screen can re-render the pill */
let _nxCityAutoTried = false;
window.nxAutoDetectCity = async function (force = false) {
  if (_nxCityAutoTried && !force) return;
  _nxCityAutoTried = true;

  const u = window.state.currentUser || {};
  // If city already known AND user didn't explicitly force, skip
  if (u.city && !force) return;

  const coords = await window.nxGetCoordsIfPermitted();
  if (!coords) return;

  const city = await window.nxReverseGeocode(coords.lat, coords.lng);
  if (!city) return;

  const updated = Object.assign({}, window.state.currentUser || {}, { city });
  window.persistUser(updated);

  // Tell the home pill to refresh
  window.dispatchEvent(new CustomEvent("nx:city-updated", { detail: { city } }));
};
