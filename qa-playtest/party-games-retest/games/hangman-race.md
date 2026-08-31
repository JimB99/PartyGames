# Hangman Race — post-fix retest
Status: pass (empty-solve + leftover timer)
Tested: 2026-08-31, players 4, defaults, two games
Room: WQHF

## Checks

[PASS] Playable letter + whole-word
Actual: A–Z keypad, Solve whole word, 6 strikes, TV per-player blanks. Wrong word +2 strikes.
Screenshot: screenshots/hr-03-round2-play.png, screenshots/hr-04-phone-keyboard.png

[PASS] Racing lock-in
Actual: correct solve ✓ on TV; phone stops input; others keep racing
Screenshot: screenshots/hr-07-locked.png

[PASS] Timer ~1:1 (old 2× FIXED)
Actual: 39→16 over 22.1s wall = ~1.04×
Screenshot: screenshots/hr-06-round4-scores.png

[PASS] Scores / Σ once
Actual: rank 1000/675/350/0. Game 1 finals into Σ 72230/65325/48111/28600 exact.
Screenshot: screenshots/hr-09-gameover.png

[PASS] Back to lobby 0.64s
Screenshot: screenshots/hr-11-back-to-lobby.png

## New bugs

### Empty Solve costs 2 strikes
- Severity: minor
- Actual: empty textarea Solve → 0→2 strikes
- Screenshot: screenshots/hr-06-round4-scores.png

### Round continues after all active players solved
- Severity: minor
- Actual: 3 ✓ at 17s left, still ran out the clock
