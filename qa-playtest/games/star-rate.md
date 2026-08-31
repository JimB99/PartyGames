# Star Rate
Status: issues

Tested: 2026-08-31, room QZYQ (fresh via /host), 3 players (QA1 red, QA2 green, QA3 blue), host window ~775x800, player window ~500x800 (3 tabs), settings: Run 1 = defaults (Content Family, Difficulty Mixed, 4 rounds fixed); Run 2 = Content 18+, Difficulty Mixed.

## What worked
- Host created a fresh room, showed code/QR, reached "Connected" and "Pick a game" with no "Connecting…" hang.
- All 3 players joined via /join?code=QZYQ with distinct colors and appeared in the host roster + SESSION TOTAL.
- Star Rate listed under Social & Voting with "3–16 players"; game options panel exposes Content (Family/18+) and Difficulty (Mixed).
- Game flow ran end-to-end: instructions → submit → rate → scoreboard → next round, 4 rounds, then "ended" with "Play again" / "Back to lobby".
- Answers submitted on a phone did reach the host and were shown in the rate phase; star taps did register server-side (round score awarded).
- Star rating UI on phones renders 5 tappable stars per answer; players rated with different values (4★, 2★, 5★, 3★).
- Timer accuracy is correct: host showed 43s → 27s over ~16s of wall time (~1x), no drift like Crowd Call/Hangman/WYR.
- TV (host) was never blank during play — prompt, answers and round scores were always rendered.
- 18+ setting works: host shows a red "18+" badge and prompts change (Family: "Nobody knows I once tried fire eating" → 18+: "Have you ever cheated on a partner").
- SESSION TOTAL does carry across games in a session (QA1 kept 1500Σ into Run 2).

## Bugs
1. Round scores do not accumulate within a game — only the last round counts
   - Severity: blocker
   - Players/settings: 3 players, defaults (Family, Mixed, 4 rounds)
   - Repro: R1 QA3 answered, was rated 4★+2★ → QA3 1500. R2 QA2 answered, rated 5★ → QA2 1500 and QA3's 1500 reset to 0. R4 QA1 answered, rated 3★ → final game score QA1 1500, QA2 0, QA3 0.
   - Expected: per-round scores add up across the 4 rounds; final game total = sum of rounds; SESSION TOTAL reflects it.
   - Actual: each round overwrites the game score; earlier rounds' points are lost. Session total only received round 4's 1500.
   - Screenshot: /workspace/qa-party-games/star-rate/bug-scores-not-accumulating.png, host-game-end.png
2. Score is a flat 1500 regardless of star rating
   - Severity: major
   - Players/settings: 3 players, defaults
   - Repro: R1 answer rated 4★ and 2★ (avg 3) → 1500. R2 answer rated 5★ → 1500. R4 answer rated 3★ → 1500.
   - Expected: score scales with the average star rating; per the in-game rules screen "+1500 for highest average rating, +400 for participating" the raters/other submitters should also get +400.
   - Actual: the sole/highest-rated answer always gets exactly 1500 and every other player gets 0 — the advertised +400 participation bonus is never awarded.
   - Screenshot: /workspace/qa-party-games/star-rate/host-reveal.png, bug-scores-not-accumulating.png
3. No confirmation on phone after submitting an answer, and host's submitted-count never increments
   - Severity: major
   - Players/settings: 3 players, both runs
   - Repro: type an answer on a phone, tap Submit.
   - Expected: phone shows "Answer submitted / waiting for others"; host "Waiting for players… (0)" becomes (1).
   - Actual: textarea just clears, Submit stays active (re-submittable), and the host stays at "Waiting for players… (0)" for the whole phase even though the answer was accepted.
   - Screenshot: /workspace/qa-party-games/star-rate/bug-no-submit-confirmation.png
4. No tap feedback when rating with stars
   - Severity: major
   - Players/settings: 3 players, both runs
   - Repro: on the rate screen, tap the 4th star.
   - Expected: stars 1–4 fill/highlight and the card shows the rating was recorded.
   - Actual: stars stay identical outlines, no fill, no "rated" state; only the later scoreboard proves the tap landed. Players cannot tell whether they voted or what they voted.
   - Screenshot: /workspace/qa-party-games/star-rate/bug-no-star-tap-feedback.png, player-rate.png
