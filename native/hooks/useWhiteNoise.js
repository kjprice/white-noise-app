import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Generate seamlessly loopable white noise and save as WAV file
// Uses crossfade technique to eliminate discontinuities at loop point
async function generateWhiteNoiseFile(durationSeconds = 60, sampleRate = 22050) {
  const numSamples = durationSeconds * sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate white noise samples
  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    samples[i] = Math.floor((Math.random() * 2 - 1) * 0.5 * 32767);
  }

  // Crossfade the loop point: last 50ms with first 50ms
  // This creates a seamless transition when looping
  const crossfadeSamples = Math.floor(sampleRate * 0.05); // 50ms

  for (let i = 0; i < crossfadeSamples; i++) {
    const fadePosition = i / crossfadeSamples; // 0 to 1
    const fadeOut = 1 - fadePosition;
    const fadeIn = fadePosition;

    const startIndex = i;
    const endIndex = numSamples - crossfadeSamples + i;

    // Blend the end samples with the beginning samples
    const blended = samples[startIndex] * fadeIn + samples[endIndex] * fadeOut;
    samples[endIndex] = Math.floor(blended);
  }

  // Write samples to buffer
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  // Convert to base64 for file writing
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  // Save to file system
  const fileUri = `${FileSystem.cacheDirectory}white-noise-seamless.wav`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef(null);

  // Configure audio mode for background playback
  useEffect(() => {
    async function setupAudio() {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    }
    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const play = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!soundRef.current) {
        // Generate seamlessly loopable white noise (60 seconds)
        // Crossfade technique eliminates the gap at loop point
        const fileUri = await generateWhiteNoiseFile(60);
        const { sound } = await Audio.Sound.createAsync(
          { uri: fileUri },
          {
            isLooping: true,
            volume: 0.5,
            shouldPlay: true,
          }
        );
        soundRef.current = sound;
      } else {
        await soundRef.current.playAsync();
      }

      setIsPlaying(true);
    } catch (error) {
      console.error('Playback failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      await soundRef.current.setPositionAsync(0);
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      await stop();
    } else {
      await play();
    }
  }, [isPlaying, play, stop]);

  return { isPlaying, isLoading, play, stop, toggle };
}
