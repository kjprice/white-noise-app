import { useState, useRef, useCallback, useEffect } from 'react';

export function useWhiteNoise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      // Load pre-generated 8-hour white noise file
      // Gap only occurs every 8 hours, which won't happen during a typical sleep session
      audioRef.current = new Audio('/white-noise-8h.wav');
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
    };
  }, []);

  return { isPlaying, isLoading, play, stop, toggle };
}
