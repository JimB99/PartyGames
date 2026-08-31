# Chain Sketch
Status: issues (blocker — effectively unplayable on phones)
Tested: 2026-08-31, players 3 (QA1/QA2/QA3, distinct colors), host 1280x800-ish TV window + 3 player tabs in a ~500px-wide window, live site https://party-games.jimb99.workers.dev/, room PJFP. Run 1: Content=Family, Difficulty=Mixed (defaults). Run 2: Content=18+, Difficulty=Mixed.

## What worked
- Lobby/host: fresh room via /host connected fast; 3 phones joined with distinct names+colors.
- Game card shows correct player range (3–8) and options panel (Content Family/18+, Difficulty select). Screenshot: host-settings.png.
- Instructions screen auto-advanced (~2s) with no need to click "Start round" — good, no repeat of the Bracket Battle trap.
- Chain flow logic is correct server-side: draw → guess → draw → guess → reveal, turn passes QA1→QA2→QA3, and a submitted guess correctly becomes the next drawer's prompt ("a spiky star" propagated).
- Drawing input itself works once the canvas renders: mouse drags on the SVG `[data-testid=draw-canvas]` produced strokes; "Done drawing" exists and immediately advances the phase (no burned 60s, unlike Draw & Guess).
- Guess submit works and advances the phase immediately.
- Reveal screen on TV lists the whole chain, and round/session scoreboard rendered.

## Bugs
1. Severity: blocker — Player screens render nothing during draw/guess phases (no live update on phase change)
   - Players/settings: 3 players, both Family and 18+.
   - Repro: Host starts Chain Sketch. As soon as the instructions phase ends, every phone shows only header + timer + "Chain Sketch · draw" and nothing else. The drawer has no canvas, guessers have no input. DOM contains no draw-canvas at all.
   - Expected: the current drawer gets the canvas + prompt; others get a waiting state.
   - Actual: blank body below the timer; UI only appears after a manual browser reload (see bug 2).
   - Screenshot: player-canvas.png (drawer QA2, blank), run2-drawer-blank.png (18+ run, blank even after reload).
2. Severity: blocker — Reload is required after every phase change; in Run 2 even reload did not help
   - Repro: during a draw phase, reload the phone → the drawer now sees "Draw: <prompt>", pen tools, canvas, Done drawing. Every subsequent phase goes blank again until reloaded. In Run 2 (18+), reloading all three phones during the draw phase and again during the guess phase produced blank screens for all 3 players, so the round could not be played at all.
   - Expected: phase changes push new UI over the socket without reload.
   - Actual: stale/blank render; sometimes unrecoverable.
   - Screenshot: run2-drawer-blank.png
3. Severity: blocker — Guesser never sees the drawing
   - Repro: Run 1, guess phase, phone reloaded so UI renders. Screen shows "What is this?" + empty textarea + Submit guess, with no image of the previous player's sketch. TV also shows an empty panel.
   - Expected: the previous drawing is shown to the guesser (and/or on the TV).
   - Actual: no drawing anywhere — the guess is a blind guess.
   - Screenshot: player-guess.png, host-draw-blank.png
4. Severity: major — Seed prompt is missing ("?")
   - Repro: Run 1 round 1, first drawer's phone shows "Draw: ?" and TV shows "Prompt: ?". Reveal chain begins "🎨 (empty)  💬 → ?".
   - Expected: a real Family-content prompt for the first drawer.
   - Actual: literal "?" — the chain starts from nothing, so nothing can be scored fairly.
   - Screenshot: host-reveal.png
5. Severity: major — Reveal shows no drawings, only text
   - Repro: end of round 1, TV reveal.
   - Expected: chain rendered as prompt → sketch image → guess → sketch image → guess.
   - Actual: rows with palette/speech icons and text only; the sketches players made are never displayed.
   - Screenshot: host-reveal.png
6. Severity: major — TV shows the active prompt in plain text during the round
   - Repro: after the first guess, host TV displays "Prompt: a spiky star" during the draw AND the following guess phase.
   - Expected: prompt hidden from the room (it's the answer the next player must guess).
   - Actual: spoiled on the shared screen.
   - Screenshot: host-in-round.png
7. Severity: major — "Back to lobby" leaves phones stuck (known cross-game bug, reproduces here)
   - Repro: Run 1 end-of-round → host "Back to lobby". Host returns to "Pick a game"; all 3 phones remain on "Chain Sketch · ended" indefinitely.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: stuck; need a manual reload.
   - Screenshot: back-to-lobby-phones.png
8. Severity: minor — Scoring looks wrong/incomplete
   - Repro: Run 1 completed chain; round scores QA2 500, QA3 0, QA1 0 even though QA1 and QA3 both drew/guessed and the final guess exactly matched.
   - Expected: points for correct propagation for multiple players ("+500 for starting the chain" alone is thin).
   - Actual: only one player scored; session total then carried 500 correctly into the lobby.
   - Screenshot: host-reveal.png
9. Severity: minor — No submit confirmation on phones
   - Repro: submit a guess / press Done drawing.
   - Expected: "Submitted, waiting for others" state.
   - Actual: screen just goes blank (compounded by bug 1).
   - Screenshot: player-after-submit.png

## Improvements
- Render a "waiting — QA2 is drawing" card for non-active players instead of an empty page.
- Show the incoming sketch above the guess box, and mirror the current sketch live on the TV (that's the whole fun of a couch game).
- Hide the current prompt on the TV during play; only reveal it in the recap.
- Show the actual sketches in the reveal, animated step by step.
- Award points along the chain (correct guess, best drawing vote) rather than a flat +500 to the starter.

## Screenshots
- /workspace/qa-party-games/chain-sketch/host-settings.png
- /workspace/qa-party-games/chain-sketch/host-settings-18plus.png
- /workspace/qa-party-games/chain-sketch/host-in-round.png
- /workspace/qa-party-games/chain-sketch/host-draw-blank.png
- /workspace/qa-party-games/chain-sketch/host-reveal.png
- /workspace/qa-party-games/chain-sketch/player-canvas.png
- /workspace/qa-party-games/chain-sketch/player-guess.png
- /workspace/qa-party-games/chain-sketch/player-after-submit.png
- /workspace/qa-party-games/chain-sketch/run2-drawer-blank.png
- /workspace/qa-party-games/chain-sketch/back-to-lobby-phones.png
