# Last on the Dike — post-fix retest
Status: pass
Tested: 2026-08-31, players 4, defaults, two games
Room: WQHF

## Handoff checks

[PASS] Bidding + lock-in
Actual: 0/100/200 bids; host bid → results; survivors vs off the dike
Screenshot: screenshots/lotd-01-instructions.png

[PASS] Ranking / scores
Actual: Game 1 Winner P3 3000 / P2 1500 / P4 750 / P1 0. Game 2 P1 3000 / P4 1500 / P2 750 / P3 0. Matches stated table.
Screenshot: screenshots/lotd-02-round1-results.png

[PASS] Session Σ once (old doubling fixed)
Actual: after both games lobby 33750 / 22611 / 19550 / 8700. Exact +round once.
Screenshot: screenshots/lotd-03-game2-results.png, screenshots/lotd-04-back-to-lobby.png

[PASS] Timer 1:1 full-width
Actual: 19s→9s over 10.02s wall on 30s bid
Screenshot: screenshots/lotd-03-game2-results.png

[PASS] Back to lobby 74ms
Screenshot: screenshots/lotd-04-back-to-lobby.png

## Notes (not defects)
Header "Round 1/3" but game ended after one elimination round. Timed-out players auto bid 0 / off the dike.
