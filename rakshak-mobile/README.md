# Rakshak Mobile (React Native)

This is a starter React Native (Expo) app that mirrors the web dashboard structure for Rakshak.

## Features (MVP)
- Live location detection (Expo Location)
- Live location sharing toggle
- Safety program list + detail steps
- Wake-phrase toggle for voice assistant

## Beginner setup (step-by-step)

### 1) Install required tools
You only need **Node.js** and **Expo Go** to run on your phone.

- **Node.js (LTS)**: https://nodejs.org
- **Expo Go** (mobile app):
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
  - iOS: https://apps.apple.com/app/expo-go/id982107779

> Optional (only if you want a simulator):
> - **Android Studio** (Android emulator)
> - **Xcode** (iOS simulator, macOS only)

### 2) Install dependencies
From the repo root:

```bash
cd rakshak-mobile
npm install
```

### 3) Start the app
```bash
npm run start
```

This opens the Expo dev server in your browser.

### 4) Run on your phone (easiest)
- Ensure your phone and computer are on the **same Wi‑Fi**.
- Open **Expo Go** on your phone.
- Scan the QR code shown in the Expo dev server.

### 5) Run on emulator (optional)
- **Android**: open Android Studio → start an emulator → press **a** in the Expo terminal.
- **iOS** (macOS): open Xcode → start a simulator → press **i** in the Expo terminal.

## Common issues
- **Location permission denied**: enable location access for Expo Go in your phone settings.
- **Metro bundler stuck**: stop and restart `npm run start`.
- **Network QR not loading**: make sure device + computer are on same Wi‑Fi.
- **EMFILE: too many open files (macOS)**: increase the open files limit and retry.
  - Check: `ulimit -n`
  - Temporary fix (current shell): `ulimit -n 65536`
  - Then restart: `npm run start`
- **EMFILE persists even after ulimit**:
  - Install **Watchman** (recommended by Metro): `brew install watchman`
  - Restart the dev server after installing Watchman.
  - Close extra apps/editors that might open many file watchers.
- **Node.js v22 issues**: use Node.js **LTS** (recommended) for Expo stability.

## If you still see `expo-location` version warnings
Run the Expo-managed install so versions match Expo 50:

```bash
npx expo install expo-location
```

## Scripts
```bash
npm run start   # start Expo dev server
npm run android # open Android emulator
npm run ios     # open iOS simulator
npm run web     # run in web browser
```
