type OscType = OscillatorType;

let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = new Ctx();
}

function playTone(freq: number, dur: number, type: OscType = 'sine', vol = 0.15): void {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

export function sfxClick(): void {
  playTone(800, 0.08, 'sine', 0.1);
  playTone(1200, 0.05, 'sine', 0.05);
}

export function sfxSuccess(): void {
  playTone(523, 0.15);
  setTimeout(() => playTone(659, 0.15), 100);
  setTimeout(() => playTone(784, 0.3), 200);
}

export function sfxFail(): void {
  playTone(200, 0.3, 'sawtooth', 0.1);
  playTone(150, 0.3, 'sawtooth', 0.08);
}

export function sfxDoor(): void {
  playTone(100, 0.6, 'sawtooth', 0.08);
  playTone(80, 0.8, 'sawtooth', 0.05);
}

export function sfxPickup(): void {
  playTone(600, 0.1);
  setTimeout(() => playTone(900, 0.15), 80);
}

export function sfxAmbient(): void {
  if (!audioCtx) return;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.015;
  const src = audioCtx.createBufferSource();
  const g = audioCtx.createGain();
  src.buffer = buf;
  src.loop = true;
  g.gain.value = 0.3;
  src.connect(g);
  g.connect(audioCtx.destination);
  src.start();
}
