# When Was It
Status: issues
Tested: 2026-08-30, 3 players (QA1/QA2/QA3, distinct colors), host 772px-wide window (TV) + player windows 508px (Chrome enforces ~500px min width; 390px not achievable), room APQD
Settings tested: Run 1 defaults (Difficulty Mixed, TV display "Question only on TV", Pts per year off 20 pts/year, Speed scoring "Rank by speed"); Run 2 (Pts per year off 100 pts/year, Speed scoring "Off (flat points)")

## What worked
- Game is listed in the picker under **Trivia** ("When Was It — Guess when famous events happened, 2–16 players"); options panel appears on selection with all 4 documented settings.
- Host connected fine, "Pick a game" visible, 3 phones joined via /join?code=APQD with different colors.
- Round flow is clean: instructions ("Get ready!" + SCORING card on TV, "Look at the TV!" + same card on phones) → question → reveal → scoreboard, Round n/8.
- The event/question text is shown identically on TV and phones; phones get slider + big year label + "Lock in".
- Slider drag works (real mouse drag changed 1975 → 1882 and the label followed).
- Scoring math is correct and matches the "pts per year off" setting:
  - 20 pts/year: exact = 1000; 30 years off = 400 (1000 − 30×20); 12 years off = 760.
  - 100 pts/year (Run 2): exact = 1000; 30 years off = 0 (floored, no negative). Scale change confirmed.
- Speed scoring: with "Rank by speed" the fastest exact guess is marked "1st" in reveal; with "Off (flat points)" the marker disappears and only accuracy points are awarded. Setting confirmed working.
- Reveal shows every player's guessed year and the delta (+400 etc.) plus "Year: 1860" on TV; phones show the same reveal list.
- Timer accuracy is correct: host timer went 20s → 10s over 10.0s of real time (no 3x drift like Would You Rather).
- Host controls Pause / Skip / +30s / Back to lobby present; "Back to lobby" shows a confirm dialog ("Return to lobby?").
- Rounds with zero submissions are handled without crashing (reveal just shows "Year: 1925").

## Bugs
1. Severity: major — Game score does not accumulate across rounds; SESSION TOTAL stays 0
   - Players/settings: 3 players, Run 1 defaults and Run 2 alike
   - Repro: play rounds 3, 4, 5 with QA2 exact each time (1000) and QA1/QA3 30 years off (400)
   - Expected: player game badge should climb (1000 → 2000 → 3000) and SESSION TOTAL (Σ) should be non-zero after the game
   - Actual: after every round the badges read exactly QA2 1000g / QA1 400g / QA3 400g and reset to 0g at the start of the next round; Σ stayed 0Σ for all players; after "Back to lobby" the lobby SESSION TOTAL listed QA1/QA2/QA3 = 0. Same in Run 2 (QA2 exact in rounds 1 and 2 → still 1000g).
   - Screenshot: /workspace/qa-party-games/when-was-it/score-not-accumulating.png, /workspace/qa-party-games/when-was-it/host-scoreboard.png, /workspace/qa-party-games/when-was-it/back-to-lobby-phones.png
2. Severity: major — "Back to lobby" leaves phones stuck in the game round
   - Players/settings: 3 players, Run 1 defaults, pressed during round 8 question phase
   - Repro: host → Back to lobby → OK
   - Expected: phones return to "Waiting for host to start a game…"
   - Actual: host went to lobby (QR + SESSION TOTAL), but all three phones stayed on "When Was It · question" with the event text, slider, and an active "Lock in" button; timer ran to 0s and they never recovered (still stuck 30s+ later). Only a manual page reload cleared them.
   - Screenshot: /workspace/qa-party-games/when-was-it/back-to-lobby-phones.png, /workspace/qa-party-games/when-was-it/back-to-lobby-phone1.png
