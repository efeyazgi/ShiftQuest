export type GameSound = "correct" | "wrong" | "xp" | "complete" | "level-up";

const patterns: Record<GameSound, Array<[number, number, number]>> = {
  correct: [[660, 0, 0.08], [880, 0.08, 0.11]],
  wrong: [[220, 0, 0.12], [175, 0.1, 0.16]],
  xp: [[520, 0, 0.07], [780, 0.06, 0.09]],
  complete: [[440, 0, 0.1], [660, 0.1, 0.1], [880, 0.2, 0.18]],
  "level-up": [[392, 0, 0.1], [523, 0.1, 0.1], [659, 0.2, 0.1], [784, 0.3, 0.2]],
};

export function playGameSound(kind: GameSound, enabled = true, volume = 0.5) {
  if (!enabled || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const start = context.currentTime;
  for (const [frequency, offset, duration] of patterns[kind]) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === "wrong" ? "square" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(Math.max(0.01, volume * 0.09), start + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, start + offset + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + duration);
  }
  window.setTimeout(() => void context.close(), 900);
}
