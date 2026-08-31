# Draw & Guess — post-fix retest
Status: issues (canvas OK; skip-draw round + double-count)
Tested: 2026-08-31, players 4, Family Mixed Rank by speed, 4 rounds
Room: WQHF

## Handoff checks

[PASS] Drawer word + canvas; TV live mirror
Actual: P4 "Draw: attachment"; 65 svg strokes phone = 65 host
Screenshot: screenshots/dg-09-drawer-p4-real-strokes.png, screenshots/dg-10-host-mirror-strokes.png

[PASS] Guessers see drawing (TV) + submit
Actual: phones "Watch the TV and guess" + textarea; TV not blank. Guesses registered.
Screenshot: screenshots/dg-11-guessing-with-drawing-p1.png

[FAIL] Guesser lock-in feedback
Actual: wrong guess leaves text in textarea, Submit still active. No locked/wrong ack.
Screenshot: screenshots/dg-03-lockin-p1.png

[PASS] Done drawing / correct guess scores
Actual: Done → guessing immediately. Correct = 500 guesser, 250 drawer.
Screenshot: screenshots/dg-12-final-host.png

[PASS] Σ once (on inflated totals)
Actual: lobby +1250/+750/+500/+500 matching ended board
Screenshot: screenshots/dg-13-back-to-lobby-host.png

[FAIL] Final round points double-counted in game total
Actual: R4 reveal P1 750g P4 250g; ended P1 1250 P4 500 (R4 delta added again)
Screenshot: screenshots/dg-12-final-host.png

[FAIL] Round 2 skipped drawing
Actual: after R1 early correct guess, R2 opened in guessing; P3 "You're the drawer" with no word/canvas; TV empty
Screenshot: screenshots/dg-04-round2-host.png, screenshots/dg-04-round2-p3.png

[PASS] Timer 1:1 full-width

[PASS] Back to lobby ~2s
Screenshot: screenshots/dg-13-back-to-lobby-host.png

[PASS] No blank phones (except skipped-phase drawer missing word)
