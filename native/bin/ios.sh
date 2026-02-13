#!/bin/bash
# Run iOS app in different modes
#
# Usage:
#   ./bin/ios.sh          # Start dev server with QR code (scan with Expo Go app)
#   ./bin/ios.sh -s       # Run on iOS Simulator
#   ./bin/ios.sh -d       # Build and run on connected physical device

cd "$(dirname "$0")/.."

# Parse flags
if [[ "$1" == "-s" || "$1" == "--simulator" ]]; then
  npx expo run:ios
elif [[ "$1" == "-d" || "$1" == "--device" ]]; then
  npx expo run:ios --device
else
  npx expo start
fi
