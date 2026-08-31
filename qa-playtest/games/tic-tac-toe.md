# Tic-Tac-Toe
Status: issues
Tested: 2026-08-31, players 2 (QA1 red = X, QA2 blue = O), host 768x800 desktop viewport + two phone-width tabs (~500x710), settings: none (game has no settings rail), room DDVK, min 2 / max 8

## What worked
- Listed in catalog under **Strategy** ("Classic 3x3 — bracket tournament for larger groups", 2–8 players). Fresh room hosted, "Connecting…" cleared, "Pick a game" visible.
- Both phones joined /join?code=DDVK with distinct colors and appeared in the host lobby list + SESSION TOTAL at 0.
- **Auto-advance worked**: pressing "Start game" went straight into the playing board — no instructions screen requiring a blind "Start round" click.
- Role assignment clear on both surfaces: host shows "QA1 (x) vs QA2 (o)", each phone shows "You are x/o".
- Turn ownership correct: only the active player saw "Your turn"; the waiting phone showed "Waiting…" and its board did not accept taps.
- Board sync was fast and exact between both phones and the TV for every move (X:4, O:0, X:2, O:1, X:6).
- Win detection correct: X's 2-4-6 diagonal ended the round immediately; round scores 1000 (QA1) / 100 (QA2) — winner/participation split looks sane.
- Phone/TV colors consistent: QA1 red X and QA2 blue O rendered the same on TV and phones (no mismatch seen).

## Bugs
1. Severity: major — Win presentation missing / board vanishes
   - Players/settings: 2 players, default (no settings)
   - Repro: Play to a win (X on cells 4,2,6). On the winning move the host board disappears instantly and is replaced by a bare "Round scores" panel.
   - Expected: The final board stays visible for a beat with the winning line highlighted and a "QA1 wins!" style announcement before/alongside scores.
   - Actual: No winning-line highlight, no winner text anywhere on TV or phones; the 3x3 grid vanishes the same frame the round ends. Phones show only "Tic-Tac-Toe · ended" with an empty body.
   - Screenshot: /workspace/qa-party-games/tic-tac-toe/host-win.png, /workspace/qa-party-games/tic-tac-toe/win-board-vanished.png, /workspace/qa-party-games/tic-tac-toe/phone-after-win.png

2. Severity: major — SESSION TOTAL doubling (same cross-game bug as Four in a Row / Last on the Dike)
   - Players/settings: 2 players, one round played (Round 1/1)
   - Repro: Finish one Tic-Tac-Toe round, read "Round scores" vs the score chips / lobby SESSION TOTAL.
   - Expected: After a single round, SESSION TOTAL = round score (1000 / 100).
   - Actual: Round scores 1000 / 100 but chips read "1000g · 2000Σ" / "100g · 200Σ" and lobby SESSION TOTAL shows 2000 / 200 — every round's points are counted twice into the session total.
   - Screenshot: /workspace/qa-party-games/tic-tac-toe/host-win.png, /workspace/qa-party-games/tic-tac-toe/host-session-total-doubled.png

3. Severity: major — "Back to lobby" leaves phones stuck
   - Players/settings: 2 players
   - Repro: After the round ends, press "Back to lobby" on the host.
   - Expected: Both phones return to "Waiting for host to start a game…".
   - Actual: Host returns to the lobby (QR + SESSION TOTAL, both players "online"), but both phone tabs remain frozen on "Tic-Tac-Toe · ended" with an empty body and no way forward; only a manual reload/rejoin would recover them.
   - Screenshot: /workspace/qa-party-games/tic-tac-toe/back-to-lobby-phones.png, /workspace/qa-party-games/tic-tac-toe/phone-stuck-qa1.png

4. Severity: minor — No in-game instructions / rules shown
   - Players/settings: 2 players
   - Repro: Start Tic-Tac-Toe.
   - Expected: Brief rules or a "you are X, get three in a row" hint on TV and/or phone.
   - Actual: Only the board plus "You are x/o"; no instructions screen or rules text exist for this game (nothing to read).
   - Screenshot: /workspace/qa-party-games/tic-tac-toe/host-in-round.png, /workspace/qa-party-games/tic-tac-toe/player-board.png

## Improvements
- Hold the completed board on the TV for ~2–3s with the winning line animated/highlighted plus "QA1 wins!" before showing Round scores; mirror a "You won / You lost" line on phones.
- Show whose turn it is on the TV (e.g. highlight the active player's chip); currently the TV never says who is to move.
- Phones idle for the whole opponent turn with just "Waiting…" — consider showing the opponent's name and a dimmed board preview of the last move.
- With 2 players the "bracket tournament" framing never appears; a single-round 1v1 could offer best-of-3 to make the game worth a slot.
- Fix the doubling once in shared scoring code, since it reproduces across Four in a Row, Last on the Dike and now Tic-Tac-Toe.

## Screenshots
- /workspace/qa-party-games/tic-tac-toe/host-settings.png (game selected, no settings rail — only "Start game")
- /workspace/qa-party-games/tic-tac-toe/host-in-round.png
- /workspace/qa-party-games/tic-tac-toe/player-board.png
- /workspace/qa-party-games/tic-tac-toe/host-win.png
- /workspace/qa-party-games/tic-tac-toe/back-to-lobby-phones.png
- /workspace/qa-party-games/tic-tac-toe/win-board-vanished.png
- /workspace/qa-party-games/tic-tac-toe/phone-after-win.png
- /workspace/qa-party-games/tic-tac-toe/phone-stuck-qa1.png
- /workspace/qa-party-games/tic-tac-toe/host-session-total-doubled.png
