/* =============================================================
   NextUp — Push Notifications (APNs via Capacitor)
   Registers device token with backend so providers can be
   notified of incoming broadcasts even when app is closed/locked.
   ============================================================= */

/** Request permission + register the device token with the backend.
 *  No-ops on web / simulator without push capability. */
window.nxPushRegister = async function () {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
    return;
  }
  const Push = window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications;
  if (!Push) return;

  try {
    // Request permission (iOS shows dialog first time)
    const perm = await Push.requestPermissions();
    if (perm.receive !== "granted") {
      return;
    }

    // Remove any previous listeners (helps with hot-reload / multiple logins)
    try { await Push.removeAllListeners(); } catch (_) {}

    // Listen for the device token
    Push.addListener("registration", async (token) => {
      try {
        await window.apiFetch("/api/devices", {
          method: "POST",
          body: { platform: "ios", token: token.value },
        });
      } catch (e) {
        console.warn("nxPush: register with backend failed", e);
      }
    });

    Push.addListener("registrationError", (err) => {
      console.warn("nxPush: APNs registration error", err);
    });

    // Tapping a push while app is in background/terminated
    Push.addListener("pushNotificationActionPerformed", (action) => {
      const data = action.notification && action.notification.data && action.notification.data.nextup;
      if (data && data.type === "new_request" && data.request_id) {
        // Deep-link the provider to the respond screen
        try { sessionStorage.setItem("nx_respond_request_id", String(data.request_id)); } catch (_) {}
        window.navigate && window.navigate("respond/" + data.request_id);
      }
    });

    // Actually kick off registration with APNs (will trigger the "registration" event above)
    await Push.register();
  } catch (e) {
    console.warn("nxPush setup failed:", e);
  }
};
