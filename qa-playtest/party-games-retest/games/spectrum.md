# Spectrum — post-fix retest
Status: issues (old scoring blocker NOT fixed)
Tested: 2026-08-31, players 3, defaults, two full 3-round games
Room: WQHF

## Handoff checks

[FAIL] Non-zero scoring (old BLOCKER — not fixed)
Expected: +1000 minus 10 per point off; clue giver earns half of best guess. 0 vs target 1 ≈ 990.
Actual: every player 0g every round. Game 2 r3 clue "fidget spinner" target 1, P1 locked 0 → 0g. Game 1 r3 "lukewarm bath" target 46, P1 locked 49 → 0g. Givers also 0.
Screenshot: screenshots/sp-final-scoreboard.png, screenshots/sp-p1-slider-0-target1.webp
Old vs new: **old blocker still present**.

[PASS] Lock-in / slider
Actual: non-givers get slider + live value + Lock in; giver gets target + clue + Submit clue. Keyboard and drag work.
Screenshot: screenshots/sp-guess-lockin-3phones.webp

[FAIL] Final board not 0/0/0
Actual: Round 3/3 · ended P1 0g / P2 0g / P3 0g both games. No per-player guess/score list — only axis, clue, target.
Screenshot: screenshots/sp-final-scoreboard.png

[N/A] Session Σ
Actual: lobby still P1 7000 / P2 5000 / P3 4000 because game totals were 0.
Screenshot: screenshots/sp-host-lobby-session-unchanged.webp

[PASS] Timer bar in sync host + phones

[PASS] Back to lobby <2s
Screenshot: screenshots/sp-back-to-lobby-3phones-waiting.webp

[PASS] Phones usable at 390px

## New bugs

### Guess phase skipped some rounds
- Severity: major
- Actual: after clue submit, jumped to scoreboard; non-givers never got a slider (g2 r2, g1 r1/r2).

### Round ends when ONE guesser locks
- Severity: major
- Actual: g2 r3 ended when P1 locked with ~4s left; P3 never locked. Also a single slider drag by P2 ended a round with 16s left.

### Reveal shows no guesses or deltas
- Severity: minor
- Actual: only axis, clue, target — no markers.
