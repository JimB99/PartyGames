# Bracket Battle — post-fix retest
Status: pass (old start-round blocker fixed; 1-entry blank ended)
Tested: 2026-08-31, players 4, Family Mixed, room WQHF

## Handoff checks

[PASS] Start round does not end the game (old BLOCKER)
Expected: instructions → submit, not instant ended 0
Actual: Start game → Round 1/1 · instructions (3s) → submit "things HR shouldn't hear", 37s, Waiting (0/4)
Screenshot: screenshots/bb-01-submit-phase.webp
Old vs new: **old blocker fixed**.

[PASS] ≥2 entries → bracket plays
Actual: round 2 prompt "national parks", 4 entries, matchups through final Zion vs Grand Canyon
Screenshot: screenshots/bb-02-vote-matchup1.webp

[PASS] Voting + lock-in
Actual: tap highlights and sticks; all 4 votes registered; Zion champion written by P3
Screenshot: screenshots/bb-03-reveal-champion.webp

[PASS] Scores / session Σ
Actual: P3 4000 others 0. Σ P3 7000→11000, P1 8750, P2 7000, P4 0
Screenshot: screenshots/bb-04-final-scores.webp

[PASS] Timer bar in sync; +30s/Skip/Pause work

[PASS] Back to lobby ~2s, 4 phones waiting
Screenshot: screenshots/bb-05-back-to-lobby.webp

## New bugs

### One entry → blank ended screen
- Severity: minor
- Expected: "need ≥2 entries" or Final scores card
- Actual: empty body; phones "Bracket Battle · ended". Play again recovered.
- Screenshot: screenshots/bb-06-BUG-blank-ended-one-entry.webp

### Copy vs award: +2000 vs 4000
- Severity: minor
- Actual: instructions +2000 to champion author; P3 awarded 4000 (looks like 2000 per matchup win).