3. Severity: major — No submit confirmation on phones after "Lock in"
   - Players/settings: any
   - Repro: on a phone set a year and tap "Lock in"
   - Expected: locked state (button disabled/"Locked in", checkmark, or "waiting for others")
   - Actual: UI is completely unchanged — same slider, same year, same enabled "Lock in" button; only the TV's "Waiting for players… (1)" counter reveals the guess registered. A player cannot tell whether the guess went through, and can re-tap freely.
   - Screenshot: /workspace/qa-party-games/when-was-it/player-after-lockin-no-confirmation.png, /workspace/qa-party-games/when-was-it/host-waiting-count.png
4. Severity: minor — Phone year label starts out-of-range / stale (shows 2000, or the previous round's year)
   - Players/settings: any, every round
   - Repro: watch the phone at the start of a question
   - Expected: label matches the slider knob position and the question's year window
   - Actual: at game start the label reads "2000" while the slider range is e.g. 1875–1975 with the knob at max; in later rounds the label shows the previous round's guess (e.g. label 1774 while range is 1823–1923, value 1823). The label only becomes truthful after the player moves the slider — so a player who taps "Lock in" without touching the slider submits a year different from the one displayed.
   - Screenshot: /workspace/qa-party-games/when-was-it/player-stale-label.png, /workspace/qa-party-games/when-was-it/player-guess.png
5. Severity: minor — Reveal/scoreboard show no indication of the correct year on phones
   - Players/settings: any
   - Repro: reveal phase
   - Expected: phone reveal states the correct year (TV shows "Year: 1860")
   - Actual: phones list only the players' guesses and deltas; the actual answer year appears on TV only. With "Question only on TV" that is arguably intentional, but a player looking at their phone cannot see how far off they were.
   - Screenshot: /workspace/qa-party-games/when-was-it/player-reveal.png

## Improvements
- Show the correct year and the player's own delta on the phone reveal screen ("You said 1830 — actual 1860, +400").
- Give the slider a numeric/step control (± buttons or tap-to-type) — a 100-year range on a ~500px slider is coarse and a stray drag costs hundreds of points.
- Initialise the year label from the slider value (midpoint of the question window) and reset it every round.
- Add a locked state on phones and let players see who has locked in.
- Floor behaviour at high pts/year (Run 2: 30 years off = 0) makes the game all-or-nothing; consider capping the deduction or showing the range on the TV so players know the scale.
- The TV's bottom control bar sits under the desktop dock area; consider a slightly higher/pinned position (environmental, but the "Back to lobby" button was hard to hit).

## Screenshots
- /workspace/qa-party-games/when-was-it/host-settings.png (Run 1 default options)
- /workspace/qa-party-games/when-was-it/host-in-round.png
- /workspace/qa-party-games/when-was-it/host-reveal.png
- /workspace/qa-party-games/when-was-it/host-scoreboard.png
- /workspace/qa-party-games/when-was-it/host-waiting-count.png
- /workspace/qa-party-games/when-was-it/player-guess.png
- /workspace/qa-party-games/when-was-it/player-slider-drag.png
- /workspace/qa-party-games/when-was-it/player-stale-label.png
- /workspace/qa-party-games/when-was-it/player-after-lockin-no-confirmation.png
- /workspace/qa-party-games/when-was-it/player-reveal.png
- /workspace/qa-party-games/when-was-it/back-to-lobby-phones.png
- /workspace/qa-party-games/when-was-it/back-to-lobby-phone1.png
- /workspace/qa-party-games/when-was-it/host-in-round2.png (Run 2: 100 pts/year, speed off)
- /workspace/qa-party-games/when-was-it/host-reveal2.png (Run 2)
- /workspace/qa-party-games/when-was-it/player-guess2.png (Run 2)
- /workspace/qa-party-games/when-was-it/player-reveal2.png (Run 2)
- /workspace/qa-party-games/when-was-it/score-not-accumulating.png (Run 2 round 2 scoreboard — still 1000/0/0)
