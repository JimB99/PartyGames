# Chain Sketch — post-fix retest
Status: issues (old blank-phone blocker fixed; guess drop + scoring)
Tested: 2026-08-31, players 3, Family Mixed, room WQHF

## Handoff checks

[PASS] Phones show draw/guess without reload (old BLOCKER)
Actual: every phase rendered instantly on all 3 phones: draw tools, "P1 is drawing…", guess with previous sketch, reveal, lobby. No blanks.
Screenshot: screenshots/cs-phase1-p1.png
Old vs new: **old blocker fixed**.

[PARTIAL] No "Draw: ?"
Actual: chain starters saw "Draw: pointer" / "Draw: track". Downstream drawer still got "Draw: ?" when upstream guess was missing or dropped.
Screenshot: screenshots/cs-BUG-r2-p2-draw-question-mark-after-valid-guess-ramp.webp

[PASS] Sketch carries
Actual: guesser sees previous drawing; next drawer got "Draw: hill" from P1's guess
Screenshot: screenshots/cs-p3-guess-sees-previous-sketch.webp

[PASS] Drawing registers + host mirror
Screenshot: screenshots/cs-p1-draw-pointer-strokes.webp

[PASS] Lock-in (Done drawing / Submit guess)

[PASS] Timer bar host + phones

[PASS] Back to lobby <2s
Screenshot: screenshots/cs-back-to-lobby-host-totals.webp

[PARTIAL] Session Σ
Actual: added once for P1 5000→6000→7000; P2 5000 P3 4000 unchanged. Lobby SESSION TOTAL P1 7000 / P2 5000 / P3 4000.

## New / still open

### P3 submitted guess silently dropped
- Severity: major
- Old vs new: **new**
- Repro: P3 types "ramp", Submit guess. Phase advances. P2 sees "Draw: ?"; host reveal "track → ?". P1/P2 guesses registered.
- Screenshot: screenshots/cs-BUG-r2-reveal-p3-guess-ramp-dropped-scores.webp

### Only chain starter scores
- Severity: major
- Actual: P1 1000g both rounds; P2/P3 0g despite drawing and guessing.
- Screenshot: screenshots/cs-BUG-r2-reveal-p3-guess-ramp-dropped-scores.webp

### Reveal labelled Round 1/3 · ended after one chain
- Severity: minor
- Actual: rounds counter never advanced past 1/3; Play again offered.
