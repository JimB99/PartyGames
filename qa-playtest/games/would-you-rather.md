# Would You Rather
Status: issues

Tested: 2026-08-30, 3 players (QA1 red / QA2 green / QA3 purple), host TV window 768x800, player windows ~512px wide (plus a 390x844 emulated check), room ZXRN.
Settings covered: Run 1 = defaults (Content Family, Difficulty Mixed, TV display "Question only on TV", Speed scoring "Rank by speed"), 7 rounds played of 10. Run 2 = Content 18+, TV display "Show answers on TV too", Speed scoring "Off (flat points)", 1 round.

## What worked
- Host `/host/ZXRN` connected immediately after hard reload ("Connected", "Pick a game" visible); no "Connecting…" hang. All 3 phones rejoined with the same nicknames and colors after a hard reload of each player tab.
- Game card shows correct player range (2–16); Would You Rather selectable with 3 players.
- Settings panel renders all four documented options and they take effect:
  - Content 18+ → red "18+" badge on the TV header and a visibly different prompt pool.
  - TV display "Show answers on TV too" → both options rendered on the TV (blue/orange cards); "Question only on TV" → TV shows only "Vote on your phone!".
- Voting works: each tap registers, host counter increments "Waiting for players… (n)".
- Reveal (when at least one vote exists) shows every player's chosen option with their colour dot on both TV and phones, plus a correct percentage split bar (verified 50/50 with 2 votes and 67/33 with a 2–1 split).
- Round advances immediately once all connected players have voted.
- Host controls Pause / Skip / +30s / Back to lobby all responded; +30s correctly added 30 to the displayed timer.
- Phones automatically recovered from the stuck state as soon as a new game was started from the lobby.
- 390px viewport: no page overflow (document scrollWidth == clientWidth == 390); option buttons wrap and stay readable. Only the player-score chip strip scrolls inside its own container (by design).
- Scoring: game explicitly states "No points — see how the group splits on each dilemma", so all-zero round scores are correct for this game (unlike the Fact Check / Quick Quiz accumulation bug — not reproducible here since the game is intentionally point-less). SESSION TOTAL kept its pre-existing values (4000/2000/1000) and was not corrupted.

## Bugs
1. Severity: major — Round timer runs roughly 3x faster than the displayed seconds
   - Players/settings: 3 players, both runs, all settings.
   - Repro: start Would You Rather; watch the "Time" countdown on host and phones against wall-clock.
   - Expected: a 24s round lasts ~24 real seconds, enough for 3 phones to vote.
   - Actual: the counter drops ~3 displayed seconds per real second (e.g. 24s → 5s in ~6 real seconds), so a "24s" round is over in ~8 seconds. In rounds 1, 3, 4 and Run 2 round 1 the third player was cut off mid-vote; I had to press +30s (sometimes twice) to let 3 people vote at all. On real phones this makes the game nearly unplayable.
   - Screenshot: /workspace/qa-party-games/would-you-rather/host-in-round.png (24s at start), /workspace/qa-party-games/would-you-rather/host-reveal.png
2. Severity: major — "Back to lobby" leaves phones stuck on the question screen (same cross-game bug)
   - Players/settings: 3 players, Run 1 defaults, pressed mid-game during round 7 question phase.
   - Repro: host → Back to lobby → OK.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host shows lobby/QR, but all phones stay on the Would You Rather question with the two option buttons still tappable; their timer just decays to 0s and freezes. Only a new game start (or a manual reload) unsticks them.
   - Screenshot: /workspace/qa-party-games/would-you-rather/back-to-lobby-phones.png
3. Severity: major — No tap/submit confirmation on phones
   - Players/settings: all runs.
   - Repro: tap either option on a phone.
   - Actual: nothing on the phone changes — no "locked in", no highlight of your choice, buttons stay tappable. Worse, option A is permanently rendered in purple/accent styling, which reads as "already selected" before anyone taps; a player who taps option B sees option A still highlighted. Only the TV's "Waiting for players… (n)" counter confirms the vote.
   - Expected: selected option highlighted + "Locked in / waiting for others" state.
   - Screenshot: /workspace/qa-party-games/would-you-rather/bug-no-vote-confirmation.png (QA2 has just voted for option B; option A still shown highlighted), /workspace/qa-party-games/would-you-rather/player-waiting.png
4. Severity: minor — Reveal screen is completely blank when nobody voted
   - Repro: let a round's (fast) timer expire with 0 votes.
   - Expected: show the question/options with "no votes" or skip the phase.
   - Actual: TV and phones show only "Round n/10 · reveal" and empty space.
   - Screenshot: /workspace/qa-party-games/would-you-rather/bug-blank-reveal.png
5. Severity: minor — "Speed scoring" setting is meaningless for this game
   - Repro: settings show Speed scoring "Rank by speed" (default) but the in-game instructions read "No points — see how the group splits on each dilemma"; scores stayed 0 with both "Rank by speed" and "Off (flat points)".
   - Expected: hide/disable the Speed scoring control for a point-less game, or actually award points.
   - Screenshot: /workspace/qa-party-games/would-you-rather/bug-instructions-midgame-round5.png, /workspace/qa-party-games/would-you-rather/host-settings-run2-18plus-speedoff.png
6. Severity: minor — Instructions/"Get ready!" panel appears mid-game (round 5), not before round 1
   - Repro: play Run 1 from round 1; at round 5/10 the phase became "instructions" with "Get ready! Starting soon…" and a Start round button; pressing Start round jumped straight to a blank reveal, skipping round 5's question entirely.
   - Expected: instructions shown once before round 1; a round should never be skipped.
   - Screenshot: /workspace/qa-party-games/would-you-rather/bug-instructions-midgame-round5.png
7. Severity: minor — With "Question only on TV" the TV shows neither the question nor the options
   - Repro: default TV display setting, round in progress.
   - Expected: the dilemma text on the TV (that is what the option name implies).
   - Actual: TV shows only "Vote on your phone!" — the couch/TV audience can't see the dilemma at all; the reveal bar also has no labels saying which colour is which option.
   - Screenshot: /workspace/qa-party-games/would-you-rather/host-in-round.png

## Improvements
- Slow the round clock to real seconds (or make the displayed number match), and don't end the round while players are mid-tap.
- Add a clear "locked in" state on phones and drop the default accent styling on option A so it isn't mistaken for a selection.
- Show the dilemma text on the TV in both TV-display modes; label the reveal bar halves with the option text and vote counts, not just percentages.
- Show live per-option tallies on the TV during voting (currently only a headcount).
- Broadcast a lobby-reset to phones when the host returns to the lobby.
- Grey out or hide Speed scoring for games that award no points.

## Screenshots
- /workspace/qa-party-games/would-you-rather/host-settings.png
- /workspace/qa-party-games/would-you-rather/host-in-round.png
- /workspace/qa-party-games/would-you-rather/host-reveal.png
- /workspace/qa-party-games/would-you-rather/player-choice.png
- /workspace/qa-party-games/would-you-rather/player-waiting.png
- /workspace/qa-party-games/would-you-rather/back-to-lobby-phones.png
- /workspace/qa-party-games/would-you-rather/bug-no-vote-confirmation.png
- /workspace/qa-party-games/would-you-rather/bug-blank-reveal.png
- /workspace/qa-party-games/would-you-rather/bug-instructions-midgame-round5.png
- /workspace/qa-party-games/would-you-rather/host-settings-run2-18plus-speedoff.png
- /workspace/qa-party-games/would-you-rather/host-run2-18plus-tv-show-answers.png
- /workspace/qa-party-games/would-you-rather/player-390px.png