5. "Back to lobby" leaves phones stuck on the old game screen
   - Severity: major
   - Players/settings: 3 players, reproduced in both runs
   - Repro: from game end (or mid-round), host presses Back to lobby → OK.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host shows the lobby, but all phones stay on "Star Rate · ended" (run 1) or on the live submit screen with a running timer (run 2). They only recover when a new game is started.
   - Screenshot: /workspace/qa-party-games/star-rate/back-to-lobby-phones.png, bug-phones-stuck-after-back-to-lobby.png
6. Adult prompt served while Content = Family
   - Severity: major
   - Players/settings: 3 players, Content Family, Difficulty Mixed
   - Repro: host Star Rate with Content Family, play to round 4.
   - Expected: only family-safe prompts.
   - Actual: round 4 prompt was "Worst thing: done an erotic photoshoot."; rounds 1–2 also used "Unfiltered truth: …" phrasing. The Family filter leaks 18+ content.
   - Screenshot: /workspace/qa-party-games/star-rate/bug-family-content-adult-prompt.png
7. Prompt text rendered twice
   - Severity: minor
   - Players/settings: all rounds, both runs
   - Repro: start any round; look at host and phone submit screens.
   - Expected: prompt shown once.
   - Actual: the prompt appears twice on the host TV and twice on each phone.
   - Screenshot: /workspace/qa-party-games/star-rate/host-in-round.png
8. Instructions/scoring screen only appears mid-game, not before round 1
   - Severity: minor
   - Players/settings: 3 players, defaults
   - Repro: start Star Rate; round 1 goes straight to "submit". The "instructions" phase with SCORING rules appeared only at round 4.
   - Expected: rules shown once before the first round.
   - Actual: players play rounds 1–3 without ever seeing how scoring works.
   - Screenshot: /workspace/qa-party-games/star-rate/host-game-end.png
9. Rate phase with zero answers gives a blank phone screen
   - Severity: minor
   - Players/settings: 3 players, defaults (submit phase skipped/empty)
   - Repro: let/force the submit phase pass with no answers; the round still enters "rate".
   - Expected: skip the round or show "No answers this round".
   - Actual: host shows only the prompt, phones show an empty screen under "Star Rate · rate".
   - Screenshot: /workspace/qa-party-games/star-rate/bug-scores-not-accumulating.png

## Improvements
- Show a submitted/rated state on phones (disabled button, checkmark, "waiting for N others") and a live submitted counter on the TV.
- Make scores rating-proportional and cumulative; show a final leaderboard/winner screen at game end instead of just last-round scores (phones only show "Star Rate · ended" with nothing).
- Expose round count in Game Options (only Content and Difficulty exist; 4 rounds is hard-coded).
- 45s submit + ~45s rate is tight for a couch game with typing; consider a longer default or auto-advance as soon as all players have submitted/rated.
- Let players see the answer author or at least their own rating after the fact; reveal currently shows the answer text but no per-player star breakdown.

## Screenshots
- /workspace/qa-party-games/star-rate/host-settings.png
- /workspace/qa-party-games/star-rate/host-in-round.png
- /workspace/qa-party-games/star-rate/host-reveal.png
- /workspace/qa-party-games/star-rate/player-rate.png
- /workspace/qa-party-games/star-rate/back-to-lobby-phones.png
- /workspace/qa-party-games/star-rate/host-game-end.png
- /workspace/qa-party-games/star-rate/bug-no-submit-confirmation.png
- /workspace/qa-party-games/star-rate/bug-no-star-tap-feedback.png
- /workspace/qa-party-games/star-rate/bug-scores-not-accumulating.png
- /workspace/qa-party-games/star-rate/bug-family-content-adult-prompt.png
- /workspace/qa-party-games/star-rate/bug-phones-stuck-after-back-to-lobby.png
- /workspace/qa-party-games/star-rate/run2-18plus-prompt.png
