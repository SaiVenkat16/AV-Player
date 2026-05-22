# AV Player

Offline-first **audio and video** player for React Native: local library scanning, playback with **react-native-track-player** and **react-native-video**, gesture-heavy UIs, mini player, equalizer UI (with **Android** system EQ via a small native module), Bluetooth helpers, and a dark “aura” themed interface.

Built with the [React Native CLI](https://github.com/react-native-community/cli), **TypeScript (strict)**, and **React Native 0.85**.

## Requirements

- **Node.js** ≥ 22.11 (see `package.json` `engines`)
- **npm** (or Yarn / pnpm if you align lockfiles and scripts)
- **Android**: Android Studio, SDK, and an emulator or device (`ANDROID_HOME` set, or `android/local.properties` with `sdk.dir=...`)
- **iOS** (macOS): Xcode, CocoaPods (this repo includes a `Gemfile` for Bundler-managed CocoaPods)

## Install

From the project root:

```sh
npm install
```

The repo includes `.npmrc` with `legacy-peer-deps=true` to satisfy a few libraries whose peer ranges do not yet list React 19.

## Run the app

Start Metro:

```sh
npm start
```

In another terminal:

```sh
npm run android
# or
npm run ios
```

### iOS pods

On first clone or after native dependency changes:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

Then `npm run ios` (or open the workspace in Xcode).

## Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Metro bundler |
| `npm run android` | Build and run Android |
| `npm run ios` | Build and run iOS |
| `npm test` | Jest |
| `npm run lint` | ESLint |

Typecheck (no emit):

```sh
npx tsc --noEmit
```

## Features (high level)

- **Library**: scan storage for audio/video, metadata and artwork (via **jsmediatags** and **react-native-fs**; video thumbnails via **react-native-create-thumbnail**)
- **Music**: queues and playback through **react-native-track-player**, Now Playing, albums/artists, search, playlists, stats-oriented screen
- **Video**: dedicated stack, gestures and HUD-style controls, **react-native-video**
- **UI**: **Reanimated** v3, **FlashList**, blur / gradients, tab navigation with floating-style chrome, mini player
- **EQ**: presets and sliders in-app; on **Android**, optional binding to system **Equalizer** / **BassBoost** / **Virtualizer** through `MainAudioFx` (see `android/…` and `src/native/MainAudioFx.ts`). **iOS** uses the same UI and persistence without that native audio-effects bridge
- **Bluetooth**: discovery / device UX layer on **react-native-bluetooth-classic** (platform capabilities still apply)
- **Permissions**: onboarding gate before library scan (storage / media, etc., via **react-native-permissions**)

## Project layout

```
src/
  components/     # Player, video, library rows, EQ sheet, Bluetooth, common UI
  hooks/          # usePlayer, useLibrary, useEqualizer, useBluetooth, useGestures
  navigation/     # Root, tabs, music/video stacks
  screens/        # Permission, music, video, shared (settings, search, …)
  services/       # Scanner, metadata, playback service, audio/EQ/Bluetooth helpers
  store/          # Zustand stores (player, library, EQ, settings)
  theme/          # Colors, typography, spacing
  types/          # Shared TS types and ambient declarations
  utils/          # Time formatting, BPM helper, color extraction, constants
  native/         # JS bridge types for Android MainAudioFx
```

Entry: **`index.js`** registers `react-native-gesture-handler` first, registers **TrackPlayer**’s playback service, then **`App.tsx`**.

## Configuration notes

- **`tsconfig.json`** extends `./node_modules/@react-native/typescript-config/tsconfig.json` so both **tsc** and the editor resolve the base config reliably.
- **Android**: ensure the SDK path is configured so Gradle can run (`local.properties` or `ANDROID_HOME`).
- **Vector icons**: Android applies `react-native-vector-icons` fonts in `android/app/build.gradle`.

## Troubleshooting

- [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment)
- [React Native troubleshooting](https://reactnative.dev/docs/troubleshooting)
- Metro cache: `npx react-native start --reset-cache`

## Learn more

- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player)
- [react-native-video](https://github.com/TheWidlarzGroup/react-native-video)
