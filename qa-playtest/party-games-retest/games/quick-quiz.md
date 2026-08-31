# Quick Quiz — post-fix retest
Status: issues
Tested: 2026-08-31, players 2 (P1 blue first-joined, P2 pink), defaults (Family, Mixed, Question only on TV, Rank by speed)
Room: WQHF

## Handoff checks

[PASS] Submit confirm / lock-in UI
Expected: after submit, options replaced by locked/waiting
Actual: green "Answer locked in — Waiting for other players…" replaces the buttons (P2 r3, P1 r4)
Screenshot: screenshots/qq-r3-p2-locked-in.webp, qq-r4-p1-locked-in.webp

[PASS] Host waiting count updates after submit
Expected: (0/2) → (1/2)
Actual: "Waiting for players… (1/2)" immediately after P2 locked in round 7
Screenshot: screenshots/qq-r1-host-question-timer.webp

[PASS] Timer bar full-width and tracks countdown
Expected: full-width bar under "Round n/8 · question"
Actual: bar spans x=24→1256 under phase header; Time 25s/17s/1s with bar shrinking; not cramped beside sidebar
Screenshot: screenshots/qq-r1-host-question-timer.webp

[PASS] Scores accumulate across rounds
Expected: chips grow round over round; not reset
Actual: 0g/0g → both 2000g by r4/r5 → P2 4000g at r7
Screenshot: screenshots/qq-r4-scores-accumulating.webp

[PASS] Final/ended board non-zero
Expected: not 0/0
Actual: "Round 8/8 · ended — Final scores: P2 4000, P1 2000"
Screenshot: screenshots/qq-final-scores-sessionsum.webp

[PASS] Session Σ not doubled / not frozen at 0
Expected: Σ == sum of game scores
Actual: at game over P2 4000g·4000Σ, P1 2000g·2000Σ; lobby SESSION TOTAL P2 4000 / P1 2000 — exact, no doubling
Screenshot: screenshots/qq-final-scores-sessionsum.webp, qq-host-lobby-session-totals.webp

[PASS] Back to lobby (see lobby.md)

## New bugs

### First-joined player submit ends the round early
- Severity: major
- Old vs new: **new** (not in original qa-playtest/games/quick-quiz.md)
- Players / settings: 2 players, defaults, speed scoring on
- Repro: Start Quick Quiz. P1 (first to join the room) answers while P2 has not. Repeat: hit in rounds 1 and 5.
- Expected: round stays in question until all players answer or timer expires. Phone that has not answered keeps options.
- Actual: phase jumps instantly to reveal; P2 gets "You didn't answer" with ~5s/17s still on the clock. Symmetric case is fine: when P2 answers first (r3, r7) host stays on "waiting for other players" until timer expires.
- Screenshot: screenshots/bug-r5-early-reveal-after-p1-only.webp, qq-r1-reveal-after-one-submit.webp

### Round-score panel vs game total mismatch
- Severity: minor
- Old vs new: **new** (related to old "scores reset" but different)
- Repro: Watch "Round scores" vs player `g` chips after a round.
- Expected: round panel shows points earned this round; chips accumulate the same amounts.
- Actual: round 7 panel showed P2 1000, but P2 chip went 2000g → 4000g (+2000). Panel looks like half the awarded points.
- Screenshot: screenshots/qq-r7-scoreboard-doubling.webp

### Round 8 question started near-expired
- Severity: minor
- Actual: host timer already showing "1s" when round 8 question appeared.

## Improvements
- Investigate whether early-reveal is tied to speed scoring + first player in the players array.
