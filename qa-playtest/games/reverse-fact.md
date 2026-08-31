# Reverse Fact
Status: issues
Tested: 2026-08-30, 3 players (QA1/QA2/QA3, distinct colors), host 880x800 + phones 395x800, Run 1 defaults (Difficulty Mixed, Speed scoring Rank by speed, 5 rounds), Run 2 (Difficulty Hard, Speed scoring Off, 1 round + mid-game abort)

## What worked
- Host connected fast (code AJXR), "Pick a game" visible, Reverse Fact listed under Social & Voting as "Write the question that fits the fact" (2–16 players).
- Settings picker: Difficulty (Mixed/Easy/Medium/Hard) and Speed scoring (Rank by speed / Off (flat points)) selects; no content-rating toggle, as expected.
- Rules work as advertised (reverse-Jeopardy): a fact/answer is shown ("The ability to acquire and develop skills"), each phone writes the *question* that fits, then everyone votes among all submitted questions + the real one. Instruction card states scoring: "+1000 for voting the real question; +500 to the author of a fake you voted for."
- Full phase cycle ran cleanly for 5 rounds + a 6th round in Run 2: instructions → submit → vote → reveal → scoreboard → ended.
- Reveal is clear: marks "Real answer", shows "Written by X" per fake and which players voted for each.
- Scoring math per round is correct: voter of the real question +1000, fake author +500 per vote received (e.g. QA1 1500 in R1).
- Speed scoring works and is switchable: with Rank by speed, a slower correct voter got 513 instead of 1000; with Off (flat points) both correct voters got the full flat 1000/1500. Confirmed change took effect.
- Difficulty Hard produced noticeably harder/obscure trivia prompts (WWII battle, Petaluma CA wrist-wrestling, Super Bowl XII MVP) vs Mixed.
- Timer accuracy is correct here: measured host countdown 42s → 32s over 10.00s real time (no 3x drift like Would You Rather).
- If a player doesn't submit, the vote list is still filled with decoy questions and the round completes (no hang).
- Late/typed answers were not dropped; no stale answer text seen (no repeat of Fact Check's stale-text bug).

## Bugs
1. Severity: major — Round scores / SESSION TOTAL do not accumulate across rounds
   - Players/settings: 3 players, Run 1 defaults, 5 rounds.
   - Repro: play round 1 (QA1 = 1500g), then round 2. After round 2 header shows QA1 500g, QA2 500g, QA3 500g; after rounds 3–5 the "g" column always equals just the last round's score. At game end the "ended" screen shows QA2 1500 / QA3 500 / QA1 0 = round 5 only, and SESSION TOTAL is set to those same last-round values (QA2 1500Σ, QA3 500Σ, QA1 0Σ) instead of a 5-round sum (QA1 alone had earned 1500+500+500+500+0).
   - Expected: "g" = cumulative points this game; SESSION TOTAL = sum over rounds/games.
   - Actual: both reflect only the most recent round; earlier rounds are discarded.
   - Screenshot: /workspace/qa-party-games/reverse-fact/r2-host-scoreboard.png, r5-host-scoreboard.png, host-game-end.png
2. Severity: major — "Back to lobby" leaves phones stuck
   - Players/settings: any; reproduced both after game end (Run 1) and mid-round (Run 2 vote phase).
   - Repro: host clicks Back to lobby (confirm "Return to lobby?" → OK). Host returns to lobby/QR screen; all three phones remain on the old game screen ("Reverse Fact · ended", or frozen vote list with Time 0s) and never return to "Waiting for host to start a game…". Only a manual page reload recovers them.
   - Expected: phones follow host back to lobby.
   - Actual: phones stuck on stale game view.
   - Screenshot: /workspace/qa-party-games/reverse-fact/back-to-lobby-phones.png, host-back-to-lobby.png
3. Severity: major — No tap/submit confirmation on phones
   - Repro: on vote, tap an option → chosen option gets no highlight/checkmark/"Vote locked" state; screen looks identical to before the tap. On submit, after pressing Submit the textarea + Submit button remain with no "Submitted / waiting for others" state. Impossible to tell on the phone whether input registered (host counter is the only feedback).
   - Expected: selected option highlighted / disabled, and a submitted confirmation state.
   - Actual: no visible change on the phone.
   - Screenshot: /workspace/qa-party-games/reverse-fact/player-vote-after.png, player-submit.png
4. Severity: minor — Game-end screen has no winner declaration
   - Repro: finish all 5 rounds. "ended" screen shows a list still titled "Round scores" plus "Play again"; no "Winner"/"1st place" banner and no final game totals.
   - Expected: winner announced with final cumulative standings.
   - Actual: last-round score list only.
   - Screenshot: /workspace/qa-party-games/reverse-fact/host-game-end.png
5. Severity: minor — Abandoned round's points vanish
   - Repro: Run 2, abort mid-round via Back to lobby after round 1 was scored (QA1 1500g). Lobby SESSION TOTAL shows QA2 1500 / QA3 500 / QA1 0 — QA1's Run-2 round-1 points never reach the session total (side effect of bug 1).
   - Screenshot: /workspace/qa-party-games/reverse-fact/host-back-to-lobby.png

## Improvements
- Show phase name/instructions on the phone during submit ("Write the question for this answer"); currently the phone only repeats the fact and a bare Submit button.
- Add a "Submitted ✓ waiting for others (2/3)" state and vote-locked highlight on phones.
- Label the header numbers ("this game" / "session") in the UI; g/Σ is cryptic.
- Reveal screen could show the +points delta next to each player, not just who voted.
- Host confirm dialog uses a native window.confirm; an in-app modal would fit the TV layout better.

## Screenshots
- /workspace/qa-party-games/reverse-fact/host-settings.png (Run 1 defaults)
- /workspace/qa-party-games/reverse-fact/host-settings-run2.png (Hard + flat points)
- /workspace/qa-party-games/reverse-fact/host-in-round.png
- /workspace/qa-party-games/reverse-fact/host-vote.png
- /workspace/qa-party-games/reverse-fact/host-reveal.png
- /workspace/qa-party-games/reverse-fact/player-submit.png
- /workspace/qa-party-games/reverse-fact/player-submit-typed.png
- /workspace/qa-party-games/reverse-fact/player-vote.png
- /workspace/qa-party-games/reverse-fact/player-vote-after.png
- /workspace/qa-party-games/reverse-fact/r2-host-submit.png
- /workspace/qa-party-games/reverse-fact/r2-host-reveal.png
- /workspace/qa-party-games/reverse-fact/r2-host-scoreboard.png
- /workspace/qa-party-games/reverse-fact/r3-host-submit.png
- /workspace/qa-party-games/reverse-fact/r3-host-reveal.png
- /workspace/qa-party-games/reverse-fact/r3-host-scoreboard.png
- /workspace/qa-party-games/reverse-fact/r4-host-scoreboard.png
- /workspace/qa-party-games/reverse-fact/r5-host-scoreboard.png
- /workspace/qa-party-games/reverse-fact/run2-host-submit.png
- /workspace/qa-party-games/reverse-fact/run2-host-reveal.png
- /workspace/qa-party-games/reverse-fact/run2-host-scoreboard.png
- /workspace/qa-party-games/reverse-fact/host-game-end.png
- /workspace/qa-party-games/reverse-fact/player-game-end.png
- /workspace/qa-party-games/reverse-fact/back-to-lobby-phones.png
- /workspace/qa-party-games/reverse-fact/host-back-to-lobby.png
