# White Noise App - Development Guide

## Focus: Native App Only

**IMPORTANT:** Only edit and work on the `native/` directory. The web app has fundamental limitations with gapless audio looping that cannot be resolved in browsers.

### Why Native Only?

The web app suffers from an unavoidable audio gap when looping:
- HTML5 `<audio>` element has a 0.5-1 second gap when looping
- Web Audio API gets suspended on mobile when the screen locks
- No reliable solution exists for truly gapless background audio in web browsers

The native app (React Native + Expo) solves this by using native audio APIs that provide true gapless looping.

## Project Structure

```
white-noise-app/
├── native/       # ✅ WORK HERE - Native iOS & Android app
└── web/          # ❌ DO NOT EDIT - Known limitations, not maintained
```

## Development Commands (Native App)

```bash
cd native

# Development
./bin/dev.sh              # Start Expo dev server
./bin/prebuild.sh         # Generate native projects
./bin/ios.sh              # Run on iOS simulator
./bin/ios.sh --device     # Run on physical iOS device
./bin/android.sh          # Run on Android emulator
./bin/android.sh --device # Run on physical Android device

# Production builds
./bin/build-ios.sh        # Build iOS with EAS
./bin/build-android.sh    # Build Android with EAS
```

## Tech Stack (Native)

- **Framework:** React Native (Expo)
- **Audio:** expo-av (native audio player)
- **Features:**
  - Gapless looping
  - Background playback
  - Lock screen controls
  - Procedural noise generation

## Current Features

- White noise generation

## Planned Features

- Multiple noise colors (pink, brown, blue)
- Volume control
- Timer/sleep timer
- Mix multiple sounds

## Code Patterns

- Use TypeScript for new files
- Audio generation happens in JavaScript (shared logic)
- Keep audio buffer generation pure (deterministic)
- Use Expo APIs for native features
