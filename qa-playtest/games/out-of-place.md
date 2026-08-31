# Out of Place
Status: issues (blocked — game not present on live site)
Tested: 2026-08-31, players 4 (QA1–QA4 joined, distinct colors), host TV window ~770px + phone window ~500px, settings: n/a (game never reachable)

## What worked
- Hard reload of all Chrome windows, fresh host room created via /host (code CYEV). "Connecting…" cleared; "Connected" + "Pick a game" visible.
- All four phones joined /join?code=CYEV successfully, each shows "Waiting for host to start a game…", all listed "online" and "4 players connected" on the TV. SESSION TOTAL correctly reset to 0 for all four in the new room.

## Bugs
- Severity: blocker
  - Players/settings: 4 players (QA1–QA4), fresh room CYEV, live site https://party-games.jimb99.workers.dev/
  - Repro: Host /host, join 4 players, expand/read the full game catalog on the TV (all 7 category sections; catalog reports 31 games).
  - Expected: an "Out of Place" game card (hidden-role, 4–8 players) selectable, with a settings rail (possibly a category option all/places/things/jobs/random).
  - Actual: "Out of Place" does not exist anywhere in the deployed catalog. Full catalog text contains: Fact Check, Wit Showdown, Would You Rather, Caption This, Impostor, Reverse Fact, Hot Seat, Split the Room, Spectrum, Star Rate, Agent Grid, Bracket Battle, Friend Sort, Team Charades, Last on the Dike, Crowd Call, Forbidden Clue, Quick Quiz, When Was It, Draw & Guess, Chain Sketch, Trail Dash, Word Rush, Block Stack, Hangman Race, Paddle Clash, Grid Blast, Fleet Duel, Four in a Row, Tic-Tac-Toe — no "Out of Place". The session-playlist picker also lists no such game. Searching the served client bundle (/assets/index-BgALBX2G.js) for "out of place"/"outOfPlace"/"out-of-place" returned no matches.
  - Consequence: none of Run 1 steps 3–5 or Run 2 could be executed — no settings rail, no round, no accuse/reveal, no scoring, no back-to-lobby check.
  - Screenshot: /workspace/qa-party-games/out-of-place/host-catalog-no-out-of-place.png

## Improvements
- Either deploy the Out of Place game or remove it from the QA catalog/test plan so testers don't chase a non-existent game.
- Add a game search/filter box on the host catalog; with 31 games across 7 collapsible sections, confirming presence/absence of a title requires expanding everything.

## Screenshots
- /workspace/qa-party-games/out-of-place/host-catalog-no-out-of-place.png (full-page host catalog, room CYEV, 4 players connected, no Out of Place entry)
