# Block Stack
Status: issues
Tested: 2026-08-31, players 2 (QA1 red, QA2 light blue), host TV 770x800 window + 2 phone tabs ~500x800, room KPPA, no settings (game exposes none)

## What worked
- Block Stack is present in the catalog under Arcade ("Survive the longest — last stack standing wins", 2–8 players) and starts with 2 players.
- Host connected cleanly on a fresh /host (code KPPA), "Pick a game" visible, no stuck "Connecting…".
- Selecting Block Stack shows NO settings rail (only a "Start game" button) — matches spec.
- Instructions state auto-advances on its own (no need to click "Start round"); phone shows "Look at the TV!" + SCORING card: "Rank by survival each round. Bonus points from line-clear score."
- Host TV renders both player mini-boards live side by side with per-player labels/colors; phone renders its own full board with next/hold and hint text "Score: 0 · Swipe to move/drop · Tap to rotate". Whose board is whose was always clear.
- Player controls do respond: a left swipe on the phone board moved the active piece to column 0 (piece landed further left than the rest of the stack). Vertical swipe / taps were accepted without errors.
- Round flow (3 rounds), round_end reveal with "Round scores" + "Winner: X", then game "ended" with Play again / Back to lobby. TV never dropped to lobby mid-round.

## Bugs
1. Severity major — Rounds end in ~10–15 seconds; gravity is far too fast to play
   - Players/settings: 2 players, no settings, default 3 rounds.
   - Repro: Start Block Stack, watch a phone board. Pieces spawn and lock roughly 3–4 per second; the stack reaches the top and the round ends in about 10–15 s of wall clock.
   - Expected: a survival round that a human can actually steer — gravity slow enough that a swipe/rotate lands before the next piece spawns.
   - Actual: the stack self-builds so fast that at most 1–2 inputs land per round; all three rounds of a game finished inside ~40 s. No player ever cleared a line (Score stayed 0 the whole time).
   - Screenshot: /workspace/qa-party-games/block-stack/host-in-round.png, /workspace/qa-party-games/block-stack/player-board.png
2. Severity major — Only the final round's score reaches SESSION TOTAL; earlier round wins are discarded
   - Players/settings: 2 players, 3 rounds.
   - Repro: Game 1: QA1 won round 2 (1000), QA2 won round 3 (1000). At game end SESSION TOTAL was QA2 1000, QA1 0. Game 2: QA1 won round 3 → totals became QA1 1000 / QA2 1000.
   - Expected: each round's 1000 accumulates, so after 3 rounds the two players' totals sum to ~3000 per game.
   - Actual: exactly 1000 is added per whole game — the round-2 win (and round 1) vanished. Also the reveal panel only ever shows the latest round's scores; there is no cumulative game score across the 3 rounds.
   - Screenshot: /workspace/qa-party-games/block-stack/host-reveal.png, /workspace/qa-party-games/block-stack/host-game-end-session-total.png
3. Severity major — Round 1 ends with 0 points for everyone
   - Players/settings: 2 players.
   - Repro: Start game, let round 1 play out.
   - Expected: the last-surviving player gets the survival rank points (1000) like rounds 2 and 3.
   - Actual: round 1 ended with both players at 0; only rounds 2/3 awarded 1000.
   - Screenshot: /workspace/qa-party-games/block-stack/host-in-round.png
4. Severity major — "Back to lobby" leaves both phones stuck on "Block Stack · ended"
   - Players/settings: 2 players, after game end.
   - Repro: At game end press "Back to lobby" on the host.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host returns to the lobby (QR + SESSION TOTAL) but both phone tabs still show "Block Stack · ended" with stale 0g chips; still stuck after 15+ s. Reproduces the known cross-game bug.
   - Screenshot: /workspace/qa-party-games/block-stack/back-to-lobby-phones.png
5. Severity minor — Phone board overflows the viewport / needs scrolling
   - Repro: Join on a phone-sized viewport and start a round.
   - Expected: the whole well plus the "Swipe to move/drop · Tap to rotate" hint fits on screen.
   - Actual: the board extends below the fold; the hint line and the bottom of the well are cut off until you scroll the page, which conflicts with swipe-to-move gestures.
   - Screenshot: /workspace/qa-party-games/block-stack/player-board.png
6. Severity minor — Host "Back to lobby" button is visually overlapped by other host buttons/labels ("B…to…y" truncated behind Pause/+30s), making it hard to hit.
   - Screenshot: /workspace/qa-party-games/block-stack/host-reveal.png

## Improvements
- Slow initial gravity a lot and add a per-round time floor; a survival round should last ~60–90 s so swipes matter.
- Show a countdown/round timer and remaining players on the TV during the round.
- Give the phone haptic/visual feedback for accepted move/rotate/hard-drop so players can tell input registered.
- Show cumulative game score (all 3 rounds) on the reveal, not just the last round.
- Keep the well fully on-screen on phones and lock page scroll while the board is active.

## Screenshots
- /workspace/qa-party-games/block-stack/host-settings.png
- /workspace/qa-party-games/block-stack/host-in-round.png
- /workspace/qa-party-games/block-stack/player-board.png
- /workspace/qa-party-games/block-stack/host-reveal.png
- /workspace/qa-party-games/block-stack/host-game-end-session-total.png
- /workspace/qa-party-games/block-stack/back-to-lobby-phones.png
