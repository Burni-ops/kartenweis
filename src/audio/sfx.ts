let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!context) context = new AudioContextClass();
  if (context.state === "suspended") {
    void context.resume().catch(() => undefined);
  }
  return context;
}

function tone(
  enabled: boolean,
  from: number,
  to: number,
  duration: number,
  volume = 0.045,
) {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;
  try {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, to),
      now + duration,
    );
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  } catch {
    // Audio is a nice-to-have; never break the game for it.
  }
}

export function playClick(enabled: boolean) {
  tone(enabled, 440, 520, 0.06, 0.025);
}

export function playCorrect(enabled: boolean) {
  tone(enabled, 660, 880, 0.16);
}

export function playWrong(enabled: boolean) {
  tone(enabled, 240, 150, 0.2, 0.04);
}
