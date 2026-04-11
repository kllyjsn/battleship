import { useCallback, useEffect, useRef, useState } from 'react';

const MUSIC_URL = '/tiki-music.mp3';

let sharedAudio: HTMLAudioElement | null = null;
let sharedContext: AudioContext | null = null;
let sharedAnalyser: AnalyserNode | null = null;
let sharedSource: MediaElementAudioSourceNode | null = null;
let refCount = 0;
let sourceConnected = false;

function getOrCreateAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio(MUSIC_URL);
    sharedAudio.loop = true;
    sharedAudio.volume = 0.5;
    sharedAudio.preload = 'auto';
    sourceConnected = false;
  }

  if (!sharedContext) {
    sharedContext = new AudioContext();
    sharedAnalyser = sharedContext.createAnalyser();
    sharedAnalyser.fftSize = 64;
    sharedAnalyser.smoothingTimeConstant = 0.8;
  }

  // Connect source → analyser → destination only once per audio element
  if (!sourceConnected && sharedContext && sharedAnalyser) {
    try {
      sharedSource = sharedContext.createMediaElementSource(sharedAudio);
      sharedSource.connect(sharedAnalyser);
      sharedAnalyser.connect(sharedContext.destination);
      sourceConnected = true;
    } catch {
      // Already connected (e.g., HMR re-run) — mark so we don't retry
      sourceConnected = true;
    }
  }

  return { audio: sharedAudio, analyser: sharedAnalyser! };
}

export function useBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameRef = useRef<number>(0);
  const [freqData, setFreqData] = useState<number[]>([]);

  useEffect(() => {
    refCount++;
    return () => {
      refCount--;
      if (refCount <= 0) {
        sharedAudio?.pause();
        sharedAudio = null;
        sourceConnected = false;
        if (sharedContext) {
          sharedContext.close().catch(() => {});
          sharedContext = null;
          sharedAnalyser = null;
          sharedSource = null;
        }
        refCount = 0;
      }
    };
  }, []);

  // Frequency data update loop
  useEffect(() => {
    if (!isPlaying) {
      setFreqData([]);
      return;
    }

    const { analyser } = getOrCreateAudio();
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      // Take a subset of bins for the visualizer (skip DC, pick ~8 bars)
      const bars: number[] = [];
      const step = Math.max(1, Math.floor(bufferLength / 8));
      for (let i = 1; i < bufferLength && bars.length < 8; i += step) {
        bars.push(dataArray[i] / 255);
      }
      setFreqData(bars);
      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const play = useCallback(() => {
    const { audio } = getOrCreateAudio();

    const resumeAndPlay = async () => {
      try {
        // Resume AudioContext first — required on mobile browsers
        if (sharedContext && sharedContext.state === 'suspended') {
          await sharedContext.resume();
        }
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('[Music] Playback failed:', err);
      }
    };

    resumeAndPlay();
  }, []);

  const pause = useCallback(() => {
    if (sharedAudio) {
      sharedAudio.pause();
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  return { isPlaying, play, pause, toggle, freqData };
}
