# Tic-Tac-Toe — post-fix retest
Status: issues (board + win line OK; 4-player bracket stalls)
Tested: 2026-08-31, players 4 (all forced in; 2-player-only not offered), defaults
Room: WQHF

## Handoff checks

[PASS] Playable board
Actual: match 1 P1 (✕) vs P3 (○); P2/P4 "Watch the TV — your match is coming up!". Taps mirror; inactive cells disabled.
Screenshot: screenshots/ttt-02-start-9224.png

[PASS] Winning line on match_end
Actual: P1 top row ✕✕✕; board stayed visible with gold outline on winning cells. Not blank.
Screenshot: screenshots/ttt-03-win-9224.png

[FAIL] Winner banner
Expected: "P1 wins!"
Actual: no winner text; only "Round 1/1 · match_end", board, "P1 (✕) vs P3 (○)". Phones "Waiting…"
Screenshot: screenshots/ttt-03-win-9224.png
Old vs new: **new** (or incomplete shipped fix).

[BLOCKED] Session Σ
Actual: never reached ended/scoring. Lobby Σ unchanged 20750/11300/9256/4200. No doubling observed because no award.
Screenshot: screenshots/ttt-06-lobby-9224.png

[PASS] Back to lobby
Actual: confirm dialog then all 4 phones waiting ~2s
Screenshot: screenshots/ttt-06-lobby-9324.png

## New bugs

### Bracket stalls after match 1: P1 vs ?
- Severity: blocker (unfinishable)
- Old vs new: **new**
- Repro: 4 players, play match 1 to a win.
- Expected: P2 vs P4 semifinal, then final, then ended + scores.
- Actual: host "playing" **P1 (✕) vs ? (○)**; all cells disabled; P2/P3/P4 watching TV; no timer/Skip. Frozen 25s+. Only recovery: Back to lobby.
- Screenshot: screenshots/ttt-05-stall-9224.png
