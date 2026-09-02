import type { GameRuntime } from "@party-games/shared";

/** Mulberry32 PRNG for deterministic tests. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createTestRuntime(seed = 42, startTime = 1_700_000_000_000): GameRuntime {
  const random = createSeededRandom(seed);
  let now = startTime;
  let counter = 0;
  return {
    now: () => now,
    random,
    id: () => `test-${seed}-${counter++}`,
    advance(ms: number) {
      now += ms;
    },
  } as GameRuntime & { advance(ms: number): void };
}

export function createFakeClock(startTime = 1_700_000_000_000) {
  let now = startTime;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
    set: (t: number) => {
      now = t;
    },
  };
}
