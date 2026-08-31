# Crowd Call — post-fix retest
Status: pass (old blockers fixed)
Tested: 2026-08-31, players 3, defaults, 4 rounds
Room: WQHF (P3 added as third Chrome profile)

## Handoff checks

[PASS] Timer speed (old BLOCKER)
Expected: countdown ≈ 1:1 wall clock
Actual: sampled every 1.0s wall: 18→17→…→7 over 11.1s. Exactly 1:1, no ~5×.
Screenshot: screenshots/cc-01-host-setup.png
Old vs new: **old blocker fixed**.

[PASS] Predict vs answer — no lock-out
Expected: everyone predicts, then everyone can answer
Actual: all 3 phones: predict → locked in → "Now pick your own answer"; all could submit
Screenshot: screenshots/cc-03-r2-predict-P1.png, screenshots/cc-04-r2-answer-P1.png

[PASS] Scoring not stuck at 200
Expected: scores change and vary
Actual: R1 all 200 (missed predict window). R2 P1 1400 / P2 1400 / P3 400. Final P1 5000, P2 5000, P3 4000.
Screenshot: screenshots/cc-05-host-final.png
Old vs new: **old blocker fixed**.

[PASS] Session Σ added once
Actual: final 5000/5000/4000 equals session Σ (baseline was 0 after a lobby reset — see lobby.md)
Screenshot: screenshots/cc-07-host-lobby.png

[PASS] Submit lock-in
Actual: "Prediction locked in" and "Answer locked in" on phones
Screenshot: screenshots/cc-04-r2-answer-P1.png

[PASS] Timer bar full-width
Actual: 28px→1250px of 1280, drains LTR

[PASS] Back to lobby
Actual: all 3 phones waiting within ~1s
Screenshot: screenshots/cc-06-back-to-lobby-P1.png
