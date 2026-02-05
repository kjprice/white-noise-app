import { useState, useRef, useCallback, useEffect } from 'react';

function generateWhiteNoiseWav(durationSeconds = 10, sampleRate = 44100) {
  const numSamples = durationSeconds * sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate white noise samples
  for (let i = 0; i < numSamples; i++) {
    const sample = (Math.random() * 2 - 1) * 0.5 * 32767;
    view.setInt16(44 + i * 2, sample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Generate audio on first use
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const blob = generateWhiteNoiseWav(10);
      blobUrlRef.current = URL.createObjectURL(blob);

      audioRef.current = new Audio(blobUrlRef.current);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    return audioRef.current;
  }, []);

  const play = useCallback(async () => {
    const audio = getAudio();

    try {
      await audio.play();
      setIsPlaying(true);

      // Set up Media Session for lock screen controls
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

  // Cleanup on unmount
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

  return { isPlaying, play, stop, toggle };
}
