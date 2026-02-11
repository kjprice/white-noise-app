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

## Technical Notes: The Audio Loop Gap Problem

### The Problem

When looping audio in a web browser using the HTML5 `<audio>` element's `loop` attribute, there's always a noticeable gap (typically 0.5-1 second) when the audio jumps from the end back to the beginning. This is a fundamental browser limitation, not a coding error.

### Why It Exists

1. **Browser Implementation**: The HTML5 audio element wasn't designed for gapless looping. When `loop=true`, the browser:
   - Detects the end of the audio file
   - Seeks back to the beginning
   - Restarts playback
   - This process takes time, causing an audible gap

2. **Background Playback Constraints**: Mobile browsers (especially iOS Safari) only allow background audio through specific APIs:
   - `<audio>` or `<video>` elements work in background
   - Web Audio API gets suspended when screen locks
   - This creates a conflict: the API that loops seamlessly doesn't work in background

### Solutions We Tried (Web App)

| Approach | Result | Why It Failed |
|----------|--------|---------------|
| **Web Audio API with seamless loop** | Perfect loop, but stops when screen locks | AudioContext gets suspended on mobile when app backgrounds |
| **MediaStreamDestination + Audio Element** | Jittery audio | AudioContext suspension causes stuttering as it repeatedly suspends/resumes |
| **Crossfade techniques** | Still had gaps | The gap is in the browser's loop implementation, not the audio content |
| **1-hour audio buffer** | ✅ Works (current solution) | Gap only occurs every hour, which is acceptable for a sleep app |

### How Native App Solves This

The React Native app uses **expo-av** with native audio APIs:
- Native audio players (AVAudioPlayer on iOS, MediaPlayer on Android) handle looping at the OS level
- Much smaller buffers needed (10 seconds vs 10 minutes)
- True gapless looping
- Better background audio support

### Current Implementation

**Web:** Generates a 1-hour white noise buffer. The loop gap occurs every hour, which is barely noticeable for a sleep app.

**Native:** Generates a 10-second buffer with true gapless looping via native audio APIs.

### Alternative Solutions (Not Implemented)

If you want truly gapless looping on the web:

1. **Use a dedicated library**:
   - [Howler.js](https://howlerjs.com/) - Handles many edge cases but still has background playback limitations
   - [Gapless-5](https://github.com/regosen/Gapless-5) - Uses multiple audio elements with crossfading

2. **Double-buffering with JavaScript**:
   - Load two `<audio>` elements
   - Crossfade between them before the end
   - Requires JS to keep running (may not work when screen is off)

3. **Build a PWA with Audio Worklets**:
   - Use Service Workers + Audio Worklets
   - More complex setup
   - Better control but still browser-dependent

### References

- [Mozilla Bug: Looping audio files should be seamless](https://bugzilla.mozilla.org/show_bug.cgi?id=654787)
- [Building an Audio-loop Player on the Web](https://jackyef.com/posts/building-an-audio-loop-player-on-the-web)
- [Gapless-5 Documentation](https://github.com/regosen/Gapless-5)

## Requirements

- Node.js 18+
- iOS: Xcode 15+ (for development builds)
- Android: Android Studio (for development builds)
