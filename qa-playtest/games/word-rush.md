# Word Rush
Status: issues

Tested: 2026-08-30, 3 players (QA1 red / QA2 green / QA3 blue), host window ~770x800 + phone tabs ~500x800, room MBSQ.
Settings: Run 1 = defaults (Difficulty Mixed, Speed scoring "Rank by speed"), 3 rounds x 60s.
Run 2 = Difficulty Hard, Speed scoring "Off (flat points)", 1 round played then Back to lobby.

## What worked
- Word Rush appears under Arcade (2-16 players) and starts cleanly with 3 players; host reached "Pick a game" without a "Connecting…" hang.
- Game options panel exposes exactly Difficulty (Mixed/Easy/Medium/Hard) and Speed scoring (Rank by speed / Off (flat points)).
- Instructions/scoring blurb is shown on both TV and phones between rounds: "Valid words score length x 100; with speed scoring, fastest valid words rank higher."
- Phones get the correct per-round letter tiles (7 letters), a free-text field and a Submit button; letters differ per round and are identical across all three phones.
- Round/phase flow is correct and in sync: instructions -> playing -> reveal -> scoreboard -> next round -> ended, with Round n/3 on host and phones.
- Host timer and phone timer counted down together and matched wall-clock time (60s round measured ~60s); Pause / Skip / +30s all acted immediately.
- Reloading a stuck phone tab (Ctrl+Shift+R) restores it to the lobby and keeps the nickname/colour, so recovery is possible.

## Bugs
1. Every valid word is rejected as "Invalid" - no player can ever score
   - Severity: blocker
   - Players/settings: 3 players; reproduced with Mixed + Rank by speed AND with Hard + Off (flat points)
   - Repro: start Word Rush, on a phone type a normal English word built only from the shown letters and press Submit. Examples tested: letters H N R P F E A -> "harp"; letters P A C E H S B -> "peach"; letters A D G V H E N -> "have"; letters A L C E G Y N -> "clean".
   - Expected: word accepted, scored length x 100 (e.g. "peach" = 500) and added to round score.
   - Actual: reveal shows "<player> Invalid X" for every submission; round scores 0 for all players.
   - Screenshot: /workspace/qa-party-games/word-rush/bug-valid-word-invalid.png, /workspace/qa-party-games/word-rush/bug-valid-word-invalid-2.png, /workspace/qa-party-games/word-rush/run2-invalid-clean.png
2. Round scores and SESSION TOTAL never accumulate
   - Severity: blocker (masked by bug 1, but scoreboard also shows nothing else)
   - Players/settings: 3 players, both runs
   - Repro: play all 3 rounds with submissions, watch host scoreboard and lobby SESSION TOTAL.
   - Expected: non-zero round scores for valid words, carried into SESSION TOTAL.
   - Actual: Round scores 0/0/0 every round; SESSION TOTAL 0/0/0 after the game (same cross-game accumulation bug as Fact Check / Quick Quiz / Reverse Fact / When Was It).
   - Screenshot: /workspace/qa-party-games/word-rush/bug-round-scores-zero.png
3. "Back to lobby" leaves phones stuck (worse here: phones keep "playing")
   - Severity: blocker
   - Players/settings: 3 players, both runs
   - Repro (a): finish all rounds, host "Back to lobby" -> all three phones stay on "Word Rush - ended" forever. Repro (b): press Back to lobby mid-round -> host returns to lobby while phones still show the live letter tiles, a running timer and an enabled Submit button for a game that no longer exists.
   - Expected: phones follow the host back to the lobby ("Waiting for host to start a game...").
   - Actual: phones frozen in game state; only a manual reload recovers them.
   - Screenshot: /workspace/qa-party-games/word-rush/back-to-lobby-phones.png, /workspace/qa-party-games/word-rush/bug-back-to-lobby-phones-still-playing.png
4. TV screen is completely blank during play
   - Severity: major
   - Players/settings: 3 players, both runs
   - Repro: start a round and look at the host screen during the "playing" phase.
   - Expected: the couch/TV screen should show the letter set and who has submitted (this is a shared-screen party game).
   - Actual: host shows only "Word Rush / Round 1/3 - playing" and the timer; no letters, no submitted/waiting indicator, so spectators can't follow the round.
   - Screenshot: /workspace/qa-party-games/word-rush/bug-host-blank-during-round.png
5. No submit confirmation on phones
   - Severity: major
   - Players/settings: 3 players, both runs
   - Repro: type a word, press Submit.
   - Expected: visible confirmation ("Submitted", the accepted word listed, or a disabled state).
   - Actual: the field just empties; nothing tells the player the word was received, and there is no list of words already submitted this round.
   - Screenshot: /workspace/qa-party-games/word-rush/player-submit.png
6. Reveal never shows the word that was submitted
   - Severity: minor
   - Players/settings: 3 players, both runs
   - Repro: submit a word and watch the reveal.
   - Expected: "QA3 - harp - Invalid" / score.
   - Actual: only "QA3  Invalid X"; players can't see what was judged or why.
   - Screenshot: /workspace/qa-party-games/word-rush/host-reveal.png
7. Enter does not submit; stale text carries into the next round
   - Severity: minor
   - Players/settings: 3 players, Run 1
   - Repro: type a word and press Enter (nothing happens, it is a textarea); leave text unsent when the round ends.
   - Expected: Enter submits in a "race to type" game; the field is cleared at the start of each round.
   - Actual: Enter inserts a newline / does nothing, and the previous round's unsent text ("peach") was still in the box when round 3 opened with different letters.
   - Screenshot: /workspace/qa-party-games/word-rush/player-submit.png

## Improvements
- Fix the dictionary/validation path first; nothing else about the game can be assessed until common words are accepted.
- Show the letter set, a per-player "submitted" tally and the found words on the TV - that is the whole point of a couch game.
- Give immediate per-submission feedback on the phone (accepted / invalid / duplicate) instead of waiting for the reveal, and allow multiple words per round with a running list (the "Race to type words" pitch implies more than one).
- Submit on Enter, clear the field on each new round, and disable Submit once the round is over.
- Broadcast the lobby state to phones when the host leaves a game, so no phone is ever left on a dead screen.
- Show speed ranking / points per word on the reveal so the "Rank by speed" option is visible to players (it could not be verified at all because no word ever scored).

## Screenshots
- /workspace/qa-party-games/word-rush/host-settings.png
- /workspace/qa-party-games/word-rush/host-settings-run2.png
- /workspace/qa-party-games/word-rush/host-in-round.png
- /workspace/qa-party-games/word-rush/host-reveal.png
- /workspace/qa-party-games/word-rush/player-submit.png
- /workspace/qa-party-games/word-rush/back-to-lobby-phones.png
- /workspace/qa-party-games/word-rush/bug-host-blank-during-round.png
- /workspace/qa-party-games/word-rush/bug-round-scores-zero.png
- /workspace/qa-party-games/word-rush/bug-valid-word-invalid.png
- /workspace/qa-party-games/word-rush/bug-valid-word-invalid-2.png
- /workspace/qa-party-games/word-rush/run2-invalid-clean.png
- /workspace/qa-party-games/word-rush/bug-back-to-lobby-phones-still-playing.png
