# Would You Rather — post-fix retest
Status: pass (blank ended screen)
Tested: 2026-08-31, players 4, Family defaults, 10 rounds
Room: WQHF

## Handoff checks

[PASS] Speed scoring hidden
Actual: options = Content, Difficulty, TV display only. No Speed scoring.
Screenshot: screenshots/wyr-01-options.png

[PASS] Lock-in + waiting (1/4)
Screenshot: screenshots/wyr-r2-p1-locked.png, screenshots/wyr-r2-host-wait1.png

[PASS] Reveal shows votes / % split
Actual: 50/50 and 75/25 matching picks
Screenshot: screenshots/wyr-r3-host-reveal.png

[PASS] No mid-game instructions
Actual: instructions once at start; then question → reveal → scoreboard → question

[PASS] Timer 1:1 full-width
Actual: 16s → 1s over 16.1s wall; bar 824px of 872

[PASS] Scores / Σ
Actual: 0g all game; lobby unchanged 69030/61100/46061/27000

[PASS] Back to lobby ~0.3s

## New bugs

### Empty ended screen
- Severity: minor
- Actual: Round 10/10 · ended title + Play again only. No wrap-up.
- Screenshot: screenshots/wyr-04-ended-host.png
