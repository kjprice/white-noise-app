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
  const audio1Ref = useRef(null);
  const audio2Ref = useRef(null);
  const blobUrl1Ref = useRef(null);
  const blobUrl2Ref = useRef(null);
  const activeAudio = useRef(1);
  const isGenerating = useRef(false);

  const generateAndCreateAudio = useCallback(() => {
    const blob = generateSeamlessWhiteNoise(10);
    const blobUrl = URL.createObjectURL(blob);
    const audio = new Audio(blobUrl);
    audio.volume = 0.5;
    return { audio, blobUrl };
  }, []);

  const crossfadeAudios = useCallback(async (fadeOutAudio, fadeInAudio, duration = 1000) => {
    const steps = 50;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      fadeOutAudio.volume = 0.5 * (1 - progress);
      fadeInAudio.volume = 0.5 * progress;

      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }, []);

  const setupCrossfade = useCallback((audio1, audio2) => {
    const duration = 10; // 10 seconds
    const crossfadeStart = duration - 1; // Start crossfade 1 second before end

    const checkAudio1 = () => {
      if (audio1.currentTime >= crossfadeStart && activeAudio.current === 1 && !isGenerating.current) {
        isGenerating.current = true;
        console.log('Starting crossfade to audio2...');

        // Generate fresh audio2
        if (blobUrl2Ref.current) {
          URL.revokeObjectURL(blobUrl2Ref.current);
        }

        const { audio: newAudio2, blobUrl: newBlobUrl2 } = generateAndCreateAudio();
        audio2Ref.current = newAudio2;
        blobUrl2Ref.current = newBlobUrl2;

        // Set up crossfade for new audio
        setupCrossfade(audio1, newAudio2);

        // Start audio2 at 0 volume and play
        newAudio2.volume = 0;
        newAudio2.play();

        // Crossfade
        crossfadeAudios(audio1, newAudio2, 1000).then(() => {
          activeAudio.current = 2;
          audio1.pause();
          audio1.currentTime = 0;
          audio1.volume = 0.5;
          isGenerating.current = false;
        });
      }
    };

    const checkAudio2 = () => {
      if (audio2.currentTime >= crossfadeStart && activeAudio.current === 2 && !isGenerating.current) {
        isGenerating.current = true;
        console.log('Starting crossfade to audio1...');

        // Generate fresh audio1
        if (blobUrl1Ref.current) {
          URL.revokeObjectURL(blobUrl1Ref.current);
        }

        const { audio: newAudio1, blobUrl: newBlobUrl1 } = generateAndCreateAudio();
        audio1Ref.current = newAudio1;
        blobUrl1Ref.current = newBlobUrl1;

        // Set up crossfade for new audio
        setupCrossfade(newAudio1, audio2);

        // Start audio1 at 0 volume and play
        newAudio1.volume = 0;
        newAudio1.play();

        // Crossfade
        crossfadeAudios(audio2, newAudio1, 1000).then(() => {
          activeAudio.current = 1;
          audio2.pause();
          audio2.currentTime = 0;
          audio2.volume = 0.5;
          isGenerating.current = false;
        });
      }
    };

    audio1.addEventListener('timeupdate', checkAudio1);
    audio2.addEventListener('timeupdate', checkAudio2);
  }, [generateAndCreateAudio, crossfadeAudios]);

  const play = useCallback(async () => {
    try {
      if (!audio1Ref.current) {
        setIsLoading(true);
        console.log('Starting procedural audio generation...');

        // Generate initial two audio chunks
        const { audio: audio1, blobUrl: blobUrl1 } = generateAndCreateAudio();
        const { audio: audio2, blobUrl: blobUrl2 } = generateAndCreateAudio();

        audio1Ref.current = audio1;
        audio2Ref.current = audio2;
        blobUrl1Ref.current = blobUrl1;
        blobUrl2Ref.current = blobUrl2;

        // Set up continuous procedural generation with crossfade
        setupCrossfade(audio1, audio2);

        console.log('Starting playback...');
        await audio1.play();
        activeAudio.current = 1;
        setIsLoading(false);
      } else {
        // Resume playback
        if (activeAudio.current === 1) {
          await audio1Ref.current.play();
        } else {
          await audio2Ref.current.play();
        }
      }

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
  }, [generateAndCreateAudio, setupCrossfade]);

  const stop = useCallback(() => {
    if (audio1Ref.current) {
      audio1Ref.current.pause();
    }
    if (audio2Ref.current) {
      audio2Ref.current.pause();
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
      if (audio1Ref.current) {
        audio1Ref.current.pause();
      }
      if (audio2Ref.current) {
        audio2Ref.current.pause();
      }
      if (blobUrl1Ref.current) {
        URL.revokeObjectURL(blobUrl1Ref.current);
      }
      if (blobUrl2Ref.current) {
        URL.revokeObjectURL(blobUrl2Ref.current);
      }
    };
  }, []);

  return { isPlaying, isLoading, play, stop, toggle };
}
