/** Injectable time/random/id for deterministic tests. */
export interface GameRuntime {
  now(): number;
  random(): number;
  id(): string;
}

export function createProductionRuntime(): GameRuntime {
  let counter = 0;
  return {
    now: () => Date.now(),
    random: () => Math.random(),
    id: () => `${Date.now().toString(36)}${(counter++).toString(36)}`,
  };
}
