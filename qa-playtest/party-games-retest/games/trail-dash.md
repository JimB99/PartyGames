# Trail Dash — post-fix retest
Status: pass (scoring + power-up gating; steering still out of scope)
Tested: 2026-08-31, 4 humans + 3 bots, power-ups off then on, 2 rounds × 40s
Room: WQHF

## Handoff checks

[PASS] Power-ups OFF hides Jump/Fire
Actual: playing DOM only ◀ ▶ on P1
Screenshot: screenshots/td-05-pu-off-p1-playing.png

[PASS] Power-ups ON shows Jump/Fire
Actual: Jump + Fire above turn buttons
Screenshot: screenshots/td-14-pu-on-p1-playing.png

[PASS] Round-end = this round delta
Actual: "Round scores" P1 1000 … P3 25 while chips already 2000g
Screenshot: screenshots/td-03-play-host.png

[PASS] Ended finals + Σ once
Actual: Final scores = 2× round deltas. Σ P1 8750→20750 across runs, +2000 per game exactly. Lobby P1 20750 / P3 11300 / P2 9256 / P4 4200
Screenshot: screenshots/td-04-ended-host.png, screenshots/td-15-final-host-lobby.png

[PASS] Back to lobby <100ms
Screenshot: screenshots/td-08-back-p1-lobby.png

[PASS] Timer in sync host↔phones (40s play, 5s intermission)

## Out of scope (not filed)
Human steering / instant death — still ~2s rounds. Scores identical across 5 runs (rank-seeded after crash-out).
