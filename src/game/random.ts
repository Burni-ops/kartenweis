export type Rng = () => number;

/** Small deterministic RNG, good enough for question selection. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function sample<T>(items: readonly T[], count: number, rng: Rng): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, count));
}

export function pick<T>(items: readonly T[], rng: Rng): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(rng() * items.length)];
}
