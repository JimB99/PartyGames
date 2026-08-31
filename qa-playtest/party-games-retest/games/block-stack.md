# Block Stack — post-fix retest
Status: issues (unsteerable)
Tested: 2026-08-31, players 4, defaults, 3 rounds
Room: WQHF

[PASS] TV 4 boards live
Screenshot: screenshots/bs-01-start-boards.webp

[PASS] Rotate tap + Hold
Screenshot: screenshots/bs-02-p3.png

[FAIL] Swipe left/right effectively unresponsive
Expected: horizontal swipe moves piece
Actual: 110–220px swipes no column change on all 4 phones (CDP touch, mouse drag, desktop drag). One very slow 160px swipe moved 1 column. All boards stacked cols 2–4, 0 lines cleared.
Screenshot: screenshots/bs-02-after-left-swipes.webp, screenshots/bs-04-round3-boards-narrow-band.webp
Note: events reach the pad; likely a gesture-threshold bug. Confirm on a real phone.

[FAIL] Hard drop / swipe down does nothing
Screenshot: screenshots/bs-03-after-right-swipe.webp

[PASS] Ended + winner P4 1000
Screenshot: screenshots/bs-05-ended-final-scores.webp

[PASS] Σ once P4 36600→37600
Screenshot: screenshots/bs-06-back-to-lobby-totals.webp

[PASS] Back to lobby
