import { Howl } from 'howler';

/**
 * Encodes a mono Float32Array (-1..1) into a base64 WAV data URI
 * so Howler can play crisp procedural foley with zero external asset failures.
 */
function encodeWavDataUri(samples: Float32Array, sampleRate: number): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function createPaperTurnWav(): string {
  const sampleRate = 22050;
  const duration = 0.28;
  const length = Math.floor(sampleRate * duration);
  const samples = new Float32Array(length);

  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return (seed / 4294967296) * 2 - 1;
  };

  // Bandpass-shaped soft paper rustle with natural swell + settle
  let prev = 0;
  let lp = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / length;
    const envelope = Math.sin(t * Math.PI) * Math.pow(1 - t * 0.45, 1.2);
    const flutter = 0.78 + 0.22 * Math.sin(t * Math.PI * 7);
    const white = rand();
    // Simple high-pass then low-pass for cotton-paper airiness
    const hp = white - prev * 0.72;
    prev = white;
    lp = lp * 0.62 + hp * 0.38;
    samples[i] = lp * envelope * flutter * 0.45;
  }

  return encodeWavDataUri(samples, sampleRate);
}

function createLeatherCoverWav(): string {
  const sampleRate = 22050;
  const duration = 0.36;
  const length = Math.floor(sampleRate * duration);
  const samples = new Float32Array(length);

  let seed = 90210;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return (seed / 4294967296) * 2 - 1;
  };

  let lp = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / length;
    // Warm low-frequency board thump + soft leather friction
    const thump = Math.sin(2 * Math.PI * (78 - 34 * t) * (i / sampleRate)) * Math.exp(-t * 9.5);
    const env = Math.sin(t * Math.PI) * Math.exp(-t * 2.2);
    lp = lp * 0.84 + rand() * 0.16;
    samples[i] = (thump * 0.42 + lp * env * 0.38) * 0.65;
  }

  return encodeWavDataUri(samples, sampleRate);
}

let pageHowl: Howl | null = null;
let coverHowl: Howl | null = null;

function ensureHowls(): void {
  if (!pageHowl) {
    pageHowl = new Howl({ src: [createPaperTurnWav()], volume: 0.45 });
  }
  if (!coverHowl) {
    coverHowl = new Howl({ src: [createLeatherCoverWav()], volume: 0.5 });
  }
}

export function playPageFlipSound(): void {
  try {
    ensureHowls();
    pageHowl?.rate(0.94 + Math.random() * 0.12);
    pageHowl?.play();
  } catch {
    // Ignore autoplay blocks prior to user gesture
  }
}

export function playCoverFlipSound(): void {
  try {
    ensureHowls();
    coverHowl?.rate(0.95 + Math.random() * 0.08);
    coverHowl?.play();
  } catch {
    // Ignore autoplay blocks prior to user gesture
  }
}
