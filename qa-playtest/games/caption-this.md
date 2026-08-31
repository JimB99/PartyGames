# Caption This
Status: issues

Tested: 2026-08-31, players 3 (QA1 red / QA2 green / QA3 blue), host TV window 1280x800 left pane (~775px wide), 3 player tabs in one right-hand window (~500px wide, phone-like). Room EJBF, fresh /host room.
Runs: Run 1 = defaults (Content Family, Difficulty Mixed) — 2 full rounds played (submit + vote + scoreboard) then Back to lobby. Run 2 = Content 18+ (round count is NOT configurable; game is fixed at 4 rounds).

## What worked
- Fresh /host connected quickly; code + QR + join URL shown, "Connecting…" gone, "Pick a game" visible.
- 3 phones joined via /join?code=EJBF with distinct nicknames and colours; lobby roster + "3 players connected" correct.
- Caption This is listed with the correct 3–16 player range and greys out below minimum.
- Settings panel appears under the picked game: Content Family/18+ toggle, Difficulty select (Mixed). Start game button in picker.
- Instructions screen ("Get ready! Starting soon…", "+1000 for the caption with the most votes") auto-advanced to the submit phase on its own — no need to touch "Start round", and the Bracket Battle instant-end bug did NOT reproduce here.
- Submit phase: prompt shown identically on TV and phones, textarea + Submit button, submitted captions are actually recorded server-side (they appear in the vote/reveal phase).
- Vote phase on phones showed the submitted caption(s) as tappable cards; votes registered.
- Reveal/scoreboard: caption + "Written by QA3" + voter chips on phones; +1000 awarded to the caption with the most votes; TV showed a score list.
- Prompts changed every round and changed again with 18+ selected; 18+ badge is shown on the TV next to the title.
- Phones that were stuck after "Back to lobby" recovered automatically when a new game was started.
- Host controls Pause / Skip / +30s / Back to lobby all responded; +30s visibly extended the timer.

## Bugs

1. Severity: blocker — "Back to lobby" leaves all phones stuck on the old round
   - Players/settings: 3 players, Family defaults, clicked Back to lobby during round 3 submit phase (confirm dialog "Return to lobby?" → OK).
   - Repro: host → Back to lobby → OK.
   - Expected: all phones return to "Waiting for host to start a game…".
   - Actual: TV returns to lobby, but all 3 phones stay on the round-3 submit screen with a running timer; after the timer hits 0s they sit there forever (verified 25s+ later). Phones only recover if the host starts a new game (or the tab is reloaded).
   - Screenshot: /workspace/qa-party-games/caption-this/back-to-lobby-phones.png (also back-to-lobby-phone2.png, back-to-lobby-phone3.png, host-lobby-session-total-zero.png)

2. Severity: major — SESSION TOTAL never accumulates (always 0)
   - Players/settings: 3 players, both runs.
   - Repro: play rounds where players score (QA3 1000, QA1 1000), watch the "Σ" figure in the player chips and the lobby SESSION TOTAL list.
   - Expected: session total = sum of points earned across the session.
   - Actual: chips always read "…g · 0Σ"; after returning to lobby SESSION TOTAL lists QA1/QA2/QA3 all at 0 despite 1000-point awards.
   - Screenshot: host-round2-scoreboard.png, host-lobby-session-total-zero.png

3. Severity: major — host "Waiting for players… (0)" counter never increments on submissions
   - Players/settings: 3 players, both runs.
   - Repro: a phone types a caption and taps Submit; look at the TV.
   - Expected: "Waiting for players… (1/3)" or similar; ideally auto-advance once everyone has submitted.
   - Actual: TV stays at "Waiting for players… (0)" for the whole submit phase even though the submission was accepted (it shows up in voting). The round therefore always burns the full timer instead of advancing early.
   - Screenshot: host-after-qa3-submit.png, host-in-round.png

4. Severity: major — TV is completely blank during the vote phase
   - Players/settings: 3 players, both rounds of Run 1.
   - Repro: let the submit timer expire and enter "Round X/4 · vote".
   - Expected: TV shows the prompt and the candidate captions so the couch can read them while voting on phones.
   - Actual: the TV body is empty — only the title, "Round 1/4 · vote" and the timer. All content is phone-only, which defeats the couch/TV format.
   - Screenshot: host-blank-during-vote.png

5. Severity: major — no submit/tap confirmation on phones
   - Players/settings: 3 players, both runs.
   - Repro: type a caption → Submit; separately, tap a caption to vote.
   - Expected: "Submitted! / Waiting for others…" state, and a selected/highlighted state on the voted card.
   - Actual: on submit the textarea just empties and the Submit button stays live (looks like nothing happened / invites double submission). On voting, the tapped card shows no selected state and there is no "vote cast" message.
   - Screenshot: player-submit.png (= player-submit-no-confirm.png), phone-vote-1.png

