# White Noise App

A simple white noise app for sleep. Available as a web app and native mobile app (iOS & Android).

## Project Structure

```
white-noise-app/
├── web/          # React web app (GitHub Pages)
└── native/       # Expo React Native app (iOS & Android)
```

## Web App

**Live:** https://kjprice.github.io/white-noise-app

| Script | Description |
|--------|-------------|
| `./bin/dev.sh` | Start local dev server |
| `./bin/deploy.sh` | Build and deploy to GitHub Pages |

```bash
cd web
npm install
./bin/dev.sh
```

## Native App (iOS & Android)

Built with Expo. Supports true background audio playback.

### Quick Start (Expo Go)

```bash
cd native
npm install
./bin/dev.sh
```

Then scan the QR code with **Expo Go** app on your phone.

### Development Build (Full Background Audio Support)

Expo Go has limitations with background audio. For full support, use a development build:

```bash
cd native
npm install
./bin/prebuild.sh   # Generate native projects
./bin/ios.sh        # Run on iOS simulator
./bin/android.sh    # Run on Android emulator
```

### Scripts

| Script | Description |
|--------|-------------|
| `./bin/dev.sh` | Start Expo dev server |
| `./bin/prebuild.sh` | Generate ios/ and android/ folders |
| `./bin/ios.sh` | Build and run on iOS simulator |
| `./bin/android.sh` | Build and run on Android emulator |
| `./bin/build-ios.sh` | Build iOS app with EAS |
| `./bin/build-android.sh` | Build Android app with EAS |

### Running on Physical Device

**iOS:**
```bash
./bin/ios.sh --device
```

**Android:**
```bash
./bin/android.sh --device
```

### Production Builds (EAS)

First, install EAS CLI and login:
```bash
npm install -g eas-cli
eas login
```

Then build:
```bash
./bin/build-ios.sh      # Build for iOS
./bin/build-android.sh  # Build for Android
```

## Features

- Programmatic white noise generation (no audio files needed)
- Background playback (keeps playing when screen locks)
- Works on iOS and Android
- Dark theme optimized for sleep

## Requirements

- Node.js 18+
- iOS: Xcode 15+ (for development builds)
- Android: Android Studio (for development builds)
