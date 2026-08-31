# Hot Seat
Status: issues

Tested: 2026-08-31, 3 players (QA1 red / QA2 green / QA3 blue), host window ~770x800 (TV), player tabs ~500x800 (phones), room WBBK.
Run 1: Content=Family, Difficulty=Mixed (defaults), 2+ rounds played. Run 2: Content=18+, Difficulty=Mixed.

## What worked
- Hosting a fresh room via /host connected instantly ("Connecting…" never persisted); "Pick a game" list rendered; Hot Seat shows correct 3–10 player range.
- 3 phones joined via /join?code=WBBK with distinct nicknames/colors; lobby SESSION TOTAL listed all 3 and marked them "online".
- Settings panel exposes Content (Family / 18+) and Difficulty (Mixed) only — no round-count option.
- 18+ toggle works: a red "18+" badge appears on the TV and the prompt pool clearly changes ("What is the most embarrassing thing you've done while on a road trip"). No adult content leaked into Family run (Family prompts were tame: pineapple/road trip/apple juice).
- Phase flow submit -> pick -> reveal -> scoreboard advanced automatically; timer countdown on TV and phone stayed in sync with real time (45s round 1, 30s later rounds).
- Player text answers do reach the server: QA3's and QA1's typed answers appeared verbatim in the pick/reveal lists with "Written by <player>".
- Starting a new game from the lobby un-sticks previously stuck phones.

## Bugs
1. Severity: blocker — No hot-seat player is ever identified; prompts render with a raw pronoun placeholder.
   - Players/settings: 3 players, Family and 18+ both.
   - Repro: Start Hot Seat -> read TV and phone prompt.
   - Expected: TV/phones name who is in the hot seat (e.g. "QA2 is in the hot seat") and the prompt reads "Has QA2 ever lied to your best friend?"; the hot-seat player should get a different role/screen.
   - Actual: Prompt reads "Their ever lied to your best friend", "What they'd say about: been on a road trip", "Their what is the most embarrassing thing you've done while on a road trip". No player name anywhere, no role differentiation — all 3 phones got the identical submit box. There are no in-game instructions at all. Game is unplayable as designed.
   - Screenshot: /workspace/qa-party-games/hot-seat/bug-prompt-their-no-hotseat-name.png, run2-18plus-prompt.png

2. Severity: major — Scoring is nonsense: a single pick awarded 1000 points; other rounds scored 0 for everyone.
   - Players/settings: 3 players, Family.
   - Repro: Round 2, QA1 submits an answer, QA2 picks it in the pick phase.
   - Expected: a small, sane score (e.g. +100) to the correct recipient.
   - Actual: QA1's chip jumped to "1000g". In round 1 (1 submission, no pick made in time) the Round scores board showed 0/0/0.
   - Screenshot: bug-1000-points-award.png, bug-round-scores-all-zero.png

3. Severity: major — SESSION TOTAL never accumulates.
   - Players/settings: 3 players, both runs.
   - Repro: Earn 1000g in round 2, return to lobby.
   - Expected: SESSION TOTAL shows the earned points per player across games.
   - Actual: Every player's Σ stayed 0 during play and the lobby SESSION TOTAL showed 0 / 0 / 0 after the game.
   - Screenshot: bug-session-total-zero.png, back-to-lobby-phones.png

4. Severity: major — "Back to lobby" leaves all phones stuck in the game.
   - Players/settings: 3 players, both runs.
   - Repro: Mid-round, host -> Back to lobby -> OK.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: Host returns to lobby, but every phone stays on the Hot Seat submit screen with a live/expired timer and an active Submit button. Only starting a new game recovers them.
   - Screenshot: bug-phones-stuck-after-back-to-lobby.png, back-to-lobby-phones.png

5. Severity: major — No submit confirmation on phones, and host submission counter stays at 0.
   - Players/settings: 3 players, both runs.
   - Repro: Type an answer on a phone, tap Submit.
   - Expected: phone shows "Submitted / waiting for others"; TV counter increments ("Waiting for players… (1)").
   - Actual: Textarea silently clears back to the placeholder with no acknowledgement (looks like the answer was discarded), and the TV keeps showing "Waiting for players… (0)" for the whole submit phase even though the answer was actually recorded (it appears later in the pick list).
   - Screenshot: bug-no-submit-confirmation-count0.png, player-submit.png

6. Severity: major — TV is completely blank during the pick phase.
   - Players/settings: 3 players, Family.
   - Repro: Let the submit timer expire -> "Round 1/4 · pick".
   - Expected: TV shows the prompt/answers or at least "waiting for picks".
   - Actual: Body is empty black below the header; the only content is on phones.
   - Screenshot: bug-tv-blank-pick-phase.png

7. Severity: minor — Round count is fixed at 4 with no host control; Run 2's "1 round" setting does not exist in the Hot Seat options panel.
   - Screenshot: host-settings.png

## Improvements
- Name the hot-seat player prominently on the TV and rotate it each round; give the hot-seat player a distinct phone screen (e.g. "Everyone is answering about you — sit tight" / their own answer to compare against).
- Add a short in-game instruction card on the TV for the first round.
- Show per-phone submitted/locked state and a live "n of 3 submitted" counter on the TV.
- Keep the prompt (and answer count) on the TV during pick and reveal so the couch has something to watch.
- Normalise point values and make the lobby SESSION TOTAL sum completed games.
- Broadcast a lobby-reset to players when the host leaves a game.

## Screenshots
- /workspace/qa-party-games/hot-seat/host-settings.png
- /workspace/qa-party-games/hot-seat/host-in-round.png
- /workspace/qa-party-games/hot-seat/host-reveal.png
- /workspace/qa-party-games/hot-seat/player-submit.png
- /workspace/qa-party-games/hot-seat/back-to-lobby-phones.png
- /workspace/qa-party-games/hot-seat/bug-prompt-their-no-hotseat-name.png
- /workspace/qa-party-games/hot-seat/bug-no-submit-confirmation-count0.png
- /workspace/qa-party-games/hot-seat/bug-tv-blank-pick-phase.png
- /workspace/qa-party-games/hot-seat/bug-round-scores-all-zero.png
- /workspace/qa-party-games/hot-seat/bug-1000-points-award.png
- /workspace/qa-party-games/hot-seat/bug-session-total-zero.png
- /workspace/qa-party-games/hot-seat/bug-phones-stuck-after-back-to-lobby.png
- /workspace/qa-party-games/hot-seat/run2-18plus-prompt.png
