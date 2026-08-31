# Friend Sort
Status: issues
Tested: 2026-08-31, players 3 (QA1/QA2/QA3, distinct colors), host TV 1280x800 window + 3 phone tabs in ~500px window, room XVBC, no settings (game has none), 3 rounds played

## What worked
- Host `/host` connected fast; fresh room code shown; 3 players joined via `/join?code=XVBC` with distinct colors and appeared online.
- Friend Sort listed under Party & Teams (3–8 players), selectable with a single "Start game" button — confirmed there is no settings rail for this game.
- Instructions phase auto-advanced (2s) to `assign` without touching "Start round"; phones showed "Look at the TV!" + SCORING text ("+500 when your role assignment matches the majority for a player").
- Assign UI on phones rendered one dropdown per other player (`data-testid=role-sort-assign-*`) with roles Teacher/Athlete/Ninja plus `role-sort-submit`.
- Round auto-advanced to `reveal` as soon as all 3 submitted; TV reveal listed each player's majority role and vote count (e.g. QA2 "Teacher (2 votes)"), then scoreboard, then next round; game ended after round 3/3.
- Scoring matched the stated rule (+500 per majority match); SESSION TOTAL on the lobby/TV correctly showed 1000/500/500 after the game ended.

## Bugs
1. Severity: major — Players stuck on "Friend Sort · ended" after "Back to lobby"
   - Players/settings: 3 players, no settings.
   - Repro: finish game (round 3/3 ended) → host clicks "Back to lobby".
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host returns to lobby ("Pick a game", 3 players connected) but all 3 phones still display "Friend Sort · ended" indefinitely. Two of the three phone tabs also became unresponsive to page screenshots (renderer not painting), suggesting the phone view is wedged, not just stale.
   - Screenshot: /workspace/qa-party-games/friend-sort/back-to-lobby-phones.png, /workspace/qa-party-games/friend-sort/back-to-lobby-phone3.png

2. Severity: major — No submit confirmation on phone
   - Players/settings: 3 players.
   - Repro: on a phone, pick roles in both dropdowns and press "Submit assignments".
   - Expected: locked/"submitted — waiting for others" state.
   - Actual: the phone keeps showing the same editable dropdowns and an active Submit button; nothing indicates the answer was received (verified in rounds 1 and 2).
   - Screenshot: /workspace/qa-party-games/friend-sort/player-after-submit.png

3. Severity: minor — "Round scores" panel shows cumulative game totals
   - Repro: round 2 scoreboard after QA1 scored 1000 in R1 and 0 in R2.
   - Expected: round-2 points (QA1 0, QA2 0, QA3 500).
   - Actual: panel labelled "Round scores" shows 1000 / 500 / 500 (game-cumulative), so a player who scored nothing in the round appears to have scored.
   - Screenshot: /workspace/qa-party-games/friend-sort/host-scoreboard-r2.png

4. Severity: minor — TV is nearly blank during the assign phase
   - Repro: watch the host screen while players assign.
   - Expected: the TV shows the roles in play and who has submitted (couch-party context).
   - Actual: host shows only "Round 1/3 · assign" and the timer — no role list, no player names, no submit progress.
   - Screenshot: /workspace/qa-party-games/friend-sort/host-in-round.png

## Improvements
- Show a per-player submitted/waiting indicator on the TV during assign.
- Lock phone dropdowns after submit and show "Submitted ✓ — waiting for others".
- Label the scoreboard panel correctly (or show the round delta alongside the total).
- On reveal, show what each player guessed vs. the majority so the payoff is readable from the couch.
- The 3-round game has no settings; a round-count option would help pacing.

## Screenshots
- /workspace/qa-party-games/friend-sort/host-settings.png (game selected, no settings rail)
- /workspace/qa-party-games/friend-sort/host-in-round.png
- /workspace/qa-party-games/friend-sort/host-reveal.png
- /workspace/qa-party-games/friend-sort/host-scoreboard-r2.png
- /workspace/qa-party-games/friend-sort/host-final.png
- /workspace/qa-party-games/friend-sort/player-assign.png
- /workspace/qa-party-games/friend-sort/player-after-submit.png
- /workspace/qa-party-games/friend-sort/back-to-lobby-phones.png
- /workspace/qa-party-games/friend-sort/back-to-lobby-phone3.png
