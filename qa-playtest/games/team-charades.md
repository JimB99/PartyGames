# Team Charades
Status: issues

Tested: 2026-08-31, players 3 (QA1/QA2/QA3, distinct colors), host TV window ~770x800 + phone window ~500x800 (3 tabs), room TGEB.
Runs: Run 1 = defaults (Content Family, Difficulty Mixed), 3 rounds played to end + Back to lobby. Run 2 = Content 18+, 1 round partially played.

## What worked
- Host /host connected fast; "Pick a game" reached; Team Charades listed under Party & Teams (3–12 players), enabled at 3 players.
- GAME OPTIONS shown: Content (Family/18+), Difficulty (Mixed/Easy/Medium/Hard). Screenshot: host-settings.png, host-settings-18plus.png.
- Instructions phase auto-advanced (~5s, no need to click "Start round") into "acting" — no Bracket Battle-style trap.
- Actor rotation worked: round 1 actor QA1, round 2 QA2, round 3 QA3 (one actor per round; only that phone shows the word + Correct/Skip).
- Word secrecy: TV never showed the word; guesser phones never showed it. Correct button advances to next word instantly and awards +500 (matches stated scoring).
- End screen on TV showed Round scores (QA1 1000, QA2 1000, QA3 500) and SESSION TOTAL accumulated correctly (Σ carried over into Run 2: 1000/1000/500).
- 18+ badge rendered next to the title on the TV in Run 2.
- No blank-phone-after-phase-change bug (unlike Chain Sketch): no reloads were needed at any phase in either run.

## Bugs
1. Severity: major — TV is blank during the entire acting phase
   - Players/settings: 3 players, both Family and 18+ runs, every round.
   - Repro: start Team Charades → after instructions auto-advance, look at host TV.
   - Expected: TV shows whose turn it is, their team, words-guessed count, and some prompt for guessers (phones say "Look at the TV!").
   - Actual: TV shows only title, "Round 1/3 · acting", timer and host controls — a big empty area. Guesser phones show only "Team Charades · acting" with no text at all, so guessers have no on-screen indication of who is acting or what to do.
   - Screenshot: qa-party-games/team-charades/host-in-round.png, player-guesser.png

2. Severity: major — the game has no teams at all despite being "Team Charades" (Party & Teams)
   - Players/settings: 3 players, defaults.
   - Repro: play a full 3-round game; inspect TV and phones for team labels.
   - Expected: players split into teams, team assignment communicated, points scored per team.
   - Actual: no team names/assignment anywhere; points go solely to the acting player (+500 each word). Effectively individual charades; guessers get 0 for guessing.
   - Screenshot: host-ended.png

3. Severity: major — "Back to lobby" leaves all phones stuck on the ended screen
   - Players/settings: 3 players, defaults, after game end.
   - Repro: at "Round 3/3 · ended" click Back to lobby on host.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host returns to lobby ("3 players connected"), but all 3 phones keep showing "Team Charades · ended" indefinitely (no reload attempted; they did recover automatically when the next game was started).
   - Screenshot: back-to-lobby-phones.png (+ back-to-lobby-phones0/1/2.png)

4. Severity: minor — non-charades prompt leaked into the word list
   - Players/settings: 3 players, Content Family, Difficulty Mixed, round 2.
   - Repro: act words as QA2 in round 2.
   - Expected: single word/short phrase to act out.
   - Actual: one "word" was "Perform a freestyle rap about a random object" (a dare-style prompt from another game's pool), impossible to mime.
   - Screenshot: n/a (captured in log; word text observed on actor phone)

5. Severity: minor — Content 18+ appears to have no effect on words
   - Repro: Run 2 with Content 18+; observe actor words.
   - Expected: adult word pool.
   - Actual: words were "Pole vault", "cheeseburger" — indistinguishable from Family ("safari", "gate", "catalyst"). Also "copyright" is a poor charades word for Family/Mixed.
   - Screenshot: host-settings-18plus.png, player-actor.png

6. Severity: minor — an unguessed word carries over to the next round's actor
   - Repro: leave word "gate" unsolved at end of round 1; round 2 starts with QA2 showing "gate".
   - Expected: fresh word per actor (or explicit "passed word" indication).
   - Actual: same word silently handed to the next actor.

7. Severity: minor — no per-round results/scoreboard between rounds
   - Repro: rounds 1→2→3 transition straight from acting to acting.
   - Expected: brief round summary (who acted, words guessed).
   - Actual: no intermediate screen; round-score deltas invisible until the game ends. Phones also show no results at game end (only "Team Charades · ended").

## Improvements
- Show on the TV: current actor (name + color), team, words-guessed counter, and a "guess out loud!" hint; show guessers a "You're guessing — <name> is acting" screen.
- Implement real teams: assign/display teams in lobby, credit the guessing team, and show team scores.
- Fix Back to lobby to push phones back to the waiting state.
- Curate word pools per Content/Difficulty setting and remove dare-style prompts; verify 18+ actually swaps the pool.
- Add a "Pass" indication when a word carries over, and a short per-round recap.
- Give the actor visual confirmation on Correct (e.g. flash "+500", running count).

## Screenshots
- qa-party-games/team-charades/host-settings.png
- qa-party-games/team-charades/host-settings-18plus.png
- qa-party-games/team-charades/host-in-round.png
- qa-party-games/team-charades/host-round2.png
- qa-party-games/team-charades/host-ended.png
- qa-party-games/team-charades/player-actor.png
- qa-party-games/team-charades/player-guesser.png
- qa-party-games/team-charades/r2-p0-actor.png
- qa-party-games/team-charades/r2-p1-guesser.png
- qa-party-games/team-charades/r2-p2-guesser.png
- qa-party-games/team-charades/back-to-lobby-phones.png
- qa-party-games/team-charades/back-to-lobby-phones0.png
- qa-party-games/team-charades/back-to-lobby-phones1.png
- qa-party-games/team-charades/back-to-lobby-phones2.png
