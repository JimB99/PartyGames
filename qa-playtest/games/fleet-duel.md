# Fleet Duel
Status: issues
Tested: 2026-08-31, players 2 (QA1 red, QA2 blue), host TV window ~770x800 + two phone tabs ~500x800, no settings (game exposes none)

## What worked
- Game is in the catalog under **Strategy** ("Fleet Duel — 1v1 classic duel or Fleet Royale for larger groups, 2–8 players"). Fresh room hosted at /host (code HWBC), host showed "Connected" and "Pick a game".
- Selecting Fleet Duel shows **no settings rail at all** — only a "Start game" button (matches spec).
- Start auto-advanced straight into `Round 1/1 · placement` with a 90s timer; no instructions screen needing a manual "Start round" click.
- Phone placement UI: YOUR FLEET pips (5/4/3/3/2), ship-size selector, Rotate, "Random fleet", 10x10 grid, "Ready!" button.
- Manual placement works: tapping a cell placed the 5-cell ship and advanced to "Place ship 2 of 5 (4 cells)"; fleet pips filled progressively.
- "Random fleet" placed a full legal fleet instantly for both players.
- Ready from both players immediately advanced the phase to `battle` (TV header updated) — no waiting for the timer.
- Turn alternation correct: firing phone shows "Waiting for opponent…", the other shows "Your turn — fire!".
- Shots relay correctly to the TV: each shot appears on the *target* player's board on the TV in the shooter's colour, and on the shooter's own tracking grid on the phone.
- Ship secrecy on TV is correct: un-hit ship cells are never drawn on the TV — only fired-at cells appear. No spoiling.
- Sinking works: after 5 hits the victim's YOUR FLEET pip group turned red on their phone and the shooter's ENEMY FLEET pip group turned red — clear "ship sunk" feedback.
- No TV drop to lobby mid-round, no disconnects, timer during placement matched real time.

## Bugs
1. Severity: major — Hit and miss are visually identical
   - Players/settings: 2 players, no settings, battle phase
   - Repro: QA1 fired 5 shots that were all hits (A1–A5 on QA2's ship); QA2 fired 4 shots into empty water. On both the phones' tracking grids and on the TV boards, every shot renders as the same solid shooter-colour square.
   - Expected: distinct hit vs miss markers (e.g. hit = X/explosion/red, miss = dot/grey) on phone and TV.
   - Actual: no way to tell a hit from a miss except by watching the fleet pips flip when a whole ship finally sinks — makes deduction play impossible.
   - Screenshot: /workspace/qa-party-games/fleet-duel/bug-hit-miss-indistinguishable.png, host-in-round.png
2. Severity: major — "Back to lobby" leaves both phones stuck in the battle screen
   - Players/settings: 2 players, mid-battle
   - Repro: host clicks "Back to lobby" → confirm "Return to lobby?" → OK.
   - Expected: TV returns to lobby and phones return to "Waiting for host to start a game…".
   - Actual: TV returns to lobby correctly, but both phones keep showing "Fleet Duel · battle" with their grids; QA2 still shows "Your turn — fire!". Tapping a grid cell does nothing (no shot, no error, no state change) — phones are stuck until manually reloaded.
   - Screenshot: /workspace/qa-party-games/fleet-duel/back-to-lobby-phones.png
3. Severity: minor — Placement header/selector goes stale after "Random fleet"
   - Players/settings: 2 players, placement phase
   - Repro: tap "Random fleet".
   - Expected: header reflects that the fleet is complete (e.g. "Fleet ready") and size buttons disable.
   - Actual: fleet pips fill and the board shows the fleet, but the header still reads "Place ship 1 of 5 (5 cells) · Horizontal" and the size/Rotate buttons stay active, implying more ships still need placing.
   - Screenshot: /workspace/qa-party-games/fleet-duel/player-place.png (pre-random state for comparison), host-in-round.png
4. Severity: minor — A player gets no notification that they are being shot at
   - Players/settings: 2 players, battle
   - Repro: QA1 hits QA2 at A1/A2; look at QA2's phone.
   - Expected: some incoming-fire indication (own board with hits, or "QA1 hit you at A2").
   - Actual: QA2's phone only shows the enemy tracking grid; nothing changes until an entire ship is sunk (pip turns red). Only the TV shows the damage.
   - Screenshot: /workspace/qa-party-games/fleet-duel/bug-hit-miss-indistinguishable.png
5. Severity: minor — No round score accrues during the round
   - Players/settings: 2 players
   - Repro: fire 6 shots incl. 5 hits and one sunk ship; watch the per-player chips on TV/phones.
   - Expected: some points for hits/sinks, or a documented "score only at game end".
   - Actual: chips stayed `0g · 0Σ` for both players and SESSION TOTAL stayed 0 for the entire round. Unverified whether scores post at natural game end (see limitation).

## Limitations
- Natural game end (sinking all 17 cells) was not reached: battle has no visible timer and the host controls during battle offer only Pause and Back to lobby (no Skip), so completing it would need ~30 more alternating taps. End-of-game scoring / winner screen and SESSION TOTAL accumulation for Fleet Duel remain UNTESTED.

## Improvements
- Distinct hit/miss/sunk visuals on both phone and TV (and a short "HIT!"/"MISS" toast on the shooter's phone).
- Show the player's own board (with incoming hits) alongside the firing grid on the phone.
- Disable/relabel placement controls once a fleet is complete; add "Fleet ready — tap Ready!".
- On "Back to lobby", push a lobby state to phones so they leave the battle view.
- Show a running hit/sink score, and keep a Skip/End-round host control available during battle for stuck games.

## Screenshots
- /workspace/qa-party-games/fleet-duel/host-settings.png (Fleet Duel selected, no settings rail, Start game)
- /workspace/qa-party-games/fleet-duel/player-place.png (placement phase on phone)
- /workspace/qa-party-games/fleet-duel/player-fire.png (first shot fired, TV + phone)
- /workspace/qa-party-games/fleet-duel/host-in-round.png (battle in progress on TV)
- /workspace/qa-party-games/fleet-duel/bug-hit-miss-indistinguishable.png (hits vs misses look identical; sunk-ship pips)
- /workspace/qa-party-games/fleet-duel/back-to-lobby-phones.png (host in lobby, phone stuck in battle)
