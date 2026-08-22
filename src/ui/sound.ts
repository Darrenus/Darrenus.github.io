let context: AudioContext | null = null;
let muted = false;

const STORAGE_KEY = "rong-ui-sound-muted";

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function isSoundMuted(): boolean {
  muted = readMuted();
  return muted;
}

export function setSoundMuted(value: boolean): void {
  muted = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* Storage can be blocked; the in-memory preference still applies. */
  }
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  context ??= new AudioContextCtor();
  if (context.state === "suspended") void context.resume();
  return context;
}

export function playUiSound(kind: "send" | "navigate"): void {
  if (muted || readMuted()) return;
  const audio = getContext();
  if (!audio) return;

  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = kind === "send" ? "sine" : "triangle";
  oscillator.frequency.setValueAtTime(kind === "send" ? 720 : 460, now);
  oscillator.frequency.exponentialRampToValueAtTime(kind === "send" ? 980 : 620, now + 0.045);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.07);
}
