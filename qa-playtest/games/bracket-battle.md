# Bracket Battle
Status: issues

Tested: 2026-08-31, players 4 (QA1–QA4, distinct colors), live site https://party-games.jimb99.workers.dev/, room QHMK.
Viewports: host "TV" window ~770x800, phones = 4 tabs in one ~500x800 Chrome window (tab-per-phone; separate windows not usable at 1280x800 with a readable TV).
Settings: Run 1 = defaults (Content Family, Difficulty Mixed). Run 2 = Content 18+, Difficulty Mixed.

## What worked
- Hosting a fresh room via /host: connected instantly, code + QR + "Pick a game" shown.
- All four phones joined via /join?code=QHMK with different colors; host lobby listed 4 players.
- Bracket Battle appears under Party & Teams (4–16 players); GAME OPTIONS shows Content (Family/18+) and Difficulty (Mixed) — screenshot host-settings.png.
- 18+ badge rendered next to the game title on the TV during Run 2; category differed per run ("places & landmarks" Family, "electric cars" 18+). No adult content leaked into the Family run.
- Submit phase: category shown on TV and phone, free-text box + Submit; submitted entries reached the server (they appeared in the bracket).
- Vote phase (with 2 entries): TV shows the two entries as colored cards; phones show two tappable options; tapping registered a vote immediately and advanced the matchup.
- Reveal: winner marked "Champion", authors shown ("Written by QA4"); +2000 awarded to the champion's author as the instructions state.
- SESSION TOTAL accumulated correctly across games (QA4 2000Σ from run 1 still present, QA1 +2000 added in run 2).
- Player reload rejoins the room and restores the player's session score.

## Bugs
1. Severity: blocker — "Start round" on the instructions screen ends the whole game instantly.
   Players/settings: 4 players, Family, defaults.
   Repro: Lobby → Bracket Battle → Start game → instructions screen ("Get ready!" + SCORING) → click "Start round".
   Expected: submit phase begins.
   Actual: TV jumps straight to "Round 1/1 · ended", Round scores all 0, no submit/vote phase at all. Phones show "Bracket Battle · ended".
   Screenshot: bug-start-round-ends-game-instantly.png

2. Severity: major — TV submission counter never increments ("Waiting for players… (0)").
   Players/settings: both runs.
   Repro: during submit phase, submit an answer from any phone.
   Expected: counter goes to (1), (2)…
   Actual: stays "(0)" for the whole phase even though the entries are accepted and later appear in the bracket. Host has no way to know when everyone is done.
   Screenshot: bug-no-submit-confirmation.png

3. Severity: major — no submit confirmation on the phone.
   Repro: type an answer, tap Submit.
   Expected: "Submitted / waiting for others" state, or the answer stays visible/locked.
   Actual: the textarea silently clears back to the "Type your answer…" placeholder with the Submit button still active — indistinguishable from a failed tap; a player can easily submit twice.
   Screenshot: bug-no-submit-confirmation.png

4. Severity: major — a 1-entry bracket is played as a "tournament" and pays out 2000.
   Players/settings: 4 players, Family; only one player submitted in time.
   Repro: let only one entry be submitted.
   Expected: not enough entries → skip round / no points, or a graceful message.
   Actual: TV renders a matchup of "Eiffel Tower" vs an empty colored card, then declares it Champion with no vote at all and awards +2000.
   Screenshots: host-in-round (run 2 version replaced it) / bug-round1-single-entry-2000pts-phones-blank.png

5. Severity: major — phones go completely blank during vote/reveal after the first game.
   Repro: run 1 (single entry), when TV moved to vote/reveal.
   Expected: vote UI or "waiting" text.
   Actual: all four phone screens were entirely black (no header, no name, no room code) through vote, reveal and the ended screen; only a hard reload restored them.
   Screenshot: bug-phones-blank-during-vote.png

6. Severity: major — "Back to lobby" leaves phones stuck.
   Repro: from the ended screen, click "Back to lobby".
   Expected: phones return to "Waiting for host to start a game…".
   Actual: host returns to lobby but shows "0 players connected" and an empty SESSION TOTAL for a while; phones stay on "Bracket Battle · ended" (or blank) and only recover after a manual reload, which re-joins them.
   Screenshot: back-to-lobby-phones.png

7. Severity: major — "Play again" is a no-op.
   Repro: on the ended screen, click "Play again" (twice).
   Expected: a new game starts.
   Actual: nothing happens; screen stays on "Round 1/1 · ended".
   Screenshot: bug-start-round-ends-game-instantly.png (same screen)

8. Severity: minor — timer / "+30s" arithmetic is off.
   Repro: during submit, click "+30s".
   Actual: 45s → 63s on the first click and 63s → 70s on the second (i.e. much less than +30s once tick loss is accounted for). Displayed countdown otherwise tracked real time reasonably.

9. Severity: minor — single-matchup "bracket": always "Round 1/1"; with 2 entries the game is one matchup and over in ~40s. No bracket tree / seeding is drawn on the TV, no vote counts shown at reveal.

10. Severity: minor — instructions are thin: the phase is called "instructions" but only shows "SCORING +2000 to the author of the bracket champion." Nothing explains what to submit or how the bracket works, and phones just say "Look at the TV!".

## Improvements
- Show submitted/total on the TV and a clear "Submitted ✓" lock state on phones.
- Require a minimum number of entries (and pad/bye properly) before building a bracket; never award the champion bonus for an unopposed single entry.
- Make "Back to lobby" and "Play again" push a state to phones so they resync without a reload.
- Draw the actual bracket tree with rounds and show vote tallies at reveal.
- Give more points for winning multiple matchups rather than a flat +2000 to one author.
- Explain the game in the instructions phase (what to write, how many rounds, how voting works).

## Screenshots
- /workspace/qa-party-games/bracket-battle/host-settings.png
- /workspace/qa-party-games/bracket-battle/host-in-round.png
- /workspace/qa-party-games/bracket-battle/host-reveal.png
- /workspace/qa-party-games/bracket-battle/player-submit.png
- /workspace/qa-party-games/bracket-battle/back-to-lobby-phones.png
- /workspace/qa-party-games/bracket-battle/bug-no-submit-confirmation.png
- /workspace/qa-party-games/bracket-battle/bug-phones-blank-during-vote.png
- /workspace/qa-party-games/bracket-battle/bug-round1-single-entry-2000pts-phones-blank.png
- /workspace/qa-party-games/bracket-battle/bug-start-round-ends-game-instantly.png
- /workspace/qa-party-games/bracket-battle/run2-18plus-category.png
- /workspace/qa-party-games/bracket-battle/run2-end-scores-phone-blank.png
