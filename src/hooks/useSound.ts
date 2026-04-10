import { useCallback, useRef } from 'react';

type SoundType = 'hit' | 'miss' | 'sunk' | 'place' | 'click' | 'win' | 'lose' | 'splash';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playNoise(duration: number, volume: number = 0.1) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.value = 800;

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  source.start();
}

const SOUNDS: Record<SoundType, () => void> = {
  hit: () => {
    playTone(200, 0.3, 'sawtooth', 0.12);
    setTimeout(() => playTone(150, 0.2, 'square', 0.08), 50);
    playNoise(0.2, 0.15);
  },
  miss: () => {
    playNoise(0.4, 0.08);
    playTone(400, 0.3, 'sine', 0.05);
  },
  sunk: () => {
    playTone(300, 0.15, 'sawtooth', 0.12);
    setTimeout(() => playTone(250, 0.15, 'sawtooth', 0.1), 100);
    setTimeout(() => playTone(200, 0.15, 'sawtooth', 0.08), 200);
    setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.15), 300);
    setTimeout(() => playNoise(0.5, 0.2), 300);
  },
  place: () => {
    playTone(600, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(800, 0.1, 'sine', 0.06), 50);
  },
  click: () => {
    playTone(1000, 0.05, 'sine', 0.05);
  },
  win: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 150);
    });
  },
  lose: () => {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 'sawtooth', 0.1), i * 200);
    });
  },
  splash: () => {
    playNoise(0.3, 0.06);
    playTone(300, 0.2, 'sine', 0.03);
  },
};

export function useSound() {
  const enabled = useRef(true);

  const play = useCallback((sound: SoundType) => {
    if (!enabled.current) return;
    try {
      SOUNDS[sound]();
    } catch {
      // Silently fail if audio not available
    }
  }, []);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);

  return { play, toggle, enabled };
}
