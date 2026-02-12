import { useState, useRef, useCallback, useEffect } from 'react';

// Generate seamlessly loopable white noise using crossfade technique
function generateSeamlessWhiteNoise(durationSeconds = 60, sampleRate = 22050) {
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

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      setIsLoading(true);
      // Generate 60-second seamlessly loopable white noise
      // Crossfade technique eliminates the gap at loop point
      const blob = generateSeamlessWhiteNoise(60);
      blobUrlRef.current = URL.createObjectURL(blob);

      audioRef.current = new Audio(blobUrlRef.current);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      setIsLoading(false);
    }
    return audioRef.current;
  }, []);

  const play = useCallback(async () => {
    const audio = getAudio();

    try {
      await audio.play();
      setIsPlaying(true);

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'White Noise',
          artist: 'White Noise App',
          album: 'Sleep Sounds',
        });
        navigator.mediaSession.setActionHandler('play', () => play());
        navigator.mediaSession.setActionHandler('pause', () => stop());
        navigator.mediaSession.setActionHandler('stop', () => stop());
      }
    } catch (e) {
      console.error('Playback failed:', e);
    }
  }, [getAudio]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return { isPlaying, isLoading, play, stop, toggle };
}
