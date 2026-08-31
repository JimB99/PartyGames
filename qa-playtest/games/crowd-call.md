# Crowd Call
Status: issues

Tested: 2026-08-30, 3 players (QA1 red / QA2 green / QA3 blue), host TV window ~775x800 + 3 player tabs ~505x800, no settings (none exist for this game). Fresh room GBJN hosted via /host after hard-reloading the stale room.

## What worked
- Fresh host room connected immediately; "Pick a game" reachable, Crowd Call listed under Party & Teams as "Predict what the majority will pick", 3–16 players, playable at the 3-player minimum.
- All 3 phones joined via /join?code=GBJN with distinct colors and appeared in SESSION TOTAL + player list ("online").
- TV was NOT blank during play: question, all four options, phase label ("Round n/4 · predict / answer / reveal / scoreboard / ended"), "Majority: X" and Round scores all rendered on the host.
- Phones mirrored the four options as large tap targets; option labels matched the TV exactly.
- Between-round instructions screen appeared on TV and phones ("Look at the TV!", SCORING: +1000 for correct crowd prediction, +200 for playing) — in-game instructions are present and readable.
- Host controls Pause / Resume / Skip / +30s / Play again / Back to lobby all responded; Resume correctly restored the pre-pause remaining time.
- Game reached a clean end state (Round 4/4 · ended) and host returned to the lobby with SESSION TOTAL visible.

## Bugs
1. Severity: blocker — Phase timer runs several times faster than real time, so most players never get to act
   - Players/settings: 3 players, default (no settings)
   - Repro: Start Crowd Call, watch the host "Time" readout against a wall clock during a predict phase.
   - Expected: 25s displayed ≈ 25s real.
   - Actual: 25s displayed elapses in roughly 4–6s real (observed 25s→15s→6s across ~4s of real time; round 3 went 22s→9s in ~4s). A whole round (predict+answer+reveal+scoreboard) completes in well under 15s real, so with 3 phones only the one player whose tab is in front can usually submit before the phase flips. Same class of bug as Hangman (~2x) and Would You Rather (~3x), but worse here.
   - Screenshot: /workspace/qa-party-games/crowd-call/bug-phase-advances-after-one-vote.png, /workspace/qa-party-games/crowd-call/host-in-round.png

2. Severity: blocker — Round scores do not accumulate; everyone ends with the same 200
   - Players/settings: 3 players, 4 rounds played
   - Repro: Play all 4 rounds with mixed votes (QA3 Brunch vs majority Sleep in; round 4 QA3 predicted Pineapple which was announced as the majority).
   - Expected: +200 per round for playing (=800 after 4 rounds) plus +1000 for a correct crowd prediction; totals should differ between players.
   - Actual: Every player showed exactly 200g after round 1 and never changed for rounds 2–4; final Round scores 200/200/200 and SESSION TOTAL 200/200/200. No +1000 was ever awarded even when a player's prediction matched the announced majority, and points did not add up per round.
   - Screenshot: /workspace/qa-party-games/crowd-call/bug-scores-not-accumulating-game-end.png, /workspace/qa-party-games/crowd-call/bug-all-players-200-equal.png, /workspace/qa-party-games/crowd-call/host-reveal.png

3. Severity: major — Idle players are scored; scoring ignores who actually submitted
   - Players/settings: 3 players, round 1
   - Repro: Round 1, only QA3 (Brunch) and QA2 (Sleep in) tapped; QA1 never tapped.
   - Expected: no participation points for a player who never submitted; a player matching the majority scores more than one who did not.
   - Actual: all three (incl. never-tapping QA1) were awarded an identical 200; QA2, whose pick equalled the majority ("Sleep in"), got no bonus.
   - Screenshot: /workspace/qa-party-games/crowd-call/bug-all-players-200-equal.png

