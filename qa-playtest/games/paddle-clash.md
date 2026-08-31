# Paddle Clash
Status: issues
Tested: 2026-08-31, players 2 (QA1 red, QA2 lime), host TV window ~770x800 + phone window ~500x800, room CXWD, defaults (no settings exposed)

## What worked
- Game is in the catalog (Arcade, "Pong and air-hockey on the big screen — phones control your paddle", 2–4 players); selectable with 2 players connected.
- Host started cleanly: "Connecting…" cleared, "Pick a game" visible, both phones joined via /join?code=CXWD with distinct colors.
- Instructions screen exists on replay ("Get ready! / Starting soon… / SCORING: First to 7 points wins." with a 3s auto-advance) and auto-advanced without pressing "Start round".
- TV arena renders correctly: SVG court, centre dashed line, two coloured paddles matching player colours, ball, per-side score labels.
- Realtime paddle control works: dragging each phone's paddle-move slider (0–100) moved the matching paddle on the TV within ~100ms; left paddle = QA1 (first joiner, red), right = QA2 (lime). Mapping and colour association are correct; both paddles were driven continuously for ~4 minutes.
- Rallies, bounces and scoring worked; score climbed 0-0 → 6-5 → first-to-7 ended the round.
- SESSION TOTAL updated correctly and did NOT double: after round 1 QA1 2000Σ; after round 2 QA1 4000Σ (2000 per win, accumulating). No doubling bug observed.
- "Back to lobby" returned the host to the game picker with the SESSION TOTAL preserved (QA1 4000, QA2 0) and both players still "online".

## Bugs
1. Severity: major — Phones stuck on "Paddle Clash · ended" after "Back to lobby"
   - Players/settings: 2 players, defaults.
   - Repro: finish a round → host clicks "Back to lobby" → host shows lobby/"Pick a game"; check phones.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: both phone screens still read "Paddle Clash · ended" 10+ s later; no controls, no lobby state. Only a manual tab reload would clear it.
   - Screenshot: /workspace/qa-party-games/paddle-clash/back-to-lobby-phones.png, back-to-lobby-p1.png, back-to-lobby-host.png

2. Severity: major — No win presentation
   - Repro: play until 7 points.
   - Expected: a winner announcement on the TV ("QA1 wins 7–5") and a result on each phone.
   - Actual: TV jumps straight to a plain "Round scores" list (QA1 2000 / QA2 0); the final pong score (e.g. 6–5 before the deciding point) is never shown and the arena vanishes instantly. Phones show only "Paddle Clash · ended" — no win/lose, no score.
   - Screenshot: round1-end-host.png, round2-end-host.png, round2-end-p1.png, round2-end-p2.png

3. Severity: minor — Winner-takes-all scoring hides a close match
   - A 7–5 game awards 2000 to the winner and 0 to the loser; the pong score is discarded, so a blowout and a nail-biter look identical in SESSION TOTAL.
   - Screenshot: round2-end-host.png

4. Severity: minor — Advertised air-hockey / paddleMode is unreachable
   - Catalog copy says "Pong and air-hockey", but selecting Paddle Clash shows NO settings rail at all (only "Start game"), so pong/hockey (paddleMode) cannot be chosen from the host UI. Run 2 (mode switch) could not be executed.
   - Screenshot: host-settings.png

5. Severity: minor — First round runs without any instructions screen and ends almost instantly
   - The very first round went straight to "playing" with no instructions/countdown (they only appeared on "Play again"), and with idle paddles it reached 7 points in well under a minute, ending 2000–0 before players read anything.
   - Screenshot: round1-end-host.png

6. Severity: minor — Score labels clipped at arena edges
   - "QA1 · 4" / "QA2 · 5" are drawn at x=24/776 inside the 800-wide viewBox and are visually cut by the court border on the TV.
   - Screenshot: host-in-round.png

## Improvements
- Show a winner banner with the final pong score on the TV and a "You won / You lost" card on each phone.
- Push a lobby-state message to players when the host leaves the round so phones never strand.
- Expose paddleMode (pong / air-hockey), target score and ball speed in the settings rail.
- Award points proportional to the match result (e.g. per-point or winner+runner-up) instead of 2000/0.
- Always show the instructions/countdown before round 1, not just on replays.
- Inset the score text so it isn't clipped by the court border.

## Screenshots
- /workspace/qa-party-games/paddle-clash/host-settings.png
- /workspace/qa-party-games/paddle-clash/instructions-host.png
- /workspace/qa-party-games/paddle-clash/instructions-p1.png
- /workspace/qa-party-games/paddle-clash/host-in-round.png
- /workspace/qa-party-games/paddle-clash/player-paddle.png
- /workspace/qa-party-games/paddle-clash/round1-end-host.png
- /workspace/qa-party-games/paddle-clash/round1-end-p1.png
- /workspace/qa-party-games/paddle-clash/round1-end-p2.png
- /workspace/qa-party-games/paddle-clash/round2-end-host.png
- /workspace/qa-party-games/paddle-clash/round2-end-p1.png
- /workspace/qa-party-games/paddle-clash/round2-end-p2.png
- /workspace/qa-party-games/paddle-clash/back-to-lobby-host.png
- /workspace/qa-party-games/paddle-clash/back-to-lobby-p1.png
- /workspace/qa-party-games/paddle-clash/back-to-lobby-p2.png
- /workspace/qa-party-games/paddle-clash/back-to-lobby-phones.png
