import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'hit' | 'miss' | 'sunk' | 'place' | 'click' | 'win' | 'lose' | 'splash' | 'sonarPing';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

/* ── Utility: filtered noise burst (underwater ambience base) ── */
function playFilteredNoise(
  duration: number,
  volume: number,
  filterFreq: number,
  filterType: BiquadFilterType = 'lowpass',
  filterQ: number = 1,
) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = audioContext.createBufferSource();
  src.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  src.start();
}

/* ── Utility: precise tone with optional fade-in ── */
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  fadeIn: number = 0,
) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.frequency.value = freq;
  osc.type = type;

  const t = audioContext.currentTime;
  if (fadeIn > 0) {
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + fadeIn);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  } else {
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  }

  osc.start(t);
  osc.stop(t + duration);
}

/* ── Sonar ping: the classic submarine "ping" ── */
function playSonarPing(volume: number = 0.18) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const t = audioContext.currentTime;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1520, t);
  osc.frequency.exponentialRampToValueAtTime(1480, t + 1.2);

  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  filter.Q.value = 12;

  gain.gain.setValueAtTime(volume, t);
  gain.gain.setValueAtTime(volume * 0.9, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(t);
  osc.stop(t + 1.5);

  // Echo return
  setTimeout(() => {
    if (!audioContext) return;
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    const filter2 = audioContext.createBiquadFilter();
    const t2 = audioContext.currentTime;

    osc2.type = 'sine';
    osc2.frequency.value = 1490;
    filter2.type = 'bandpass';
    filter2.frequency.value = 1500;
    filter2.Q.value = 8;

    gain2.gain.setValueAtTime(volume * 0.25, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.8);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.9);
  }, 200);
}

/* ── Metallic hull ping (short, reverberant) ── */
function playMetallicPing(freq: number, volume: number = 0.1) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const t = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2.756; // inharmonic — sounds metallic

  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(t);
  osc2.start(t);
  osc.stop(t + 0.5);
  osc2.stop(t + 0.5);
}

/* ── Depth charge / underwater explosion ── */
function playDepthCharge(volume: number = 0.2) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const t = audioContext.currentTime;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
  gain.gain.setValueAtTime(volume, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(t);
  osc.stop(t + 0.8);

  playFilteredNoise(0.5, volume * 0.7, 400, 'lowpass', 2);
  setTimeout(() => playMetallicPing(120, volume * 0.3), 150);
}

/* ── Torpedo launch ── */
function playTorpedoLaunch(volume: number = 0.12) {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const t = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.5);

  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  filter.Q.value = 3;

  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(t);
  osc.stop(t + 0.6);

  playFilteredNoise(0.2, volume * 0.5, 2000, 'highpass', 1);
}

/* ── Hydrophone static ── */
function playHydrophoneStatic(volume: number = 0.04) {
  playFilteredNoise(0.6, volume, 600, 'bandpass', 3);
}

/* ═══ Sound map ═══ */
const SOUNDS: Record<SoundType, () => void> = {
  sonarPing: () => {
    playSonarPing(0.16);
  },

  hit: () => {
    playDepthCharge(0.18);
    setTimeout(() => playMetallicPing(250, 0.08), 200);
  },

  miss: () => {
    playTorpedoLaunch(0.06);
    playFilteredNoise(0.5, 0.06, 300, 'lowpass', 2);
    setTimeout(() => playHydrophoneStatic(0.03), 100);
  },

  sunk: () => {
    playDepthCharge(0.22);
    setTimeout(() => {
      playTone(60, 0.8, 'sawtooth', 0.08, 0.1);
      playTone(45, 1.0, 'sine', 0.06, 0.2);
    }, 300);
    setTimeout(() => playMetallicPing(180, 0.06), 400);
    setTimeout(() => playMetallicPing(140, 0.05), 550);
    setTimeout(() => playMetallicPing(100, 0.04), 700);
    setTimeout(() => playSonarPing(0.08), 900);
  },

  place: () => {
    playMetallicPing(800, 0.08);
    setTimeout(() => playTone(1200, 0.08, 'sine', 0.04), 50);
    playFilteredNoise(0.15, 0.03, 3000, 'highpass', 2);
  },

  click: () => {
    playMetallicPing(2000, 0.05);
    playTone(1500, 0.04, 'sine', 0.03);
  },

  win: () => {
    const freqs = [800, 1000, 1200, 1500];
    freqs.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.25, 'sine', 0.1), i * 180);
    });
    setTimeout(() => playMetallicPing(2000, 0.08), 750);
    setTimeout(() => playSonarPing(0.1), 900);
  },

  lose: () => {
    const freqs = [600, 500, 350, 200];
    freqs.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.5, 'sawtooth', 0.08), i * 250);
    });
    setTimeout(() => {
      playTone(50, 1.2, 'sawtooth', 0.06, 0.3);
      playFilteredNoise(1.0, 0.05, 200, 'lowpass', 2);
    }, 600);
    setTimeout(() => playMetallicPing(80, 0.06), 1100);
  },

  splash: () => {
    playFilteredNoise(0.4, 0.05, 500, 'lowpass', 2);
    playTone(250, 0.2, 'sine', 0.03, 0.02);
    setTimeout(() => playHydrophoneStatic(0.03), 150);
  },
};

/* ═══ Ambient underwater loop ═══ */
let ambientNodes: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

function startAmbient() {
  if (!audioContext || ambientNodes) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const duration = 4;
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  // Brown noise for deep ocean rumble
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lp = audioContext.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  lp.Q.value = 1;

  const bp = audioContext.createBiquadFilter();
  bp.type = 'peaking';
  bp.frequency.value = 80;
  bp.gain.value = 6;
  bp.Q.value = 0.5;

  const gain = audioContext.createGain();
  gain.gain.value = 0.025;

  source.connect(lp);
  lp.connect(bp);
  bp.connect(gain);
  gain.connect(audioContext.destination);

  source.start();
  ambientNodes = { source, gain };
}

function stopAmbient() {
  if (ambientNodes) {
    try {
      ambientNodes.source.stop();
    } catch {
      // already stopped
    }
    ambientNodes = null;
  }
}

/* ═══ Hook ═══ */
export function useSound() {
  const enabled = useRef(true);

  useEffect(() => {
    const startOnInteract = () => {
      if (enabled.current) startAmbient();
      document.removeEventListener('click', startOnInteract);
      document.removeEventListener('keydown', startOnInteract);
    };
    document.addEventListener('click', startOnInteract);
    document.addEventListener('keydown', startOnInteract);

    return () => {
      document.removeEventListener('click', startOnInteract);
      document.removeEventListener('keydown', startOnInteract);
      stopAmbient();
    };
  }, []);

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
    if (enabled.current) {
      startAmbient();
    } else {
      stopAmbient();
    }
    return enabled.current;
  }, []);

  return { play, toggle, enabled };
}
