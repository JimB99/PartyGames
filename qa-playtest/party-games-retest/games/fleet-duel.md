# Fleet Duel — post-fix retest
Status: issues (unfinishable at 4 players)
Tested: 2026-08-31, players 4, defaults, ~20 min then abort
Room: WQHF

[PASS] Place ships (manual + Random fleet + Ready)
Screenshot: screenshots/fd-placement-p4.png

[PASS] Fire phase accepts taps
Screenshot: screenshots/fd-firephase-p1.png

[FAIL] TV boards malformed
Actual: P1 64 cells, P3 24, P2 2, P4 0. Free-for-all, no bracket.
Screenshot: screenshots/fd-fire-host.png

[FAIL] Never reaches ended (blocker)
Actual: endless placement→betting→fire→reveal on Round 1/1 ~40 fire rounds. No hits, Skip only restarts fire timer. Abort via Back to lobby.
Screenshot: screenshots/fd-stall-host.png

[FAIL] Enemy waters is a mirror of P1's board
Actual: all phones show identical grids = P1 TV board. P2/P3/P4 only 2 clickable enemy cells.
Screenshot: screenshots/fd-firephase-p1.png

[FAIL] No gameplay scoring
Actual: 0g except P2 +200 from bets that paid with nobody eliminated. Lobby 81730/72500/57161/37600.

[PASS] Back to lobby
Screenshot: screenshots/fd-lobby-host.png
