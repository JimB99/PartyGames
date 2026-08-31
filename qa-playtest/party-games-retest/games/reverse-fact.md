# Reverse Fact — post-fix retest
Status: issues (scoring/platform PASS; decoy copy FAIL)
Tested: 2026-08-31, players 4, Family Mixed, Rank by speed, 5 rounds
Room: WQHF

## Handoff checks

[PASS] Lock-in submit + vote
Actual: Submitted! / Vote recorded waiting; host 1/4→4/4; own option disabled
Screenshot: screenshots/rf-p1-submit-lock.png

[PASS] Early-reveal wait
Actual: P1 first; host stayed 1/4 until all 4 or timer
Screenshot: screenshots/rf-host-vote-wait.png

[PASS] g accumulates
Actual: P1 1000→2000→3000; P2 1175→1850→2525; P3 350→700→1050; P4 0→25→50
Screenshot: screenshots/rf-r3-scoreboard.png

[PASS] Round panel = this round
Actual: R5 panel 1000/675/350/25 vs chips 3000/2525/1050/50
Screenshot: screenshots/rf-r5-reveal.png

[PASS] Final non-zero
Actual: P1 3000, P2 2525, P3 1050, P4 50
Screenshot: screenshots/rf-final-board.png

[PASS] Session Σ once
Actual: 21750+3000=24750, 13456+2525=15981, 11500+1050=12550, 4400+50=4450
Screenshot: screenshots/rf-back-to-lobby.png

[PASS] Timer bar full-width
Screenshot: screenshots/rf-timer-fullwidth-host.webp

[PASS] Back to lobby 548ms
Screenshot: screenshots/rf-back-to-lobby.png

[NOT TESTABLE] 18+ decoys
Actual: options only Difficulty + Speed scoring. No Family/18+ control.

## New / still open

### House decoys are statement + "?"
- Severity: major
- Actual: "…this Asian country.?", "…selenology.?", hostage Olympics sentence+"?"
- Screenshot: screenshots/rf-r5-reveal.png

### Apostrophes stripped
- Severity: minor
- Actual: Forrests, countrys, Judge Dredds, Earths, Belgiums

### Round 1 skips submit
- Severity: minor
- Actual: opened in vote with 5 house options; R2–4 had submit.
