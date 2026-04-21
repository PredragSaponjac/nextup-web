# NextUp — Web App

Browser-based build of the NextUp on-demand services app. Same code as the iOS & Android apps (Capacitor wraps the same `www/` folder for native builds).

**Live at:** https://predragsaponjac.github.io/nextup-web/

## What works in the browser
- Full customer flow: browse categories, search providers, broadcast requests, accept responses, leave reviews
- Full provider flow: go online, see incoming, respond, dashboard
- Dual-role mode switching
- Login / register / **forgot password**
- Auto-detect city via Nominatim
- Native geolocation (via browser Permissions API)
- All the service taxonomy, dark theme, and UI

## What only works in the installed apps (native-only APIs)
- Face ID / fingerprint unlock (no browser biometric API yet)
- APNs / FCM push notifications (browser has Web Push but we haven't wired it)

## Source
This repo is a mirror of [nextup-app/www/](https://github.com/PredragSaponjac/nextup-app) — the canonical source. Changes are made in `nextup-app` and synced here for GitHub Pages.
