# Draw & Guess
Status: issues

Tested: 2026-08-31, players 3 (QA1 red / QA2 green / QA3 blue), host TV 1280x800 left half (~770px), 3 player tabs in one ~500px-wide window (phone-like), room UJYT (fresh via /host).
Settings: Run 1 = defaults (Content Family, Difficulty Mixed, Speed scoring "Rank by speed", 3 rounds). Run 2 = Content 18+, other defaults, 1 round played.

## What worked
- Fresh room via /host connected immediately; "Pick a game" visible, code UJYT + QR + join URL shown.
- All 3 players joined /join?code=UJYT with distinct colors; lobby list + SESSION TOTAL updated live.
- Draw & Guess listed under Creative, 3–12 players, options panel exposes Content Family/18+, Difficulty, Speed scoring (host-settings.png).
- No blocking instructions screen: game auto-advanced straight into "Round 1/3 · drawing" (no risky "Start round" click needed).
- Drawer phone shows the word + a real canvas with Pen / Eraser / 3px / 6px / 10px / Undo / Clear. Mouse-drag drawing works and mirrors to the TV live with low latency and correct scaling (player-canvas.png, host-in-round.png).
- Roles rotate correctly: drawer was QA1 (r1, "crop"), QA2 (r2, "flea market"), QA3 (r3, "Seinfeld").
- Guessers get "Watch the TV and guess the drawing!" + text field + Submit during the guessing phase; a correct guess is accepted, marked with a green check on both phone and TV, ends the phase, and awards 500 to the guesser + 250 to the drawer.
- Reveal shows "Word: X" and "Drawn by Y" on the TV (reveal-round1.png).
- 18+ content ran fine and TV shows an "18+" badge; host Skip and the "Return to lobby?" confirm dialog work.
- Session totals from a completed game carried into the next game of the session (QA1 500Σ, QA3 250Σ).

## Bugs
1. Round scores do not accumulate across rounds within a game — points from earlier rounds are lost
   - Severity: major
   - Players/settings: 3 players, defaults (Family, 3 rounds)
   - Repro: r1 QA2 guesses correctly (QA2 500, QA1 250 shown on TV). r2 nobody guesses in time. At r2 reveal the TV score chips read QA1 0 / QA2 0 / QA3 0. r3 QA1 guesses correctly -> QA1 500, QA3 250. End screen "Round scores": QA1 500, QA3 250, QA2 0.
   - Expected: cumulative game score (QA1 250+500=750, QA2 500, QA3 250) at end of game.
   - Actual: only the last round's points survive; QA2's round-1 500 is silently discarded, and SESSION TOTAL shows 0Σ for every player for the whole game until the game ends.
   - Screenshot: bug-scores-reset-round2.png, bug-final-scores-only-last-round.png

2. "Back to lobby" leaves phones stuck in the old game
   - Severity: major
   - Players/settings: 3 players, both runs
   - Repro (a): after the game ended, host "Back to lobby" -> host shows lobby, all 3 phones stay on "Draw & Guess · ended" (back-to-lobby-phones.png). Repro (b, worse): during Run 2 round 2 (drawing), host "Back to lobby" -> OK -> host is in lobby but QA2's phone still shows "Draw: film set" with the pen toolbar and a live counting-down timer.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: phones remain in the dead game (mid-round, still "drawing") until the host starts another game; players could keep drawing into nothing.
   - Screenshot: back-to-lobby-phones.png, bug-back-to-lobby-phone-stuck-midgame.png

3. The drawer is shown a guess input during the guessing phase (and it silently does nothing)
   - Severity: minor (confusing / hints at an exploit; server correctly ignores it)
   - Players/settings: 3 players, defaults, round 2 (drawer QA2)
   - Repro: as drawer, wait for phase "guessing". Phone shows the secret word as a heading plus "Type your answer…" + Submit. Typed "flea market" and submitted.
   - Expected: drawer sees a drawer-appropriate screen ("You're the drawer — others are guessing"), no guess box.
   - Actual: drawer gets a guess box; submitting the correct word clears the field with no message and no score change.
   - Screenshot: bug-drawer-gets-guess-input.png

4. Guessers see a completely blank phone screen for the whole ~60s drawing phase
   - Severity: minor
   - Players/settings: 3 players, both runs
   - Repro: while drawer draws, look at QA2/QA3 phones: header + timer + "Draw & Guess · drawing" and then nothing.
   - Expected: e.g. "Look at the TV!" / "QA1 is drawing…" as other games do.
   - Actual: empty body, looks like a broken/stuck phone.
   - Screenshot: bug-guesser-blank-during-drawing.png

5. No submit confirmation for guesses
   - Severity: minor
   - Repro: submit any guess (correct or as drawer). Field just clears.
   - Expected: "Answer submitted" / disabled state / "Wrong, try again".
   - Actual: no feedback at all; only a correct guess is visible via the TV/phone check row.
   - Screenshot: player-guess.png

6. No "Done drawing" control for the drawer
   - Severity: minor
   - Repro: as drawer, finish the sketch in 5s and scroll the phone: only Pen/Eraser/sizes/Undo/Clear. Drawing phase always burns the full 60s unless the host presses Skip.
   - Expected: a "Done drawing" button (which the game is documented to have) to advance early.
   - Actual: drawer must wait out the timer.
   - Screenshot: player-canvas.png

7. A correct guess ends the round instantly for everyone
   - Severity: minor
   - Repro: r1, QA2 submitted "crop" ~20s into a 60s guessing phase; phase jumped to reveal immediately and QA3 never got to answer (0 points).
   - Expected: either keep the phase open for remaining guessers or make the rule visible in the instructions.
   - Actual: silent early end; slower players are simply cut off.
   - Screenshot: reveal-round1.png

Not reproduced: timer drift (TV and phone timers stayed in sync with real time), TV blank during a phase (TV always rendered), "Play again" (not exercised — used Back to lobby instead).
Observation (not filed): with Content = 18+ the word was "feature" (Family words were "crop", "flea market", "Seinfeld") — single sample, but the 18+ list did not look adult-flavoured.

## Improvements
- Show cumulative game score on the TV during play and add the running total to SESSION TOTAL each round, not just at game end.
- Make host "Back to lobby" push a lobby state to every phone.
- Give the drawer a dedicated phase screen (word + tools + "Done drawing"), and give guessers a "QA1 is drawing…" placeholder.
- Confirm every phone submission (toast / disabled input / "wrong, guess again").
- State the scoring rules on the instructions/TV: 500 for a correct guess, 250 for the drawer, and that the first correct guess ends the round.

## Screenshots
- /workspace/qa-party-games/draw-guess/host-settings.png
- /workspace/qa-party-games/draw-guess/host-in-round.png
- /workspace/qa-party-games/draw-guess/player-canvas.png
- /workspace/qa-party-games/draw-guess/player-guess.png
- /workspace/qa-party-games/draw-guess/back-to-lobby-phones.png
- /workspace/qa-party-games/draw-guess/reveal-round1.png
- /workspace/qa-party-games/draw-guess/bug-guesser-blank-during-drawing.png
- /workspace/qa-party-games/draw-guess/bug-drawer-gets-guess-input.png
- /workspace/qa-party-games/draw-guess/bug-scores-reset-round2.png
- /workspace/qa-party-games/draw-guess/bug-final-scores-only-last-round.png
- /workspace/qa-party-games/draw-guess/bug-back-to-lobby-phone-stuck-midgame.png
- /workspace/qa-party-games/draw-guess/run2-18plus-reveal.png