4. Severity: major — "Majority" appears to be computed from predictions, not from answers
   - Players/settings: 3 players, round 4
   - Repro: Round 4 predict: QA2 tapped Pepperoni, QA3 tapped Pineapple. Answer phase: only QA1 submitted, Pepperoni.
   - Expected: majority = most common ANSWER (Pepperoni, the only answer submitted).
   - Actual: TV announced "Majority: Pineapple" (QA3's prediction). Round 3 similarly announced "Majority: Fly" when Fly had only been submitted as a prediction by QA1 and nobody answered.
   - Screenshot: /workspace/qa-party-games/crowd-call/bug-phase-advances-after-one-vote.png

5. Severity: major — After submitting in the predict phase a phone is locked out of the answer phase
   - Players/settings: 3 players, rounds 3 and 4
   - Repro: Tap an option during "predict", then wait for the "answer" phase on the same phone.
   - Expected: the player can submit their own actual answer in the answer phase.
   - Actual: all four buttons stay greyed/disabled for that player for the rest of the round, so they can never answer. Only a player who skipped predicting can act in the answer phase.
   - Screenshot: /workspace/qa-party-games/crowd-call/bug-phase-advances-after-one-vote.png

6. Severity: major — "Back to lobby" leaves phones stuck on "Crowd Call · ended"
   - Players/settings: 3 players, after game end
   - Repro: Host clicks Back to lobby from the ended scoreboard; look at all three phones.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: all three phones keep showing "Crowd Call · ended" indefinitely while the host is back in the lobby (same cross-game bug as previously seen). Only a manual reload recovers them.
   - Screenshot: /workspace/qa-party-games/crowd-call/back-to-lobby-phones.png

7. Severity: minor — No tap confirmation on phones
   - Players/settings: 3 players, every round
   - Repro: Tap any option on a phone.
   - Expected: the chosen option is highlighted / labelled "Locked in" so the player knows their tap registered.
   - Actual: nothing marks WHICH option was chosen; the whole list either stays identical or dims uniformly, so the player has no feedback (same cross-game bug).
   - Screenshot: /workspace/qa-party-games/crowd-call/player-choice.png

8. Severity: minor — Host timer counts down to 0 while the game is Paused
   - Players/settings: 3 players, round 2 predict
   - Repro: Press Pause during a predict phase and watch "Time".
   - Actual: readout continued 10s → 0s with "Paused" shown on TV and phones (Resume did restore the correct remaining time, so it is a display bug). Also taps made while paused are silently discarded with no message.
   - Screenshot: /workspace/qa-party-games/crowd-call/bug-timer-runs-while-paused.png

9. Severity: minor — No settings rail at all for Crowd Call
   - Repro: Select Crowd Call in the lobby.
   - Expected: at least round count / timer settings, or an explicit "no settings for this game" note.
   - Actual: no GAME SETTINGS panel is rendered (not even the empty one seen elsewhere); only a Start game button.
   - Screenshot: /workspace/qa-party-games/crowd-call/host-settings.png

## Improvements
- Show live vote tallies / bars per option on the TV during reveal instead of just "Majority: X" — the crowd-guessing payoff is invisible.
- Show on the TV who has locked in ("2/3 answered") and advance the phase only when everyone has submitted or the timer really expires.
- Make phases meaningfully longer (real 20–25s) and label them on the phone ("Predict what the crowd will pick" vs "Now pick your own answer") — players currently cannot tell the two identical-looking option lists apart.
- Per-round score deltas on the scoreboard (+200 / +1000) so players can see why they scored.
- Expose round count and timer as host settings.

## Screenshots
- /workspace/qa-party-games/crowd-call/host-settings.png
- /workspace/qa-party-games/crowd-call/host-in-round.png
- /workspace/qa-party-games/crowd-call/host-reveal.png
- /workspace/qa-party-games/crowd-call/player-choice.png
- /workspace/qa-party-games/crowd-call/back-to-lobby-phones.png
- /workspace/qa-party-games/crowd-call/bug-all-players-200-equal.png
- /workspace/qa-party-games/crowd-call/bug-phase-advances-after-one-vote.png
- /workspace/qa-party-games/crowd-call/bug-scores-not-accumulating-game-end.png
- /workspace/qa-party-games/crowd-call/bug-timer-runs-while-paused.png
