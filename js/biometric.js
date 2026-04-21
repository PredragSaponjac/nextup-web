/* =============================================================
   NextUp — Biometric (Face ID / Touch ID) helper
   Uses @capgo/capacitor-native-biometric plugin on native.
   No-ops on web browser.
   ============================================================= */

/** Returns true if biometrics are available on this device (and app runs native). */
window.nxBiometricAvailable = async function () {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
    return false;
  }
  const Bio = window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric;
  if (!Bio) return false;
  try {
    const res = await Bio.isAvailable();
    return !!(res && res.isAvailable);
  } catch (_) { return false; }
};

/** Prompt for Face ID / Touch ID. Returns true on success, false on cancel/failure. */
window.nxBiometricAuthenticate = async function (reason) {
  if (!(await window.nxBiometricAvailable())) return true; // no biometric, allow through
  const Bio = window.Capacitor.Plugins.NativeBiometric;
  try {
    await Bio.verifyIdentity({
      reason: reason || "Unlock NextUp",
      title: "NextUp",
      subtitle: "Use Face ID to unlock",
      description: "Quickly and securely sign in to NextUp",
    });
    return true;
  } catch (e) {
    return false;
  }
};

/** After a successful login: if biometric is available and user hasn't decided, ask if they want to enable it. */
window.maybeOfferBiometricAfterLogin = async function () {
  if (!(await window.nxBiometricAvailable())) return;
  if (window.state.biometricEnabled) return;       // already on
  if (window._store.getItem("nextup_biometric_offered") === "1") return; // already asked & declined
  window._store.setItem("nextup_biometric_offered", "1");

  const enable = confirm(
    "Use Face ID for NextUp?\n\n" +
    "Sign in faster next time with Face ID instead of typing your password. " +
    "You can change this later in Profile."
  );
  if (enable) {
    window.setBiometricEnabled(true);
  }
};

/** Called at app init BEFORE routing. If biometric is enabled and user has a stored token,
 *  require Face ID unlock. If it fails, sign the user out so they have to re-enter password. */
window.nxBiometricGateAtLaunch = async function () {
  if (!window.state.token) return;           // not logged in → nothing to gate
  if (!window.state.biometricEnabled) return; // opt-in; not on
  if (window.state.biometricUnlocked) return; // already unlocked this session
  if (!(await window.nxBiometricAvailable())) return; // plugin or hardware unavailable

  const ok = await window.nxBiometricAuthenticate("Unlock NextUp");
  if (ok) {
    window.state.biometricUnlocked = true;
  } else {
    // User cancelled or failed → force them back to sign-in (don't nuke, just require re-auth)
    window.clearSession();
  }
};
