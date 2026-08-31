# Grid Blast — post-fix retest
Status: pass (old instant-bomb blocker fixed)
Tested: 2026-08-31, players 3 (P1+P2 driven, P3 idle), defaults
Room: WQHF

## Handoff checks

[PASS] Movement
Expected: D-pad translates character
Actual: 4 right taps moved blue token 4 cells; walls/crates block. Hold 1.2s = one step only (no auto-repeat) — minor, see below.
Screenshot: screenshots/gb-07-holdL-after.png

[PASS] Bombs not instant (old BLOCKER)
Expected: bomb sits, explodes after delay, placer can leave
Actual: yellow ring sat ~2s; placer alive during fuse. P2 walked 4 cells in ~1.3s and survived.
Screenshot: screenshots/gb-09-bomb-t1-walkaway.png, screenshots/gb-10-bomb-t2.png
Old vs new: **old blocker fixed**.

[PASS] Round-end = this round's points
Actual: R2 panel P3 1000 / P2 750 / P1 500 vs chips 2000/1500/1000 cumulative. Correct.
Screenshot: screenshots/gb-17-state-1.png

[PASS] Ended + session Σ once
Actual: finals P3 3000, P2 2000, P1 1750. Σ P1 8750 (7000+1750), P2 7000, P3 7000.
Screenshot: screenshots/gb-19-ended.png, screenshots/gb-21-lobby.png

[PASS] Timer bar / countdown on host and phones

[PASS] Back to lobby ~106ms, 3 phones waiting
Screenshot: screenshots/gb-21-lobby.png

[PASS] 390px no overflow (scrollWidth 390)

## New bugs

### No hold-to-walk auto-repeat
- Severity: minor
- Actual: one cell per tap on 11-wide grid is tap-heavy.