6. Severity: major — "Round scores" heading shows cumulative game totals
   - Players/settings: 3 players, Family, end of round 2.
   - Repro: QA3 wins round 1 (1000), QA1 wins round 2 (1000). Round-2 scoreboard.
   - Expected: round scores = points earned in that round only (QA1 1000, QA3 0, QA2 0).
   - Actual: shows QA1 1000, QA3 1000, QA2 0 — i.e. cumulative game score under a "Round scores" label. Combined with bug 2 there is no correct per-round view anywhere.
   - Screenshot: host-reveal.png, host-round2-scoreboard.png

7. Severity: major — game proceeds to voting with a single caption (or would with none)
   - Players/settings: 3 players; only 1 player managed to submit in time in each Run 1 round.
   - Repro: let only one player submit.
   - Expected: skip the round / re-prompt, or at minimum prevent a caption winning 1000 points on a single sympathy vote from the author's rival.
   - Actual: vote phase runs with one card, the author gets +1000. Also, the sole author sees only their own caption with nothing to vote for and no explanatory text.
   - Screenshot: phone-vote-0.png (author's own view), phone-vote-1.png

8. Severity: minor — no images; "Caption This" prompts are text dares, and the copy is ungrammatical
   - Players/settings: both Family and 18+.
   - Repro: read the prompts: "Caption for someone who use your elbows to brush your teeth without using your hands", "…who walk backward for the next five minutes", "…who attempt to do a backflip (safely) or a high kick while reciting a poem".
   - Expected: an image/scene to caption (game blurb says "Write the funniest caption for a scene") and grammatical prompt text.
   - Actual: no image at all — prompts are recycled dare/truth-style strings with broken verb agreement ("someone who use", "who walk", "who attempt"). 18+ prompts read no differently from Family, so the content toggle has no perceptible effect beyond the badge.
   - Screenshot: host-in-round.png, run2-host-18plus.png

9. Severity: minor — round timer too short for typing on a phone and no round-count setting
   - Players/settings: 3 players, defaults.
   - Repro: 35s submit timer; typing a normal-length caption on two phones in sequence already ran the clock out (QA2's round-2 caption was lost mid-typing at 0s).
   - Expected: ~60s+ for a free-text creative game, and a configurable round count (task asked for 1 round; only a fixed 4 rounds is available).
   - Actual: 35s submit / ~45s vote, fixed 4 rounds, no rounds option in GAME OPTIONS.
   - Screenshot: host-settings.png

Not reproduced / not reachable this run: "Start round" on the instructions screen ending the game (Caption This auto-started, button untouched); "Play again" as a no-op (game never reached the final end-of-game screen because we returned to lobby at round 3).

## Improvements
- Show the candidate captions (and the prompt) on the TV during vote and reveal — that is the whole point of a couch party game.
- Add a submitted/voted confirmation state on phones and disable the Submit button after submitting.
- Make the TV submission counter live ("2/3 submitted") and auto-advance when everyone is in.
- Broadcast the lobby transition to phones so "Back to lobby" resets them.
- Fix SESSION TOTAL accumulation and label per-round vs cumulative scores distinctly.
- Add real images/scenes for a game called Caption This, fix prompt grammar, and make 18+ prompts actually differ.
- Raise the submit timer for typed answers and expose a round-count option.

## Screenshots
- /workspace/qa-party-games/caption-this/host-settings.png
- /workspace/qa-party-games/caption-this/host-in-round.png
- /workspace/qa-party-games/caption-this/host-after-qa3-submit.png
- /workspace/qa-party-games/caption-this/host-blank-during-vote.png
- /workspace/qa-party-games/caption-this/host-reveal.png
- /workspace/qa-party-games/caption-this/host-round2-scoreboard.png
- /workspace/qa-party-games/caption-this/host-lobby-session-total-zero.png
- /workspace/qa-party-games/caption-this/player-submit.png
- /workspace/qa-party-games/caption-this/player-submit-no-confirm.png
- /workspace/qa-party-games/caption-this/phone-vote-0.png
- /workspace/qa-party-games/caption-this/phone-vote-1.png
- /workspace/qa-party-games/caption-this/phone-vote-2.png
- /workspace/qa-party-games/caption-this/phone-reveal.png
- /workspace/qa-party-games/caption-this/back-to-lobby-phones.png
- /workspace/qa-party-games/caption-this/back-to-lobby-phone2.png
- /workspace/qa-party-games/caption-this/back-to-lobby-phone3.png
- /workspace/qa-party-games/caption-this/run2-host-18plus.png
- /workspace/qa-party-games/caption-this/run2-phone-18plus.png
