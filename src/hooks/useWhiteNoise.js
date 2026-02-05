import { useState, useRef, useCallback, useEffect } from 'react';

// Tiny silent WAV to keep audio session alive on mobile
function createSilentWav() {
  const sampleRate = 44100;
  const duration = 1;
  const numSamples = sampleRate * duration;
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
  // Samples are all zeros (silent)

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const silentAudioRef = useRef(null);
  const silentUrlRef = useRef(null);

  // Create white noise buffer that loops seamlessly via Web Audio API
  const createWhiteNoiseBuffer = useCallback((audioContext) => {
    const sampleRate = audioContext.sampleRate;
    const duration = 2; // 2 seconds is plenty for noise
    const numSamples = sampleRate * duration;

    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }, []);

  const play = useCallback(async () => {
    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Stop existing noise
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
    }

    // Create and play white noise via Web Audio API (seamless looping!)
    const buffer = createWhiteNoiseBuffer(audioContext);
    const noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true; // Web Audio API loops seamlessly!

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;

    noiseNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    noiseNode.start();

    noiseNodeRef.current = noiseNode;
    gainNodeRef.current = gainNode;

    // Start silent audio to keep mobile audio session alive
    if (!silentAudioRef.current) {
      silentUrlRef.current = URL.createObjectURL(createSilentWav());
      silentAudioRef.current = new Audio(silentUrlRef.current);
      silentAudioRef.current.loop = true;
      silentAudioRef.current.volume = 0.01; // Nearly silent
    }

    try {
      await silentAudioRef.current.play();
    } catch (e) {
      console.log('Silent audio failed, background playback may not work');
    }

    setIsPlaying(true);

    // Media Session for lock screen controls
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
  }, [createWhiteNoiseBuffer]);

  const stop = useCallback(() => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = null;
    }
    if (silentAudioRef.current) {
      silentAudioRef.current.pause();
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
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
      }
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
      if (silentUrlRef.current) {
        URL.revokeObjectURL(silentUrlRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { isPlaying, play, stop, toggle };
}
