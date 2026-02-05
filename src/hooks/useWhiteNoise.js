import { useState, useRef, useCallback, useEffect } from 'react';

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioElementRef = useRef(null);
  const mediaStreamDestRef = useRef(null);

  const createWhiteNoise = useCallback((audioContext) => {
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    return whiteNoise;
  }, []);

  const play = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
    }

    const noiseNode = createWhiteNoise(audioContext);
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;

    noiseNode.connect(gainNode);

    // Create MediaStream destination for background playback on mobile
    // This pipes audio to an <audio> element which browsers allow in background
    if (!mediaStreamDestRef.current) {
      mediaStreamDestRef.current = audioContext.createMediaStreamDestination();
    }

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.srcObject = mediaStreamDestRef.current.stream;
      audioElementRef.current.loop = true;
    }

    // Connect to both destinations
    gainNode.connect(audioContext.destination);
    gainNode.connect(mediaStreamDestRef.current);

    noiseNode.start();

    // Play through audio element for background support
    try {
      await audioElementRef.current.play();
    } catch (e) {
      console.log('Audio element play failed, falling back to Web Audio only');
    }

    noiseNodeRef.current = noiseNode;
    gainNodeRef.current = gainNode;
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
  }, [createWhiteNoise]);

  const stop = useCallback(() => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
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
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.srcObject = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { isPlaying, play, stop, toggle };
}
