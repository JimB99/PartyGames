# Agent Grid — post-fix retest
Status: issues (playable; guess limit + word pool)
Tested: 2026-08-31, players 4, Family, room WQHF

[PASS] 5×5 grid, two teams, spymaster/guesser
Screenshot: screenshots/ag-clue-host.png

[PASS] Color key only on spymasters
Screenshot: screenshots/ag-clue-p2.png vs screenshots/ag-clue-p1.png

[PASS] Clue + tap reveal on TV
Screenshot: screenshots/ag-20-guess-reveal-host.webp

[PASS] Timer 90s in sync; Pause/Skip/+30s

[PASS] Scores / Σ once (P2/P4 +3000)
Screenshot: screenshots/ag-90-final-scores-host.webp, screenshots/ag-99-back-to-lobby-host.webp

[PASS] Back to lobby

## New bugs

### Guess limit not enforced
- Severity: major
- Actual: "3 guesses left" never decremented; P4 tapped 8 own tiles in one turn and won
- Screenshot: screenshots/ag-after2-p1.png

### Word list is one alphabetical dictionary slice
- Severity: major
- Actual: all 25 tiles start with "a": anansi, ambiances, algedi, abomine, aperitive, agamically, abecedaria, apozema, …
- Screenshot: screenshots/ag-clue-host.png

### Inactive spymaster clue form on turn 1
- Severity: minor
- Actual: both spymasters saw Give clue; off-turn submit discarded

### Assassin looks like a bystander on ended screen; long words clip at 390px
