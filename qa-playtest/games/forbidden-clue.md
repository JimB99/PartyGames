# Forbidden Clue
Status: issues

Tested: 2026-08-31, players 4 (QA1 red, QA2 yellow, QA3 green, QA4 blue), host TV window ~770x800 (Chrome, display :2), phones as 4 tabs in a ~500px window. Room SNNV. Settings: Run 1 = Content Family (default), Run 2 = Content 18+. Only game option exposed is Content Family/18+.

## What worked
- Game is in the catalog under Word & Language ("Describe the word without saying the forbidden terms", 4-12 players). Host connected cleanly, "Pick a game" visible, 4 players joined via /join?code=SNNV with distinct colors.
- Start game auto-advanced straight into Round 1 clue phase; no need to click "Start round" (instructions screens between turns auto-advance, showing "Get ready! Starting soon..." plus a SCORING panel: +500 per correct word, -100 per foul, max 3 skips per turn).
- Secret word hygiene is correct: during the clue phase the TV shows only "Team X's turn / Clue giver: NAME / Correct: n · Fouls: n" — no secret word or forbidden list. The word + forbidden list appear ONLY on the current clue-giver's phone (e.g. "Castle — Forbidden: king, knight, tower, medieval, princess").
- Guesser phones are NOT blank during the clue phase: they show "Forbidden Clue · clue" and "Listen and shout guesses!" (no Agent Grid-style blank bug).
- Giver controls work: "Got it!" increments Correct and immediately serves a new word; "Skip" swaps in a new word without scoring; "Foul" increments Fouls and keeps the word.
- Timer behaviour matched real time (~90s per turn, host countdown and phone countdown stayed in sync).
- Rotation/teams worked: R1 Team A / giver QA4, R2 Team B / giver QA2, R3 Team A / QA4, R4 Team B / QA2. Reveal phase shows "Word: <secret>" on TV after the turn ends (correct timing, after guessing).
- Scoring arithmetic per the stated rules: QA2's turn (1 correct, 1 foul) = 400 points. Round scores panel + SESSION TOTAL appeared at game end and SESSION TOTAL (400 for QA2) persisted correctly into the lobby and into the next game.
- 18+ run started fine, TV showed an "18+" badge next to the title, and starting the new game recovered the previously stuck phones.

## Bugs
1. Severity: major — Points awarded only to the clue-giver, not to the team/guessers
   - Players/settings: 4 players, Family, Run 1
   - Repro: Round 2, Team B's turn, giver QA2. Press "Got it!" once (Correct: 1) and "Foul" once. Let the turn end.
   - Expected: the team that scored (or at least the guesser credited with the answer) gains the 500/-100; a team game should show team or shared player scores.
   - Actual: only QA2 shows 400; QA1, QA3, QA4 all stay at 0 for the whole game, so "Team A/Team B" framing on the TV never maps to any visible team score. Final Round scores = QA2 400, QA1 0, QA3 0, QA4 0.
   - Screenshot: /workspace/qa-party-games/forbidden-clue/bug-scoring-giver-only.png

2. Severity: major — "Back to lobby" leaves every phone stuck on the ended screen
   - Players/settings: 4 players, Family, after game end
   - Repro: let all 4 rounds finish, then press "Back to lobby" on the host.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host returns to the lobby/QR screen, but all four phones stay frozen on "Forbidden Clue · ended" with an empty body indefinitely (only starting a new game clears them; no reload needed but no lobby state either).
   - Screenshot: /workspace/qa-party-games/forbidden-clue/back-to-lobby-phones.png

3. Severity: major — Content 18+ appears to have no effect on the word pool
   - Players/settings: 4 players, Content 18+, Run 2
   - Repro: back in lobby, pick Forbidden Clue, toggle Content to 18+, Start game, press "Got it!" on the giver's phone.
   - Expected: adult word/forbidden-term deck (the setting is the game's only option).
   - Actual: words served were the same family deck — "Detective (mystery, clue, crime, investigate, police)" then "Castle (king, knight, tower, medieval, princess)", identical to the Family run. Only the TV "18+" badge changes.
   - Screenshot: /workspace/qa-party-games/forbidden-clue/run2-18plus-same-words.png

4. Severity: minor — Dead "Your clue… / Submit clue" textarea on the clue-giver's phone
   - Players/settings: any, both runs
   - Repro: as clue-giver, type "big stone building with a moat" and press "Submit clue".
   - Expected: either the typed clue is shown to guessers/TV, or the input does not exist in this verbal couch game.
   - Actual: nothing happens anywhere — no clue text appears on the TV or on any guesser phone, no confirmation, and the box stays editable. It also occupies the top of the giver's screen and pushes the word/forbidden list down, and typing in it burns the turn timer.
   - Screenshot: /workspace/qa-party-games/forbidden-clue/player-giver.png

5. Severity: minor — Instructions/"Get ready" screen shows stale turn data
   - Players/settings: 4 players, both runs
   - Repro: watch the host between turns (e.g. entering Round 3/4 · instructions).
   - Expected: upcoming turn's team/giver, or no counters.
   - Actual: the panel shows the PREVIOUS turn's "Team A's turn / Clue giver: QA4 / Correct: 1 · Fouls: 1" while announcing the next round, so the room sees the wrong giver for a few seconds.
   - Screenshot: /workspace/qa-party-games/forbidden-clue/bug-scoring-giver-only.png

6. Severity: minor — Phones show nothing at game end
   - Players/settings: 4 players, both runs
   - Repro: let the last round end.
   - Expected: some end-of-game feedback (own score / final standings) on the phone.
   - Actual: phones show only "Forbidden Clue · ended" with a blank body; all results are TV-only.
   - Screenshot: /workspace/qa-party-games/forbidden-clue/back-to-lobby-phones.png

Not verified: the "max 3 skips per turn" limit (only one skip was used per turn).

## Improvements
- Award points to the guessing team (and/or let a guesser tap to claim the correct guess) so the Team A/Team B framing on the TV is reflected in the scoreboard.
- Remove the clue textarea for this game, or make submitted clues appear on the TV/guesser phones so it has a purpose.
- Show skips remaining ("Skips 2/3 left") next to the Skip button, and show correct/foul counters on the giver's phone too.
- Give guesser phones something actionable during the clue phase (e.g. a big "They got it!" button) instead of a static "Listen and shout guesses!".
- Make the between-turn instruction card announce the NEXT giver, and echo the running round score there.
- Send phones back to the waiting state when the host presses "Back to lobby".
- Note: the host's bottom action bar ("Back to lobby") sits under the desktop dock in a 1280x800 layout, making it hard to hit — consider raising the bar or adding an in-page control.

## Screenshots
- /workspace/qa-party-games/forbidden-clue/host-settings.png
- /workspace/qa-party-games/forbidden-clue/host-in-round.png
- /workspace/qa-party-games/forbidden-clue/player-giver.png
- /workspace/qa-party-games/forbidden-clue/player-guesser.png
- /workspace/qa-party-games/forbidden-clue/back-to-lobby-phones.png
- /workspace/qa-party-games/forbidden-clue/bug-scoring-giver-only.png
- /workspace/qa-party-games/forbidden-clue/run2-18plus-same-words.png
