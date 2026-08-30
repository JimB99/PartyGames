export const HANGMAN_MAX_STRIKES = 6;

export function normalizeLetter(letter: string): string {
  return letter.trim().toLowerCase().slice(0, 1);
}

export function isValidGuess(letter: string): boolean {
  const n = normalizeLetter(letter);
  return n.length === 1 && /[a-z]/.test(n);
}

export function createHangmanPlayerState(word: string) {
  const lower = word.toLowerCase();
  return {
    word: lower,
    guessed: new Set<string>(),
    strikes: 0,
    solved: false,
    solvedAt: null as number | null,
  };
}

export function applyHangmanLetter(
  state: ReturnType<typeof createHangmanPlayerState>,
  letter: string,
  now = Date.now(),
): ReturnType<typeof createHangmanPlayerState> {
  const n = normalizeLetter(letter);
  if (!isValidGuess(n) || state.solved || state.guessed.has(n)) return state;
  const guessed = new Set(state.guessed);
  guessed.add(n);
  const inWord = state.word.includes(n);
  let strikes = state.strikes;
  if (!inWord) strikes += 1;
  const solved = [...state.word].every((c) => c === " " || c === "-" || guessed.has(c));
  return {
    ...state,
    guessed,
    strikes,
    solved,
    solvedAt: solved && !state.solved ? now : state.solvedAt,
  };
}

export function hangmanMask(word: string, guessed: Set<string>): string {
  return [...word]
    .map((c) => {
      if (c === " " || c === "-") return c;
      return guessed.has(c) ? c.toUpperCase() : "_";
    })
    .join(" ");
}

export function hangmanLost(state: { strikes: number }): boolean {
  return state.strikes >= HANGMAN_MAX_STRIKES;
}

export function tryHangmanSolve(
  state: ReturnType<typeof createHangmanPlayerState>,
  guess: string,
  now = Date.now(),
): ReturnType<typeof createHangmanPlayerState> {
  if (state.solved || hangmanLost(state)) return state;
  const normalized = guess.trim().toLowerCase();
  if (normalized === state.word) {
    return { ...state, solved: true, solvedAt: now };
  }
  return { ...state, strikes: Math.min(state.strikes + 2, HANGMAN_MAX_STRIKES) };
}
