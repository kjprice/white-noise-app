# White Noise App

A simple white noise app for sleep. Available as a web app and native mobile app.

## Web App

**Live:** https://kjprice.github.io/white-noise-app

```bash
cd web
npm install
./bin/dev.sh      # Run locally
./bin/deploy.sh   # Deploy to GitHub Pages
```

## Native App (iOS & Android)

Built with Expo. Supports background audio playback.

```bash
cd native
npm install
npx expo start    # Start dev server

# Then press:
# i - open iOS simulator
# a - open Android emulator
# Scan QR with Expo Go app on your phone
```

### Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android
```

## Features

- Programmatic white noise generation (no audio files)
- Background playback (keeps playing when screen locks)
- Dark theme optimized for sleep
