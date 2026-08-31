# Four in a Row
Status: issues
Tested: 2026-08-31, players 2 (QA1 red, QA2 blue), host viewport ~770x800 (TV window), phone viewport ~505x800, no settings (game exposes none)

## What worked
- Game is in the catalog under **Strategy** ("Four in a Row — Drop discs to connect four in a row", 2–4 players). Fresh room TMEP hosted via /host, both phones joined via /join?code=TMEP with distinct colors.
- Selecting the game shows **no settings rail at all** (as expected for this game); a "Start game" button appears under the card.
- Round started immediately into play — no instructions screen to click through (no blind "Start round" needed).
- Board sync is solid: every drop appeared on the TV and both phones within ~1s.
- Turn ownership is correct and clear: TV shows "Turn: QA1/QA2"; the active phone shows "Your turn", the other shows "Waiting…". Non-active player's column buttons are inert.
- Gravity/stacking correct (discs stack from the bottom); column drop buttons (four-in-a-row-col-N) all usable.
- Win detection correct: QA1's bottom-row 2-3-4-5 was detected instantly and the round ended.
- "Back to lobby" returned the TV to the lobby with the QR/join code intact and both players listed online.

## Bugs
1. **Session total double-counts round score — major**
   - Players/settings: 2 players, no settings, single round.
   - Repro: Play one round to a win. Look at round scores vs the player chips / SESSION TOTAL.
   - Expected: Round scores QA1 1000 / QA2 200 → SESSION TOTAL 1000 / 200.
   - Actual: SESSION TOTAL shows QA1 **2000**, QA2 **400** (exactly 2x) after a single round; chips read "1000g · 2000Σ".
   - Screenshot: /workspace/qa-party-games/four-in-a-row/host-win.png, /workspace/qa-party-games/four-in-a-row/back-to-lobby-phones.png

2. **"Back to lobby" leaves phones stuck on the ended-game screen — major**
   - Repro: After the round ends, press "Back to lobby" on the host. Check both phones.
   - Expected: Phones return to "Waiting for host to start a game…".
   - Actual: Both QA1 and QA2 remain on "Four in a Row · ended" with an empty body; no way forward without a manual reload.
   - Screenshot: /workspace/qa-party-games/four-in-a-row/back-to-lobby-phones.png

3. **No win presentation: winning line never shown, no winner announcement — major**
   - Repro: Complete a four-in-a-row.
   - Expected: TV shows the final board with the winning four highlighted and "QA1 wins!" for a beat before scores.
   - Actual: Board disappears instantly; TV jumps straight to a bare "Round scores" list. Phones just say "ended" — a player who wasn't watching can't tell who won or why.
   - Screenshot: /workspace/qa-party-games/four-in-a-row/host-win.png

4. **Disc colors on phones don't match player colors / TV — minor**
   - Repro: QA2 joined with blue. Compare the phone board with the TV board.
   - Expected: Consistent disc colors across TV and phones (player colors).
   - Actual: TV renders QA2's discs blue (their chosen color); both phones render them **yellow** (classic Connect Four palette). QA1's red happens to match by coincidence. With 3–4 players this would be ambiguous.
   - Screenshot: /workspace/qa-party-games/four-in-a-row/bug-color-mismatch.png

5. **No in-game instructions anywhere — minor**
   - Neither the TV nor the phones show any rules/instructions before or during the round (no "connect four", no note on how many rounds, no scoring explanation). Score values (1000 vs 200) are unexplained.

## Improvements
- Show the winning line highlighted plus a "X wins!" banner on TV and phones before the score screen.
- Show whose turn it is with the player's color on the phone (not just "Your turn"), and use player colors for discs on phones.
- Explain scoring on the results screen (win = 1000, loss = 200?) — as-is the numbers look arbitrary.
- Add a "waiting for opponent" hint on the phone board that names the opponent.
- Optionally preview the drop position on hover/press of a column button.

## Screenshots
- /workspace/qa-party-games/four-in-a-row/host-settings.png (game selected, no settings rail, Start game)
- /workspace/qa-party-games/four-in-a-row/host-in-round.png (round start, Turn: QA1)
- /workspace/qa-party-games/four-in-a-row/player-board.png (QA1 phone, "Your turn")
- /workspace/qa-party-games/four-in-a-row/bug-color-mismatch.png (phone yellow vs TV blue)
- /workspace/qa-party-games/four-in-a-row/host-win.png (round ended, scores, 2x session total)
- /workspace/qa-party-games/four-in-a-row/back-to-lobby-phones.png (phones stuck on "ended")
