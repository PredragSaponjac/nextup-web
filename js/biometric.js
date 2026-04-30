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

/** After a successful login: if biometric is available and user hasn't
 *  decided, ask if they want to enable it. Returns true if the user
 *  enabled it (caller can then save credentials to Keychain), false
 *  otherwise. v1.3.22: previously returned undefined; the new
 *  Sign-in-with-Face-ID flow needs the answer to chain credential
 *  storage. */
window.maybeOfferBiometricAfterLogin = async function () {
  if (!(await window.nxBiometricAvailable())) return false;
  if (window.state.biometricEnabled) return true;  // already on — save updated creds
  if (window._store.getItem("nextup_biometric_offered") === "1") return false; // declined previously
  window._store.setItem("nextup_biometric_offered", "1");

  const enable = await window.nxConfirm(
    "Use Face ID for NextUp?\n\n" +
    "Sign in faster next time with Face ID — no need to type your password. " +
    "You can change this later in Profile.",
    { okLabel: "Enable", cancelLabel: "Not now" }
  );
  if (enable) {
    window.setBiometricEnabled(true);
    return true;
  }
  return false;
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

// ============================================================
// v1.3.22 — "Sign in with Face ID" via iOS Keychain credential store
// ============================================================
//
// Two distinct biometric features:
//   1. nxBiometricGateAtLaunch (above) — locks an ALREADY-signed-in
//      session behind Face ID on cold launch. Token already in
//      memory. This is "unlock the app."
//   2. The functions below — store the auth token in iOS Keychain
//      (encrypted, Secure-Enclave protected, requires Face ID to
//      retrieve) so the user can sign in WITHOUT TYPING PASSWORD
//      after they've signed out. This is "sign in with Face ID."
//
// These two features are independent. A user can have either, both,
// or neither enabled.
//
// Storage:
//   - The actual credentials live in Keychain (server="com.nextupservices.app")
//   - A boolean "we have creds saved" flag lives in localStorage so
//     the login screen knows whether to show the Face ID button
//     WITHOUT triggering a Face ID prompt just to check.

const NX_BIO_CREDS_FLAG = "nextup_face_id_creds";
const NX_BIO_CREDS_SERVER = "com.nextupservices.app";

/** After a successful password login, store {email, token} in
 *  Keychain so future sign-ins can skip the password. Returns true
 *  on success, false if biometric isn't available or save fails. */
window.nxBiometricSaveCredentials = async function (email, token) {
  if (!(await window.nxBiometricAvailable())) return false;
  if (!email || !token) return false;
  const Bio = window.Capacitor.Plugins.NativeBiometric;
  try {
    await Bio.setCredentials({
      username: email,
      password: token,
      server: NX_BIO_CREDS_SERVER,
    });
    if (window._store) window._store.setItem(NX_BIO_CREDS_FLAG, "1");
    return true;
  } catch (e) {
    return false;
  }
};

/** Light synchronous check: do we have Face ID creds saved? Used by
 *  the Login screen to decide whether to render the "Sign in with
 *  Face ID" button. Does NOT trigger the Face ID prompt — that only
 *  happens when the user taps the button. */
window.nxBiometricHasSavedCredentials = function () {
  if (!window._store) return false;
  return window._store.getItem(NX_BIO_CREDS_FLAG) === "1";
};

/** Trigger Face ID, then retrieve {username, password} from Keychain.
 *  Returns null on cancel, biometric failure, or missing creds. */
window.nxBiometricLoadCredentials = async function () {
  if (!(await window.nxBiometricAvailable())) return null;
  const Bio = window.Capacitor.Plugins.NativeBiometric;
  try {
    // Verify Face ID first. The setCredentials call doesn't auto-gate
    // getCredentials on iOS — we have to verifyIdentity ourselves.
    await Bio.verifyIdentity({
      reason: "Sign in to NextUp",
      title: "NextUp",
      subtitle: "Use Face ID to sign in",
      description: "Quickly and securely sign in to NextUp",
    });
    const creds = await Bio.getCredentials({ server: NX_BIO_CREDS_SERVER });
    if (!creds || !creds.username || !creds.password) return null;
    return { email: creds.username, token: creds.password };
  } catch (e) {
    return null;
  }
};

/** Wipe Keychain creds + the flag. Called when user explicitly
 *  wants to "forget Face ID" or when a stored token comes back as
 *  expired (HTTP 401) — no point keeping a dead credential. */
window.nxBiometricDeleteCredentials = async function () {
  if (window._store) window._store.removeItem(NX_BIO_CREDS_FLAG);
  if (!(await window.nxBiometricAvailable())) return false;
  const Bio = window.Capacitor.Plugins.NativeBiometric;
  try {
    await Bio.deleteCredentials({ server: NX_BIO_CREDS_SERVER });
    return true;
  } catch (e) {
    return false;
  }
};
