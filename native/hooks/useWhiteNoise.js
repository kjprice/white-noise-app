import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

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

  // Aggressive overlap-add for near-seamless looping
  // Use very long crossfade with ultra-smooth curve
  const overlapSamples = Math.floor(sampleRate * 5.0); // 5 second overlap (50% of duration)
  const overlapBuffer = new Int16Array(overlapSamples);

  // Copy first 5 seconds to buffer
  for (let i = 0; i < overlapSamples; i++) {
    overlapBuffer[i] = samples[i];
  }

  // Ultra-smooth crossfade using cubic hermite interpolation
  for (let i = 0; i < overlapSamples; i++) {
    const t = i / overlapSamples; // 0 to 1
    const endIndex = numSamples - overlapSamples + i;

    // Smootherstep interpolation: 6t⁵ - 15t⁴ + 10t³ (ultra-smooth S-curve)
    const smoother = t * t * t * (t * (t * 6 - 15) + 10);

    const fadeIn = smoother;
    const fadeOut = 1 - smoother;

    // Crossfade with maximum smoothness
    samples[endIndex] = Math.floor(
      samples[endIndex] * fadeOut + overlapBuffer[i] * fadeIn
    );
  }

  // Write samples to buffer
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  // Simple base64 encoding for React Native
  const bytes = new Uint8Array(buffer);
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 63;

    base64 += base64Chars[enc1] + base64Chars[enc2];
    base64 += (i + 1 < bytes.length) ? base64Chars[enc3] : '=';
    base64 += (i + 2 < bytes.length) ? base64Chars[enc4] : '=';
  }

  // Save to file system with timestamp to avoid cached corrupted files
  const timestamp = Date.now();
  const fileUri = `${FileSystem.cacheDirectory}white-noise-${timestamp}.wav`;

  console.log('Writing file to:', fileUri);
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: 'base64',
  });
  console.log('File written successfully');

  return fileUri;
}

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sound1Ref = useRef(null);
  const sound2Ref = useRef(null);
  const activeSound = useRef(1); // Track which sound is currently playing
  const isGenerating = useRef(false); // Prevent concurrent generation

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
      if (sound1Ref.current) {
        sound1Ref.current.unloadAsync();
      }
      if (sound2Ref.current) {
        sound2Ref.current.unloadAsync();
      }
    };
  }, []);

  // Helper function to generate and load a fresh sound
  const generateAndLoadSound = useCallback(async () => {
    const fileUri = await generateWhiteNoiseFile(10);
    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { volume: 0.5, shouldPlay: false }
    );
    return sound;
  }, []);

  // Crossfade between two sounds with overlapping playback
  const crossfadeSounds = useCallback(async (fadeOutSound, fadeInSound, duration = 500) => {
    const steps = 50; // Number of volume steps
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps; // 0 to 1
      const volumeOut = 0.5 * (1 - progress); // Fade out: 0.5 to 0
      const volumeIn = 0.5 * progress; // Fade in: 0 to 0.5

      await Promise.all([
        fadeOutSound.setVolumeAsync(volumeOut),
        fadeInSound.setVolumeAsync(volumeIn),
      ]);

      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }, []);

  // Set up procedural generation with overlapping crossfade
  const setupProceduralGeneration = useCallback((sound1, sound2) => {
    const durationMillis = 10000; // 10 seconds
    const crossfadeStart = durationMillis - 1000; // Start crossfade 1 second before end

    sound1.setOnPlaybackStatusUpdate(async (status) => {
      if (status.isLoaded && status.isPlaying && status.positionMillis >= crossfadeStart && activeSound.current === 1 && !isGenerating.current) {
        console.log('Starting crossfade to sound2...');
        isGenerating.current = true;

        try {
          // Unload old sound2 and generate fresh audio
          await sound2.unloadAsync();
          const newSound2 = await generateAndLoadSound();
          sound2Ref.current = newSound2;

          // Set up the callback for the new sound
          setupProceduralGeneration(sound1, newSound2);

          // Start sound2 at 0 volume
          await newSound2.setVolumeAsync(0);
          await newSound2.playAsync();

          // Crossfade: sound1 fades out, sound2 fades in (both playing!)
          await crossfadeSounds(sound1, newSound2, 1000);

          activeSound.current = 2;

          // Now stop and reset sound1
          await sound1.pauseAsync();
          await sound1.setPositionAsync(0);
          await sound1.setVolumeAsync(0.5); // Reset volume for next cycle
        } catch (error) {
          console.error('Failed to crossfade to sound2:', error);
        }

        isGenerating.current = false;
      }
    });

    sound2.setOnPlaybackStatusUpdate(async (status) => {
      if (status.isLoaded && status.isPlaying && status.positionMillis >= crossfadeStart && activeSound.current === 2 && !isGenerating.current) {
        console.log('Starting crossfade to sound1...');
        isGenerating.current = true;

        try {
          // Unload old sound1 and generate fresh audio
          await sound1.unloadAsync();
          const newSound1 = await generateAndLoadSound();
          sound1Ref.current = newSound1;

          // Set up the callback for the new sound
          setupProceduralGeneration(newSound1, sound2);

          // Start sound1 at 0 volume
          await newSound1.setVolumeAsync(0);
          await newSound1.playAsync();

          // Crossfade: sound2 fades out, sound1 fades in (both playing!)
          await crossfadeSounds(sound2, newSound1, 1000);

          activeSound.current = 1;

          // Now stop and reset sound2
          await sound2.pauseAsync();
          await sound2.setPositionAsync(0);
          await sound2.setVolumeAsync(0.5); // Reset volume for next cycle
        } catch (error) {
          console.error('Failed to crossfade to sound1:', error);
        }

        isGenerating.current = false;
      }
    });
  }, [generateAndLoadSound, crossfadeSounds]);

  const play = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!sound1Ref.current) {
        console.log('Starting procedural audio generation...');

        // Generate initial two audio chunks
        const sound1 = await generateAndLoadSound();
        const sound2 = await generateAndLoadSound();

        sound1Ref.current = sound1;
        sound2Ref.current = sound2;

        // Set up continuous procedural generation
        setupProceduralGeneration(sound1, sound2);

        console.log('Starting playback...');
        await sound1.playAsync();
        activeSound.current = 1;
      } else {
        // Resume playback
        if (activeSound.current === 1) {
          await sound1Ref.current.playAsync();
        } else {
          await sound2Ref.current.playAsync();
        }
      }

      setIsPlaying(true);
    } catch (error) {
      console.error('Playback failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [generateAndLoadSound, setupProceduralGeneration]);

  const stop = useCallback(async () => {
    if (sound1Ref.current) {
      await sound1Ref.current.pauseAsync();
    }
    if (sound2Ref.current) {
      await sound2Ref.current.pauseAsync();
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
