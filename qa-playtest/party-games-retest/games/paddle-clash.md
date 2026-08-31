# Paddle Clash — post-fix retest
Status: issues (playable; hockey missing; banner score wrong)
Tested: 2026-08-31, players 4 (2v2), two matches, room WQHF

## Handoff checks

[FAIL] Pong vs hockey setting
Expected: options panel with pong vs hockey
Actual: no options panel at all — only Start game. Both matches were pong (ball + side paddles). Hockey unreachable.
Screenshot: screenshots/pc-05-BUG-no-paddleclash-options-panel.png
Old vs new: **shipped fix not on live UI**.

[PASS] Phones control paddles; TV shows match
Actual: "Drag to move your paddle" + Up/Down; drag moved blue paddle. Arena, ball, per-side scores.
Screenshot: screenshots/pc-06-playing-p1-paddle-moved-2v2.png

[PASS] Ended not blank
Actual: "P2 wins 3–3!" + Final scores P2 2000 others 0. (Score *value* wrong — see below.)
Screenshot: screenshots/pc-02-ended-pong-host.png

[PASS] Session Σ once
Actual: P2 9456→11456→13456; others unchanged. No doubling.
Screenshot: screenshots/pc-09-back-to-lobby-session.png

[FAIL] Timer during play
Actual: timer only on ~1s instructions. Playing has no clock; first-to-7 only.
Screenshot: screenshots/pc-06-playing-p1-paddle-moved-2v2.png

[PASS] Back to lobby ~2s
Screenshot: screenshots/pc-09-back-to-lobby-session.png

## New bugs

### Ended banner uses loser score twice
- Severity: major
- Actual: arena P1·3 / P2·7 but banner "P2 wins 3–3!". Match 2: 2–7 shown as "2–2". Losing phones show 3–3; winners show 7–3 correctly.
- Screenshot: screenshots/pc-08-BUG-ended-banner-score-mismatch.png

### 2v2 winning teammate marked loser
- Severity: major
- Actual: left P1+P3 vs right P2+P4. P2 got 2000; teammate P4 got 0 and "You lost" despite 7-goal side.

### No options panel (hockey unreachable)
- See FAIL above.

Not filed: 2000/0 winner-takes-all (intentional).
