# Spectrum
Status: issues

Tested: 2026-08-31, players 3 (QA1 red, QA2 yellow, QA3 cyan), viewports: host TV 780x800 window + one ~500px phone window with 3 tabs, settings: none (Spectrum exposes no GAME SETTINGS rail at all in the lobby)

## What worked
- Fresh room hosted via /host (code QJNW), host reached "Connected" + "Pick a game" immediately; all 3 phones joined via /join?code=QJNW with distinct colors and appeared in SESSION TOTAL / player list.
- Selecting Spectrum showed the 3–12 player card, "Start game" enabled with 3 players, game started straight into Round 1 (no instructions screen to mis-click).
- Role assignment is correct and rotates: R1 clue giver QA1, R2 QA2, R3 QA3. Only the clue giver sees "Target: N"; guessers never see the target (verified on QA2/QA3 phones during clue phase and on QA1 during R3).
- Clue giver UI (prompt pair, target, textarea, Submit clue) renders fine; guesser slider (0–100, default 50) drags smoothly and the numeric readout updates live (dragged to 89). "Lock in" is present and clickable.
- Host TV shows the spectrum poles ("Totally overrated ↔ Secretly amazing", "Kid stuff ↔ Adult luxury", "Weird but harmless ↔ Actually dangerous"), the submitted clue (R2: "Clue: bicycle"), and reveals "Target: N" in the reveal phase.
- Phase progression auto-advances: clue → guess → reveal → scoreboard → ended, then "Play again" / "Back to lobby" appear; "Back to lobby" returned the TV to the lobby correctly.

## Bugs
1. Severity: blocker — Scoring never awards points; every round score and SESSION TOTAL stays 0
   - Players/settings: 3 players, no settings
   - Repro: Play Spectrum rounds 1–3. In R3 (target 91) QA1 dragged the slider to 89 and pressed "Lock in" during the guess phase.
   - Expected: Closer-to-target guesses score points; Round scores and SESSION TOTAL accumulate.
   - Actual: "Round scores" listed QA1/QA2/QA3 = 0 and SESSION TOTAL stayed 0 for all 3 players after the game ended.
   - Screenshot: /workspace/qa-party-games/spectrum/scoreboard-all-zero.png, /workspace/qa-party-games/spectrum/host-reveal.png

2. Severity: major — Guess phase is far too short: the round uses one shared ~30s timer for clue + guess, so guessers get only the leftover seconds
   - Players/settings: 3 players, no settings
   - Repro: Round starts with ~30s. The clue giver types/submits a clue; whatever time remains (observed 8s in R1, ~5s in R2, ~12s in R3) is the entire guess window for everyone else.
   - Expected: A fresh timer (or a reasonable fixed window) for the guess phase after the clue is submitted.
   - Actual: In R1 and R2 the guess phase expired before two phones could even open and drag the slider; guesses were lost.
   - Screenshot: /workspace/qa-party-games/spectrum/host-in-round.png

3. Severity: major — Reveal/scoreboard never shows individual guesses or distance from target
   - Players/settings: 3 players, no settings
   - Repro: Complete any round; watch TV reveal.
   - Expected: Each player's marker/value on the spectrum vs the target, plus per-player points earned.
   - Actual: Reveal shows only "Target: N"; no guess markers, no per-player values; scoreboard shows bare zeros.
   - Screenshot: /workspace/qa-party-games/spectrum/host-reveal.png

4. Severity: major — Clue-phase timeout silently skips the clue: guessing proceeds with no clue at all
   - Players/settings: 3 players, no settings
   - Repro: R3 — the clue giver (QA3) did not submit before the shared timer ran out.
   - Expected: Round skipped/re-rolled, or clear "no clue given" state.
   - Actual: The game advanced to the guess phase with no clue on the TV or the phones; guessers had to guess blind.
   - Screenshot: /workspace/qa-party-games/spectrum/host-in-round.png

5. Severity: major — Phones stuck on "Spectrum · ended" after "Back to lobby"
   - Players/settings: 3 players, no settings
   - Repro: Finish the game, press "Back to lobby" on the host.
   - Expected: Phones return to "Waiting for host to start a game…".
   - Actual: TV returned to the lobby, but QA1 and QA2 phones still displayed "Spectrum · ended" (no controls, dead screen) >3s later; only a manual reload would clear them.
   - Screenshot: /workspace/qa-party-games/spectrum/back-to-lobby-phones.png

6. Severity: minor — Guessers' phones do not show the clue or the spectrum poles
   - Players/settings: 3 players, no settings
   - Repro: During guess phase, look at a guesser's phone.
   - Expected: Clue text and the two pole labels next to the slider (couch players may not be looking at the TV).
   - Actual: Phone shows only the slider and value; no clue, no labels.
   - Screenshot: /workspace/qa-party-games/spectrum/player-slider.png

7. Severity: minor — No confirmation after "Submit clue" / no waiting state for non-active players
   - Players/settings: 3 players, no settings
   - Repro: Submit a clue as the clue giver; also watch a guesser during the clue phase.
   - Expected: "Clue submitted, waiting for guesses…" and "Waiting for the clue giver…".
   - Actual: The textarea just empties and the Submit button stays live (looks like it failed); guessers see a blank body under the header.
   - Screenshot: /workspace/qa-party-games/spectrum/host-in-round.png

8. Severity: minor — No in-game instructions/rules anywhere (TV or phone), and no GAME SETTINGS rail for Spectrum in the lobby
   - Players/settings: 3 players
   - Repro: Select Spectrum in the lobby; start the game.
   - Expected: Brief rules screen (known cross-game lobby issue for empty settings).
   - Actual: Selecting Spectrum only reveals a "Start game" button — no settings controls; game jumps straight into round 1 with no rules shown.
   - Screenshot: /workspace/qa-party-games/spectrum/host-settings.png

## Improvements
- Separate timers per phase (e.g. 45s clue, 30s guess) and show the phase name on the TV timer.
- Animate the reveal: draw each player's slider marker, then the target, then points per player.
- Mirror clue + pole labels on the guesser phone; show a "locked in ✓" state after Lock in.
- Grey out / lock the round if no clue is submitted rather than running a clueless guess phase.
- Push a lobby state to phones whenever the host leaves a game, so no phone can be stranded on "ended".

## Screenshots
- /workspace/qa-party-games/spectrum/host-settings.png
- /workspace/qa-party-games/spectrum/host-in-round.png
- /workspace/qa-party-games/spectrum/host-reveal.png
- /workspace/qa-party-games/spectrum/player-slider.png
- /workspace/qa-party-games/spectrum/scoreboard-all-zero.png
- /workspace/qa-party-games/spectrum/back-to-lobby-phones.png
