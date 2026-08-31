# Quick Quiz
Status: issues

Tested: 2026-08-30, live deploy https://party-games.jimb99.workers.dev (hard-reloaded all windows)
Players: 3 (QA1 red, QA2 green, QA3 purple) on /play, ~507px wide windows; host /host/ZXRN in a ~765px window (TV).
Settings exercised:
- Run 1 (defaults): Content Family, Difficulty Mixed, TV display "Question only on TV", Speed scoring "Rank by speed" — full 8-round game.
- Run 2 (same session/room): Difficulty Hard, TV display "Show answers on TV too", Speed scoring "Off (flat points)" — rounds 3-4 played, rest timed out.

## What worked
- Host connected immediately (no lingering "Connecting…"); room code + QR + join URL shown; 3 players listed as online.
- Quick Quiz sits under the "Trivia" category, shows "1–16 players", and starts with 3 players. Instructions/"Get ready!" card + SCORING blurb appear on both TV and phones ("Look at the TV!").
- Question flow works end to end: 8 rounds, question -> reveal -> next round auto-advance, `ended` state with "Play again" / "Back to lobby".
- Question text renders on the TV; phones get the question plus the 4 tappable options. Taps register (host reveal lists each player's chosen option).
- TV display setting works: "Question only on TV" shows just the question ("Answer on your phone!"); "Show answers on TV too" additionally lists all four options on the TV.
- Difficulty setting works: Hard produced noticeably harder/longer questions and a longer timer (25s vs ~15s on Mixed).
- Speed scoring "Rank by speed" works *within* a round: three correct answers ~2.5s apart scored 1st +1000 / 2nd +513 / 3rd +25, and the header re-sorted the players.
- Speed scoring "Off (flat points)" works: all three correct answers got a flat +1000.
- Reveal is clear on the TV: per-player pick with +points and ✓/✗, plus "Correct: <answer>".
- Late/no answer handled gracefully: a player who never taps simply gets no row and no points; the round still resolves.
- Phone recovers correctly on manual reload (goes back to "Waiting for host to start a game…"), so the stuck states below are push/state-broadcast bugs, not client crashes.

## Bugs

1. Severity: blocker — In-game score does not accumulate across rounds; final scoreboard is all zeros
   - Players/settings: 3 players, both runs (Rank by speed AND Off).
   - Repro: Play several rounds and answer correctly in more than one round. Run 1: round 5 QA3 +1000, round 6 QA1 +1000 / QA2 +513 / QA3 +25. Run 2: round 3 all three +1000, round 4 all three +1000.
   - Expected: header "g" score sums a player's points for the whole game (e.g. QA1 1000 after r3, 2000 after r4), and the end screen "Round scores" shows those totals.
   - Actual: the header "g" value only ever shows the *current round's* points and resets to 0g on the next round. At game end "Round scores" reads QA3 0, QA1 0, QA2 0 for everyone, despite thousands of points awarded during the game. The game therefore has no winner.
   - Screenshot: qa-party-games/quick-quiz/host-reveal-run2.png, qa-party-games/quick-quiz/host-ended.png

2. Severity: major — SESSION TOTAL never accumulates (same bug as Fact Check)
   - Players/settings: 3 players, both runs.
   - Repro: Session started with carried-over totals QA1 4000Σ / QA2 2000Σ / QA3 1000Σ. Play a full 8-round Quick Quiz with points awarded, let it end, return to lobby.
   - Expected: session totals grow by the points earned in Quick Quiz.
   - Actual: SESSION TOTAL stayed exactly 4000 / 2000 / 1000 during the game, at `ended`, and back in the lobby. Zero contribution from Quick Quiz.
   - Screenshot: qa-party-games/quick-quiz/back-to-lobby-host.png

3. Severity: major — "Back to lobby" does not return phones to waiting (same bug as Fact Check / Wit Showdown)
   - Players/settings: 3 players, default run, clicked from the `ended` screen.
   - Repro: Finish the game, click "Back to lobby" on the host.
   - Expected: all three phones switch to "Waiting for host to start a game…".
   - Actual: host returns to the lobby / "Pick a game", but all three phones stay frozen on "Quick Quiz · ended" indefinitely. Only a manual phone reload unsticks them.
   - Screenshot: qa-party-games/quick-quiz/back-to-lobby-phone.png (phone) + qa-party-games/quick-quiz/back-to-lobby-host.png (host)

4. Severity: major — No answer confirmation on the phone; answer is silently re-tappable
   - Players/settings: 3 players, both runs.
   - Repro: On a phone, tap an option during a question and keep watching the screen.
   - Expected: the tapped option is highlighted/locked, other options disabled, and some "Answer locked in — waiting for others" state.
   - Actual: nothing changes at all. Same background colour on the picked option, no ✓, no text, `disabled` stays false on every button, and the question + all four options remain fully tappable. A player cannot tell whether their tap registered (it did — the host reveal shows it), which on a real couch phone means repeated tapping.
   - Screenshot: qa-party-games/quick-quiz/player-answer.png

5. Severity: minor — Phone shows nothing during reveal for a player who did not answer / early rounds
   - Players/settings: 3 players, default run, round 1 (nobody answered).
   - Repro: Let a question time out with no answers.
   - Expected: phone shows the correct answer and "you didn't answer".
   - Actual: phone body is just "Quick Quiz · reveal" with an empty area; the correct answer only exists on the TV. (When someone did answer, the phone mirrors the TV's per-player list, which is fine.)
   - Screenshot: qa-party-games/quick-quiz/host-reveal.png (TV had the answer; phone blank)

6. Severity: minor — Host "Waiting for players… (N)" counter appears to stay at 0
   - Players/settings: 3 players, default run.
   - Repro: During a question, watch the TV line while players tap.
   - Actual: observed "Waiting for players… (0)" on the TV; no visible per-player "answered" indicator on the TV before reveal, so the host can't tell who still needs to answer.

7. Severity: minor — Only the first answer button has a data-testid
   - Repro: inspect /play during a question.
   - Expected: player-answer-0..3.
   - Actual: only `data-testid="player-answer-0"` exists; options 1-3 have no test id, so automated/QA tapping of any option other than the first has to fall back to class matching.

8. Severity: minor — Phone scoreboard strip is clipped/horizontally scrollable at phone widths
   - Players/settings: ~507px player window (the /play page has a ~500px min-width, so a true 390px phone overflows).
   - Actual: the QA1/QA2/QA3 score chips row overflows with a horizontal scrollbar and the third player's total is cut off ("100…" instead of "1000Σ"). At a real 390px viewport the whole page would overflow horizontally.
   - Screenshot: qa-party-games/quick-quiz/player-answer.png

## Improvements
- Show the correct answer on every phone at reveal, plus that player's own result ("✓ +1000", "✗", "no answer") — right now the phone is a dumb terminal at the most rewarding moment.
- Lock/highlight the selected option on the phone and show a "locked in / waiting for N others" state.
- Put a per-round leaderboard delta on the TV at reveal and a proper final podium at game end (once bug 1 is fixed).
- Show "3/3 answered" on the TV during a question so the host knows when to skip.
- The default question timer on Mixed (~15s) is tight for reading a long question aloud on a TV; consider ~20s default or scaling the timer with question length.
- Add data-testids for all answer buttons and for reveal/score elements to make automation reliable.
- Make /play responsive down to ~360px so real phones don't overflow.

## Screenshots
- qa-party-games/quick-quiz/host-lobby.png
- qa-party-games/quick-quiz/host-settings.png (Run 1 defaults: Family / Mixed / Question only on TV / Rank by speed)
- qa-party-games/quick-quiz/host-in-round.png
- qa-party-games/quick-quiz/host-reveal.png
- qa-party-games/quick-quiz/player-answer.png (after tapping — no confirmation)
- qa-party-games/quick-quiz/player-waiting.png (phone after manual reload)
- qa-party-games/quick-quiz/host-ended.png (final "Round scores" all 0)
- qa-party-games/quick-quiz/back-to-lobby-host.png
- qa-party-games/quick-quiz/back-to-lobby-phone.png (phone stuck on "Quick Quiz · ended")
- qa-party-games/quick-quiz/host-settings-run2.png (Hard / Show answers on TV too / Off)
- qa-party-games/quick-quiz/host-in-round-showanswers.png
- qa-party-games/quick-quiz/host-reveal-run2.png
