# When Was It — post-fix retest
Status: pass
Tested: 2026-08-31, players 4, defaults (Mixed, Question only on TV, 20 pts/year, Rank by speed), 8 rounds
Room: WQHF

## Handoff checks

[PASS] Submit year + lock-in + early-wait
Actual: slider + Lock in; P1 "Year locked in 1869"; host Waiting (1/4) ~11s more; no early advance
Screenshot: screenshots/wwi-r2-p1first-host.png

[PASS] g accumulates; round panel this round; final non-zero
Actual: R2 P1 1000 / P2 380; final P1 6000, P2 4380, P3 4000, P4 2000
Screenshot: screenshots/wwi-r2-reveal-host.png, screenshots/wwi-final-host.png

[PASS] Session Σ once
Actual: 24750+6000=30750, 15981+4380=20361, 12550+4000=16550, 4450+2000=6450
Screenshot: screenshots/wwi-lobby-after-host.png

[PASS] Timer 1:1 full-width
Actual: 9s→3s over 6.008s wall = 1.0x
Screenshot: screenshots/wwi-r2-p1first-host.png

[PASS] Back to lobby ~2s
Screenshot: screenshots/wwi-lobby-after-host.png
