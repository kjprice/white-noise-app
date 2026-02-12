import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Generate white noise and save as WAV file
async function generateWhiteNoiseFile(durationSeconds = 3600, sampleRate = 22050) {
  const numSamples = durationSeconds * sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const sample = (Math.random() * 2 - 1) * 0.5 * 32767;
    view.setInt16(44 + i * 2, sample, true);
  }

  // Convert to base64 for file writing
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  // Save to file system
  const fileUri = `${FileSystem.cacheDirectory}white-noise.wav`;
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
        // Generate and save 1-hour white noise file
        const fileUri = await generateWhiteNoiseFile(3600);
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
