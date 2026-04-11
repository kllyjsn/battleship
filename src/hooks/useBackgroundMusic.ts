import { useCallback, useEffect, useRef, useState } from 'react';

const MUSIC_URL = '/tiki-music.mp3';

let sharedAudio: HTMLAudioElement | null = null;
let sharedContext: AudioContext | null = null;
let sharedAnalyser: AnalyserNode | null = null;
let sharedSource: MediaElementAudioSourceNode | null = null;
let refCount = 0;

function getOrCreateAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio(MUSIC_URL);
    sharedAudio.loop = true;
    sharedAudio.volume = 0.35;
    sharedAudio.preload = 'auto';
  }
  if (!sharedContext) {
    sharedContext = new AudioContext();
    sharedAnalyser = sharedContext.createAnalyser();
    sharedAnalyser.fftSize = 64;
    sharedAnalyser.smoothingTimeConstant = 0.8;
    sharedSource = sharedContext.createMediaElementSource(sharedAudio);
    sharedSource.connect(sharedAnalyser);
    sharedAnalyser.connect(sharedContext.destination);
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
    if (sharedContext?.state === 'suspended') {
      sharedContext.resume();
    }
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Autoplay blocked — will retry on next user interaction
    });
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
