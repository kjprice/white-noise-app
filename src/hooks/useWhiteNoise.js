import { useState, useRef, useCallback, useEffect } from 'react';

function generateWhiteNoiseWav(durationSeconds = 5, sampleRate = 44100) {
  const numSamples = durationSeconds * sampleRate;
  const fadeLength = Math.floor(sampleRate * 0.3); // 300ms crossfade

  // Generate extra samples beyond the end for crossfading
  const rawNoise = new Float32Array(numSamples + fadeLength);
  for (let i = 0; i < rawNoise.length; i++) {
    rawNoise[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const samples = new Float32Array(numSamples);

  // Copy main body directly (everything after the fade region)
  for (let i = fadeLength; i < numSamples; i++) {
    samples[i] = rawNoise[i];
  }

  // Crossfade the beginning with the "continuation" samples past the end
  // This makes the loop seamless because:
  // - samples[numSamples-1] = rawNoise[numSamples-1]
  // - samples[0] ≈ rawNoise[numSamples] (the natural continuation)
  for (let i = 0; i < fadeLength; i++) {
    // Cosine crossfade for smooth S-curve
    const t = (1 - Math.cos((i / fadeLength) * Math.PI)) / 2;
    // At i=0: t≈0, so we get mostly rawNoise[numSamples] (continuation)
    // At i=fadeLength: t=1, so we get rawNoise[fadeLength] (original)
    samples[i] = rawNoise[i] * t + rawNoise[numSamples + i] * (1 - t);
  }

  // Build WAV file
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
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
    view.setInt16(44 + i * 2, samples[i] * 32767, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const blob = generateWhiteNoiseWav(5);
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

  return { isPlaying, play, stop, toggle };
}
