# Impostor
Status: issues
Tested: 2026-08-31, players 4 (QA1–QA4), host TV ~770×800 Chrome window + phone tabs ~500px window, no settings (game exposes none)

## What worked
- Fresh room hosted via /host (code JYGB); "Connecting…" cleared, "Pick a game" visible, 4 players joined with distinct colors.
- Impostor card selectable at 4 players; selecting it reveals only a "Start game" button — confirmed **no settings rail** exists.
- Role assignment correct every round: exactly 3 phones showed the shared secret word, 1 phone showed "You are the stranger!" (R1 QA1, R2 QA2, R3 QA4, R4 QA4).
- TV did NOT spoil the secret during questioning — host showed only the category ("Places", "Things", "Jobs"); the word appeared on TV only at reveal (correct).
- Instructions screen auto-advanced (no need to click "Start round"); phones showed "Look at the TV!" + scoring rules.
- Timer accurate: host/phones dropped 328s→288s over 40.5s real time.
- Impostor guess flow works: clicking "Guess: Police Station" (correct) immediately ended the round, awarded +400g, revealed secret + stranger on TV.
- 4 rounds ran automatically; end screen showed "Round scores" with Play again / Back to lobby; Back to lobby returned the TV to the lobby with SESSION TOTAL.

## Bugs
1. Severity: major — Crew players have NO accuse/vote UI
   - Players/settings: 4 players, no settings
   - Repro: Start Impostor → inspect the 3 crew phones during "questioning".
   - Expected: Host TV says "Use phones to accuse or guess", so crew phones should offer accuse/vote buttons.
   - Actual: Crew phones show only the secret word; the only button on the page is the name "edit" control. Only the impostor has actionable buttons (guess list). Crew can never catch the stranger, so the "Others +200 if spy is caught" scoring path is unreachable.
   - Screenshot: /workspace/qa-party-games/impostor/player-crew.png (compare /workspace/qa-party-games/impostor/player-impostor.png)

2. Severity: major — Round scores do not accumulate across rounds / SESSION TOTAL wrong
   - Players/settings: 4 players, 4 automatic rounds
   - Repro: R1 QA1 uncaught +200; R2 QA2 correct guess +400; R3 QA4 +200; R4 QA4 +200. Read end screen and lobby SESSION TOTAL.
   - Expected: cumulative totals ≈ QA1 200, QA2 400, QA4 400, QA3 0.
   - Actual: each round resets gold to 0 for everyone; end "Round scores" listed only QA4 200 / others 0, and lobby SESSION TOTAL is QA4 200, QA1 0, QA2 0, QA3 0 — three rounds of earnings lost. Also QA4 200g in R3 then 200g again in R4 still displayed as 200g (not 400).
   - Screenshot: /workspace/qa-party-games/impostor/host-ended-scores.png, /workspace/qa-party-games/impostor/back-to-lobby-phones.png

3. Severity: major — "Back to lobby" leaves phones stuck AND keeps spoiling the secret
   - Players/settings: 4 players
   - Repro: at game end click "Back to lobby" on host; watch phones for 35s+.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: all 4 phones stay on "Impostor · ended" showing the last secret word ("Artist") and the impostor's phone still reads "You are the stranger!"; no auto-recovery after 35s. Host is already in the lobby.
   - Screenshot: /workspace/qa-party-games/impostor/back-to-lobby-phones.png

4. Severity: minor — Player-count/category metadata mismatch with spec
   - Repro: read Impostor card in host lobby.
   - Expected (spec): min 4, max 10, category Party & Teams.
   - Actual: card reads "4–8 players" and is listed under "Social & Voting".
   - Screenshot: /workspace/qa-party-games/impostor/host-settings.png

5. Severity: minor — No confirmation/outcome text on reveal
   - Repro: impostor guesses correctly; look at reveal on TV and phones.
   - Expected: e.g. "Stranger guessed correctly!" / "Stranger escaped" plus per-round points explanation.
   - Actual: reveal shows only "Secret: X" and "Stranger was Y"; no indication of how the round ended or why points were given; phones show no confirmation that their guess registered beyond the score chip.
   - Screenshot: /workspace/qa-party-games/impostor/host-reveal.png

6. Severity: minor — Same player can be the stranger in consecutive rounds (QA4 in R3 and R4), which is noticeable with only 4 players.

## Improvements
- Give crew phones an accuse/vote list (and a majority-vote resolution) so the advertised "accuse" mechanic and the crew scoring path work.
- Show remaining rounds and a running session leaderboard on the TV between rounds.
- Clear phone screens (or show a neutral "round over" card) as soon as the host leaves the game, so secrets aren't left on screen.
- Add outcome copy on reveal (caught / escaped / correct guess) and a per-round points breakdown.
- Impostor guess list is 24 buttons with no search — add a filter/search field on the phone.

## Screenshots
- /workspace/qa-party-games/impostor/host-settings.png
- /workspace/qa-party-games/impostor/host-in-round.png
- /workspace/qa-party-games/impostor/host-round2-instructions.png
- /workspace/qa-party-games/impostor/host-reveal.png
- /workspace/qa-party-games/impostor/host-ended-scores.png
- /workspace/qa-party-games/impostor/player-crew.png
- /workspace/qa-party-games/impostor/player-impostor.png
- /workspace/qa-party-games/impostor/back-to-lobby-phones.png
- /workspace/qa-party-games/impostor/round1-QA1.png
- /workspace/qa-party-games/impostor/round1-QA2.png
- /workspace/qa-party-games/impostor/round1-QA3.png
- /workspace/qa-party-games/impostor/round1-QA4.png
- /workspace/qa-party-games/impostor/backlobby-QA3.png
