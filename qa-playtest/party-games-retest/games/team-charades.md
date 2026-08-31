# Team Charades — post-fix retest
Status: issues (playable; 18+ still no-op; TV leak; score inflation)
Tested: 2026-08-31, players 4, Family then 18+
Room: WQHF

## Handoff checks

[PASS] Playable actor / guess
Actual: word only on actor phone; others "P3 is acting"; Correct/Skip advance
Screenshot: screenshots/tc-02-family-acting-word-bat-actor-only.webp

[PASS] Family mostly safe (with exceptions below)
Actual: bat, boat, gift, grass, arrow, skier, gingerbread man, sphinx, …
Screenshot: screenshots/tc-04-family-actor-phone-word.png

[FAIL] 18+ pool different (old no-op NOT fixed)
Actual: 18+ badge visible; words still tame (draw, buffalo, Harry Styles, skier, brunette, Beyoncé…). skier also in family. ~27 samples, no mature.
Screenshot: screenshots/tc-10-18plus-host-badge-actor-word-brunette.webp
Old vs new: **shipped content fix not on live pool**.

[PASS] Timer 60s in sync; Pause/+30s/Skip

[PASS] Σ added once (on wrong per-game totals)
Actual: Family P3 +12000 once; 18+ P3 +6000 P2 +4500 once
Screenshot: screenshots/tc-12-back-to-lobby-after-18plus-session-totals.webp

[PASS] Back to lobby ~2s, word cleared

## New bugs

### Host TV leaks word at reveal before acting
- Severity: major
- Actual: "Word: chocolate — Actor: P1 · 0 correct" on TV before that round runs
- Screenshot: screenshots/tc-01-host-reveal-word-chocolate-on-tv.webp

### Dare sentence in family pool
- Severity: minor
- Actual: "Try to lick your own nose"; also abstract "rating"
- Screenshot: screenshots/tc-03-family-odd-prompt-actor-phone.png

### Scores attributed to non-actor and inflated
- Severity: major
- Actual: 6 corrects in family = should be 3000; P3 ended 12000 (jumped every round including 0-correct rounds). 18+: non-actor P3 6000 vs actor P2 4500.
- Screenshot: screenshots/tc-07-family-final-scores-p3-12000-others-0.webp

Not filed: solo actor / no real teams (product).
