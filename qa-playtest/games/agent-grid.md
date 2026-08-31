# Agent Grid
Status: issues
Tested: 2026-08-31, players 4 (QA1–QA4), host ~775px desktop window (TV) + 4 phone tabs in one ~500px window, room AVJF, settings: Run 1 Content=Family (default), Run 2 Content=18+

## What worked
- Game is present in the live catalog under "Social & Voting" (Agent Grid, 4–12 players, "Spymasters give one-word clues — avoid the assassin").
- Hosting a fresh room, 4 joins with distinct colours, and start all worked; host went straight into the round (auto-advance, no "Start round" tap needed — no instructions screen was shown at all).
- Host settings panel exposes Content Family/18+; 18+ selection is honoured and shown as an "18+" badge on the TV.
- Spymaster/guesser split is implemented and hidden info is respected: TV shows only neutral (uncoloured) word tiles; spymaster phones (2 of 4) show the full colour key + "Clue word" field + "Give clue (2)"; guesser phones show a tappable word list + "End turn".
- Clue submission works: TV shows "Clue: flavour · 2 (Team A)", phase flips clue → guess, and turn/team alternates (Team A → Team B). Roles rotated between Run 1 and Run 2 (QA1/QA4 spymasters → QA1/QA2).
- Assassin works: guesser tapping the black tile ended the round immediately; reveal showed gymnast (blue), spot (red), siege (black assassin), scored 1500 to the opposing team's two players, and SESSION TOTAL correctly accumulated to 1500 for QA2/QA4, 0 for QA1/QA3.

## Bugs
1. Severity major — Guesser phones are blank during the clue phase
   - Players/settings: 4 players, Family and 18+ alike
   - Repro: start Agent Grid → during "clue" phase look at a non-spymaster phone
   - Expected: role/team label ("You are a guesser, Team A"), the grid (greyed), and a "waiting for your spymaster's clue" message
   - Actual: phone shows only the scoreboard strip, timer and "Agent Grid · clue" — the rest of the screen is empty; a player cannot tell what game/role they have
   - Screenshot: /workspace/qa-party-games/agent-grid/player-guess-blank.png
2. Severity major — Clue is never shown on the phones
   - Repro: spymaster submits "flavour · 2" → look at the guessing phone
   - Expected: clue word + number of guesses visible on the guesser's phone
   - Actual: only the TV shows "Clue: flavour · 2 (Team A)"; the guesser's phone shows a bare word list. Couch-only play forces guessers to read the TV, and the remaining-guesses count is invisible to them.
   - Screenshot: /workspace/qa-party-games/agent-grid/player-guess.png
3. Severity major — No live reveal or confirmation after a guess; TV grid does not update until the round ends
   - Repro: guesser taps a tile (e.g. "spot", then "gymnast" next turn)
   - Expected: tapped tile flips to its colour on the TV immediately, guesser gets confirmation, remaining guesses decrement
   - Actual: nothing visibly changes anywhere — tapped tile stays plain on the TV, no toast/haptic/state on the phone, turn simply flips to the other team. The guesses were in fact recorded but only rendered at the very end of the round, so during play players get zero feedback.
   - Screenshot: /workspace/qa-party-games/agent-grid/host-no-reveal-after-guess.png (compare /workspace/qa-party-games/agent-grid/host-reveal-assassin.png)
4. Severity major — One tap ends the whole turn even though the clue allowed 2 guesses
   - Repro: clue "water · 2" → guesser taps one correct (own-colour) tile
   - Expected: with "· 2" the team should keep guessing (or at least see a second guess offered) after a correct tile
   - Actual: phase immediately returns to "clue" for the other team after a single tap; the "· 2" count is meaningless
   - Screenshot: /workspace/qa-party-games/agent-grid/host-in-round.png
5. Severity major — "Back to lobby" leaves all four phones stuck on "Agent Grid · ended"
   - Repro: end round → host "Back to lobby" → host returns to lobby/QR/game picker; check phones
   - Expected: phones return to "Waiting for host to start a game…"
   - Actual: all 4 phones remained on "Agent Grid · ended" indefinitely (>20 s, verified twice); they only recovered when the host started the next game
   - Screenshot: /workspace/qa-party-games/agent-grid/back-to-lobby-phones.png
6. Severity major — 18+ deck contains truncated dare prompts, not word-game words
   - Players/settings: 4 players, Content=18+
   - Repro: host Agent Grid with 18+ → look at the grid
   - Expected: single words/short phrases suitable for one-word clueing
   - Actual: tiles include mid-sentence truncations from another game's dare deck: "Do a handstand while drinking a glass of", "Perform a silly dance using only your fe", "Call a random number and sing them a son", plus "Describe one of your sexual experiences". Unusable as clue targets and visually breaks the grid.
   - Screenshot: /workspace/qa-party-games/agent-grid/host-18plus-bad-words.png
7. Severity minor — No in-game instructions/rules anywhere
   - Repro: start the game
   - Expected: brief rules screen or per-role hint (task asked to read in-game instructions)
   - Actual: game jumps straight to the clue phase; no rules on TV or phones, no role explanation
   - Screenshot: /workspace/qa-party-games/agent-grid/host-in-round.png
8. Severity minor — TV never shows whose turn / which team is guessing outside the clue line, and the unrevealed key is never disclosed at game end
   - Actual: during the clue phase the TV shows only "Round 1/1 · clue"; at "ended" the 22 untapped tiles stay grey so nobody learns the key
   - Screenshot: /workspace/qa-party-games/agent-grid/host-round-scores.png
9. Severity minor — Round-end result is invisible on phones
   - Actual: phones show only "Agent Grid · ended"; win/lose, who hit the assassin and round points appear on the TV only
   - Screenshot: /workspace/qa-party-games/agent-grid/back-to-lobby-phones.png

## Improvements
- Give every phone a persistent role/team header ("Team A · Spymaster" / "Team A · Guesser") and echo the current clue + remaining guesses on guesser phones.
- Reveal tiles on the TV as they are tapped, with a short animation and a "correct / wrong / assassin" callout; disable the grid on phones when it is not that team's turn instead of showing a tappable list.
- Honour the guess count (allow up to N+1 guesses, with an explicit "End turn" that is already present).
- Fix the lobby broadcast so "Back to lobby" resets player clients.
- Filter the 18+ word pool to real words (and stop truncating long entries mid-word).
- Show the full key on the TV once the round ends, and a per-team result card on phones.

## Screenshots
- /workspace/qa-party-games/agent-grid/host-settings.png
- /workspace/qa-party-games/agent-grid/host-in-round.png
- /workspace/qa-party-games/agent-grid/player-clue.png
- /workspace/qa-party-games/agent-grid/player-guess.png
- /workspace/qa-party-games/agent-grid/player-guess-blank.png
- /workspace/qa-party-games/agent-grid/host-no-reveal-after-guess.png
- /workspace/qa-party-games/agent-grid/host-reveal-assassin.png
- /workspace/qa-party-games/agent-grid/host-round-scores.png
- /workspace/qa-party-games/agent-grid/back-to-lobby-phones.png
- /workspace/qa-party-games/agent-grid/host-18plus-bad-words.png
