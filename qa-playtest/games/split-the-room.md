# Split the Room
Status: issues

Tested: 2026-08-31, 3 players (QA1/QA2/QA3, red/green/blue), host window ~770px wide (TV) + player tabs ~500px (phones), room TJSU (fresh via /host).
Settings tested: Content = Family (Run 1, defaults, 4 rounds) and Content = 18+ (Run 2). Only option exposed is Content Family/18+ — no round-count or timer option.

## What worked
- Fresh room hosted, "Pick a game" reached, 3 phones joined /join?code=TJSU with distinct colors.
- Game listed 3–16 players under Social & Voting; started fine at 3 players.
- TV never went blank: prompt, both side labels, vote tallies (A: 2 · B: 1) and a Round scores panel all rendered.
- Minority scoring is directionally correct the first time: round 2 (A:2 / B:1) awarded QA3 (side B, the smaller side) +1000 and the TV "Round scores" panel showed QA3 1000, others 0.
- Timer on TV and phones stayed in sync with real elapsed time (45s → 26s → 16s → 8s, matched wall clock).
- Vote taps register visibly on the phone: chosen side stays highlighted and both buttons dim/disable after tapping.
- In-game instructions phase shows "Look at the TV!" on phones and "+1000 if you voted with the smaller side." on TV/phone.
- Family content produced only clean prompts (Breakfast for dinner, Movie theaters, Public karaoke, Group chats) — no adult leak (unlike Star Rate Family).
- Phones recover when the host starts a new game from the lobby.

## Bugs
1. Severity: blocker — Scores only awarded once; round scores never accumulate and SESSION TOTAL stays 0
   Players/settings: 3 players, Family and 18+ both
   Repro: Play multiple rounds, each time split 2 vs 1 with the same player alone on side B.
   Expected: minority player gains +1000 each round (1000, 2000, 3000...) and SESSION TOTAL reflects earnings.
   Actual: QA3 got 1000g in round 2 and then stayed at exactly 1000g after being the minority again in round 3 (Family) and rounds 1 and 2 (18+ run). SESSION TOTAL showed 0 for every player throughout, and on return to lobby the lobby SESSION TOTAL was 0 / 0 / 0 — the 1000g earned was lost entirely.
   Screenshot: /workspace/qa-party-games/split-the-room/bug-round2-no-award.png

2. Severity: blocker — "Back to lobby" leaves all phones stuck on "Split the Room · ended"
   Players/settings: 3 players, Family, mid-round 4
   Repro: During a round press "Back to lobby" on the host and confirm.
   Expected: phones return to "Waiting for host to start a game…".
   Actual: host returns to lobby/QR screen, but all 3 phones sit on "Split the Room · ended" indefinitely (>60s, verified on all 3 tabs). Only starting a new game unsticks them. The stuck pages also became unresponsive enough that page screenshots timed out on 2 of 3 phones.
   Screenshot: /workspace/qa-party-games/split-the-room/back-to-lobby-phones.png, back-to-lobby-phone1.png, back-to-lobby-phone3.png

3. Severity: major — "submit" phase is unexplained and its input is discarded; host counter never moves
   Players/settings: 3 players, all settings
   Repro: At round start the phone shows a bare "Type your answer…" box + Submit with no prompt or instruction; the prompt is only on the TV. Type text on each phone and press Submit.
   Expected: prompt/instruction on the phone, a "Submitted!" confirmation, host "Waiting for players…" count rising, and the written text used somewhere (e.g. as a side label).
   Actual: the textarea just clears with no confirmation, host stays "Waiting for players… (0)" for the whole phase, and the two voting sides that appear are always game-generated ("Always yes" / "That's just sad brunch"), never the player text.
   Screenshot: /workspace/qa-party-games/split-the-room/bug-no-submit-confirmation.png, player-submit-noprompt.png

4. Severity: major — Round 1 has no instructions phase and its reveal/scoreboard was skipped
   Players/settings: 3 players, Family
   Repro: Start the game and complete round 1.
   Expected: instructions before round 1, then reveal + scoreboard.
   Actual: round 1 opened straight into "submit" with no instructions; after voting it jumped to "Round 2/4 · instructions" with no reveal/scoreboard for round 1. Rounds 2+ do show instructions and reveal, and round 3 (Family) again showed reveal but no scoreboard.
   Screenshot: /workspace/qa-party-games/split-the-room/host-in-round.png, host-reveal-r3.png

5. Severity: minor — 18+ setting produces no different content
   Players/settings: 3 players, Content 18+
   Repro: Host with 18+ and play rounds.
   Actual: TV gains an "18+" badge, but prompts came from the same pool (Alarm clocks, Public karaoke — "Public karaoke" was literally repeated from the Family run). No adult-flavoured prompt appeared in 4 rounds of 18+.
   Screenshot: /workspace/qa-party-games/split-the-room/host-18plus.png

6. Severity: minor — phones blank during reveal/scoreboard
   Repro: watch a phone during reveal and scoreboard phases.
   Actual: phone shows only "Split the Room · reveal" / "· scoreboard" with an empty body — no side chosen, no points gained, no tally.
   Screenshot: /workspace/qa-party-games/split-the-room/player-reveal.png

## Improvements
- Show the prompt (and what to write, if writing matters) on the phone during submit; add an explicit "Submitted ✓" state and a submitted/total counter on the TV.
- Show per-round "You got +1000 / you were with the majority" feedback on the phone during reveal.
- Give the vote a confirmed state label ("Voted") rather than only dimming.
- Make "Back to lobby" broadcast a lobby state to phones.
- Fix score accumulation and wire round scores into SESSION TOTAL; show cumulative totals on the reveal scoreboard.
- Give 18+ a genuinely distinct prompt pool, or drop the toggle for this game.

## Screenshots
- /workspace/qa-party-games/split-the-room/host-settings.png
- /workspace/qa-party-games/split-the-room/host-in-round.png
- /workspace/qa-party-games/split-the-room/host-reveal.png
- /workspace/qa-party-games/split-the-room/host-reveal-r3.png
- /workspace/qa-party-games/split-the-room/host-reveal-18plus.png
- /workspace/qa-party-games/split-the-room/host-reveal-18plus-r2.png
- /workspace/qa-party-games/split-the-room/host-18plus.png
- /workspace/qa-party-games/split-the-room/player-vote.png
- /workspace/qa-party-games/split-the-room/player-submit-noprompt.png
- /workspace/qa-party-games/split-the-room/player-reveal.png
- /workspace/qa-party-games/split-the-room/player-reveal-r3.png
- /workspace/qa-party-games/split-the-room/player-reveal-18plus.png
- /workspace/qa-party-games/split-the-room/player-reveal-18plus-r2.png
- /workspace/qa-party-games/split-the-room/bug-no-submit-confirmation.png
- /workspace/qa-party-games/split-the-room/bug-round2-no-award.png
- /workspace/qa-party-games/split-the-room/back-to-lobby-phones.png
- /workspace/qa-party-games/split-the-room/back-to-lobby-phone1.png
- /workspace/qa-party-games/split-the-room/back-to-lobby-phone2.png
- /workspace/qa-party-games/split-the-room/back-to-lobby-phone3.png
