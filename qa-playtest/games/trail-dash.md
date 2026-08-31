# Trail Dash
Status: issues

Tested: 2026-08-31, room RBRV on https://party-games.jimb99.workers.dev/, 2 human players (QA1 red, QA2 blue) on phone-sized tabs (~505x710) + TV host window (~770x800) on a 1280x800 desktop.
Settings tested — Run 1: defaults (Round time 90, Rounds 3, Bots 0, Bot difficulty Medium, Coin value 50, Rank point scale 1, Power-ups Normal). Run 2: Rounds 1, Bots 3, Power-ups Chaos (rest default).

## What worked
- Trail Dash is present in the catalog under Arcade ("1–8 players (+ bots)") and is startable with only 2 humans and 0 bots (no gating).
- Full settings rail renders and all fields are editable: Round time (sec), Rounds, Bots, Bot difficulty (Easy/Medium/Hard), Coin value, Rank point scale, Power-ups (Off/Normal/Chaos). Screenshot: host-settings.png
- Instructions screen auto-advances into play without needing "Start round" — Coins card (+50 pts each = coin value setting) and a POWER-UPS list are shown on both TV and phones.
- Power-ups = Chaos visibly changed content: the instructions power-up list expanded from Speed/Ghost (Normal) to Speed, Ghost, Double Jump, Missile, Grenade, Burst, and power-up pickups were visible on the arena floor during Run 2. Setting change confirmed.
- Bots = 3 works: Bot 1/Bot 2/Bot 3 spawned, drove sensible avoidance lines, picked up coins with "+50"/"+100" floaters shown on the TV board. Trails, arena walls, coins and score floaters all render correctly on the TV. Screenshot: host-in-round.png
- Phones get a controls pad (◀ / ▶ plus Jump / Fire) and the live scoreboard/timer strip.

## Bugs
1. Severity: blocker — Host TV falls out of the running game back to the lobby and wipes SESSION TOTAL
   - Players/settings: 2 humans + 3 bots, Rounds 1, Round time 90, Power-ups Chaos (Run 2)
   - Repro: Host /host, join 2 phones, pick Trail Dash, Bots 3, Power-ups Chaos, Start game, let the round run ~30–60 s while tapping turn controls on a phone.
   - Expected: TV keeps showing the arena until the round ends, then shows the reveal; session totals persist.
   - Actual: mid-round the TV jumped back to the join-code/"Pick a game" lobby, and SESSION TOTAL reset from QA2 3000 / QA1 75 to 0 / 0, while both phones stayed on "Trail Dash · playing" with live controls.
   - Screenshot: bug-host-lobby-midround.png, bug-phones-stuck-playing.png

2. Severity: major — Phones stuck after the game ends / after "Back to lobby"
   - Players/settings: 2 humans, defaults (Run 1)
   - Repro: finish the 3-round game, click "Back to lobby" on the host.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: both phones stayed on "Trail Dash · ended" indefinitely; after the Run 2 desync they were stuck on "Trail Dash · playing" with Time 0s and an active control pad but no game.
   - Screenshot: back-to-lobby-phones.png, bug-phones-stuck-playing.png

3. Severity: major — Round-end panel labelled "Round scores" actually shows cumulative session totals
   - Players/settings: 2 humans, defaults, 3 rounds
   - Repro: play the 3 rounds; watch the per-player pill after each round.
   - Expected: "Round scores" = points earned in that round.
   - Actual: QA2 1000 after R1, 2000 after R2, 3000 after R3 and the final "Round scores" panel reads QA2 3000 / QA1 75 — i.e. the running total, matching the SESSION TOTAL. Same accumulating-Σ family as the Last on the Dike doubled-Σ bug.
   - Screenshot: host-reveal.png

4. Severity: major — Human riders die instantly / turn controls appear to do nothing
   - Players/settings: both runs
   - Repro: start a round and tap ◀ / ▶ on a phone within the first seconds.
   - Expected: the rider turns 90° and the trail bends.
   - Actual: in Run 1 both humans crashed within ~2 s of the round start (round 1 of 3 was over before a single control tap registered; the whole 3-round game finished in <20 s). In Run 2 both human trails stopped growing almost immediately and stayed frozen at the same spot while only bots kept playing; repeated ◀/▶ taps produced no visible change of heading. Scoring reflected this: QA1 25/50/75, QA2 1000/2000/3000 with nobody steering.
   - Screenshot: host-in-round.png, player-controls.png

5. Severity: minor — Phone pad shows irrelevant Jump / Fire buttons
   - Trail Dash only needs turn-left/turn-right; a large amber "Jump" and a disabled-looking "Fire" dominate the pad and mislead players.
   - Screenshot: player-controls.png

6. Severity: minor — Round-time display of unclear fidelity
   - Round time is 90 s but rounds visibly resolved far faster than 90 real seconds; the timer also appeared to skip large chunks (80s → 70s → 43s across a few seconds of interaction). Frame captures at 2 fps did show a normal 1 s/s tick early in the round, so this may be tied to bug 1/4 rather than the clock itself — worth instrumenting.

## Improvements
- Give the round a visible 3-2-1 countdown after the instructions so players are not dead before they know play started.
- Label the end-of-round panel "Total" or show both "This round" and "Session total".
- Hide Jump/Fire for Trail Dash, and enlarge/hold-to-steer the turn buttons; consider a hold-to-turn or tap-both-halves-of-screen scheme.
- Show which power-up a rider currently holds on the phone.
- Recover phone state from the server on any host state change so a lobby return never leaves phones stranded.

## Screenshots
- /workspace/qa-party-games/trail-dash/host-settings.png
- /workspace/qa-party-games/trail-dash/run2-settings.png
- /workspace/qa-party-games/trail-dash/player-controls.png
- /workspace/qa-party-games/trail-dash/host-in-round.png
- /workspace/qa-party-games/trail-dash/host-reveal.png
- /workspace/qa-party-games/trail-dash/back-to-lobby-phones.png
- /workspace/qa-party-games/trail-dash/bug-host-lobby-midround.png
- /workspace/qa-party-games/trail-dash/bug-phones-stuck-playing.png
