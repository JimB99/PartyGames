# Grid Blast
Status: issues
Tested: 2026-08-31, players 2 (QA1 red / QA2 blue), host 768x800 desktop TV window + two phone-width (~500x800) player tabs, room YYKS, no settings (none advertised, none shown)

## What worked
- Listed in catalog under Arcade, "2-8 players", description "Drop bombs, chain explosions, be the last one standing".
- Fresh room via /host connected immediately; both players joined with distinct colors and appeared on TV.
- Start game went straight into Round 1/3 playing (no instructions screen; no blind "Start round" click needed).
- Phone controller shows the advertised controls: up / bomb / down / left / right (grid-blast-up/down/left/right/bomb).
- TV renders the grid, both player tokens, crates and blast flames; phone score chips mirror the TV scores in real time.
- Rounds auto-advanced 1/3 -> 2/3 -> 3/3 without host interaction; final "Round scores" panel shown.
- SESSION TOTAL after the game was 2750 / 2500 = exactly the game scores; NO doubling (the known cross-game doubling bug did not reproduce here).
- Host "Back to lobby" returned the TV cleanly to lobby with correct session totals.

## Bugs
1. Severity: major — Bombs detonate instantly with no fuse; the player who drops one always dies immediately
   - Players/settings: 2 players, no settings
   - Repro: In any round, tap the bomb button on a phone.
   - Expected: bomb is placed, ~2-3s fuse, player has time to walk away before the blast.
   - Actual: the blast appears in the same frame as the drop, kills the placer instantly and ends the round. Reproduced 3/3 times (QA2 round 1, QA1 round 2, QA2 round 3). Makes the game unplayable/unwinnable by skill — you can never survive your own bomb.
   - Screenshot: /workspace/qa-party-games/grid-blast/bomb-instant-selfkill.png, /workspace/qa-party-games/grid-blast/round1-end.png

2. Severity: major — Movement becomes unresponsive; in round 3 neither player could move at all
   - Players/settings: 2 players, no settings
   - Repro: Tap a direction on a phone, wait, tap again. In rounds 1-2 the first press moved the token one cell, subsequent presses in the same direction (into an open floor cell) did nothing. In round 3/3 no direction key moved either player at all (tested down x3 and up/right for QA1, down x3 for QA2 over ~15s).
   - Expected: repeated direction taps move the token one cell per tap / continuous movement.
   - Actual: at most one accepted move per player per round; in round 3 zero moves accepted although open floor cells were adjacent. Realtime play is effectively impossible.
   - Screenshot: /workspace/qa-party-games/grid-blast/round3-movement-stuck.png

3. Severity: minor — Win presentation missing at game end
   - Players/settings: 2 players
   - Repro: Play all 3 rounds to completion.
   - Expected: a winner announcement (e.g. "QA1 wins!") / podium.
   - Actual: only a plain "Round scores" list (QA1 2750, QA2 2500); no winner named, no celebration.
   - Screenshot: /workspace/qa-party-games/grid-blast/game-end-no-winner.png

4. Severity: major — "Back to lobby" leaves phones stuck (known cross-game bug, reproduces here)
   - Players/settings: 2 players
   - Repro: After the game ends, press "Back to lobby" on the host.
   - Expected: both phones return to "Waiting for host to start a game…".
   - Actual: TV returns to lobby, but both phones remain on "Grid Blast · ended" with stale 0g chips; they never re-render the waiting state.
   - Screenshot: /workspace/qa-party-games/grid-blast/back-to-lobby-phones.png, /workspace/qa-party-games/grid-blast/back-to-lobby-phone-qa1.png

5. Severity: minor — No in-game instructions anywhere
   - Repro: Start Grid Blast.
   - Expected: a short "how to play" (bomb fuse, blast range, scoring) on TV or phone before/at round start.
   - Actual: game drops straight into play; nothing explains scoring (players got 1000/750/+1000 chunks with no on-screen explanation).
   - Screenshot: /workspace/qa-party-games/grid-blast/host-in-round.png

## Improvements
- Add a bomb fuse timer with a visible countdown/pulse on the TV, and render the pending bomb before the blast.
- Show blast range and crate destruction feedback; make walls (light cells) visually distinct from floor (dark cells) — it is currently hard to tell which cells are passable.
- Announce the winner and show a per-round score breakdown; explain the scoring rule (survival bonus vs crates).
- Ensure round/game end broadcasts a state reset to the phone controllers so "Back to lobby" un-sticks them.
- Consider hold-to-move / repeat on direction buttons for realtime feel.

## Screenshots
- /workspace/qa-party-games/grid-blast/host-settings.png (game selected, no settings rail — expected, none advertised)
- /workspace/qa-party-games/grid-blast/host-in-round.png
- /workspace/qa-party-games/grid-blast/player-controls.png
- /workspace/qa-party-games/grid-blast/round1-end.png
- /workspace/qa-party-games/grid-blast/bomb-instant-selfkill.png
- /workspace/qa-party-games/grid-blast/round3-movement-stuck.png
- /workspace/qa-party-games/grid-blast/game-end-no-winner.png
- /workspace/qa-party-games/grid-blast/back-to-lobby-phones.png
- /workspace/qa-party-games/grid-blast/back-to-lobby-phone-qa1.png
