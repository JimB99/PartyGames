# Hangman Race
Status: issues

Tested: 2026-08-30, 3 players (QA1 red / QA2 green / QA3 blue), host window ~770x800 (TV), phones as 3 tabs in a second ~500px-wide Chrome window, room CYJT.
Runs: Run 1 = defaults (Difficulty Mixed, Speed scoring "Rank by speed"), 4 rounds played. Run 2 = Difficulty Hard + Speed scoring "Off (flat points)", 4 rounds played.

## What worked
- Host at /host connected immediately, code + QR shown, "Pick a game" reachable; 3 phones joined via /join?code=CYJT with distinct colours and appeared in SESSION TOTAL / player list.
- Hangman Race listed under Arcade (2–16 players); GAME OPTIONS panel exposes Difficulty (Mixed/Easy/Medium/Hard) and Speed scoring (Rank by speed / Off (flat points)) — see host-settings.png.
- TV was NOT blank during play (unlike Word Rush): it shows one row per player with that player's own masked word and strike count, plus round number and timer.
- Each player has their OWN independent word progress and strike counter (0/6) — race semantics work; guesses by one player do not leak to others.
- Phone controller renders a full A–Z key grid plus a "Solve whole word…" field and Solve button; letter taps registered within ~1s on both phone and TV.
- Hits fill letters in all matching positions; misses increment strikes (max 6); a wrong whole-word Solve costs 2 strikes (documented in the instructions card).
- Reveal screen shows the round's word; scoreboard screen shows Round scores; "Play again" and "Back to lobby" both present; starting a new game re-syncs (un-sticks) phones.
- In-game instructions card appears between rounds on TV and phone ("Look at the TV!" + SCORING text).

## Bugs
1. Severity major — Round timer runs ~2x faster than real time
   - Players/settings: 3 players, both runs, all rounds.
   - Repro: start a round, note the displayed "Time" value, wait a measured interval, re-read it.
   - Expected: displayed seconds decrease 1 per real second (a 45s round lasts 45s).
   - Actual: measured 25s -> 12s over ~7s real, and 12s -> 2s over ~4s real; a nominal 45s round lasts ~22s real. Makes rounds nearly unwinnable.
   - Screenshot: timer-t0.png, timer-t1.png, host-in-round.png
2. Severity major — "Back to lobby" leaves phones stuck
   - Players/settings: 3 players, after Run 1 ended.
   - Repro: finish a game, click "Back to lobby" on host, look at each phone tab.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host returns to lobby, but all 3 phones stay frozen on "Hangman Race · ended" with no controls; only starting another game (or reload) recovers them.
   - Screenshot: back-to-lobby-phones.png
3. Severity major — Round can start already expired after the instructions card
   - Players/settings: Run 2 (Hard, speed off), round 2/4.
   - Repro: at the "Get ready! / instructions" screen press "Start round".
   - Expected: a fresh full-length round.
   - Actual: round 2 flipped straight to "reveal" (Time 1s) with the word "anhalonin" and nobody able to guess — the round clock appears to keep draining during the instructions phase.
   - Screenshot: run2-instructions-rank-points-despite-speed-off.png
4. Severity major — Word list is unusable: every word started with "a", most are obscure/non-dictionary
   - Players/settings: both runs, Mixed and Hard.
   - Repro: play consecutive rounds and read the revealed words.
   - Expected: varied, recognisable words spread across the alphabet; Hard = harder but real words.
   - Actual: 6/6 observed words began with "a": abstention, amblyopia, absaroka, anhalonin, abneural, aistopoda. Several are proper nouns / taxonomic or medical rarities. Looks like the picker reads only the head of an alphabetical list.
   - Screenshot: host-reveal.png, run2-reveal-obscure-word.png
5. Severity major — Speed scoring = "Off (flat points)" appears not to be applied
   - Players/settings: Run 2, Difficulty Hard, Speed scoring Off (flat points).
   - Repro: set Speed scoring to Off (flat points), start, read the SCORING instructions card.
   - Expected: flat-points wording/behaviour.
   - Actual: card still reads "Rank points for solving first. Wrong solve costs 2 strikes." — same text as with Rank by speed; no observable difference.
   - Screenshot: run2-settings-hard-speedoff.png, run2-instructions-rank-points-despite-speed-off.png
6. Severity minor — No tap confirmation / used-letter state on phone
   - Players/settings: all runs.
   - Repro: tap a letter, then tap the same letter again.
   - Expected: key marked used (hit/miss colour) and disabled; some haptic/visual ack.
   - Actual: keys never change state; the same letter can be re-tapped indefinitely (re-tapping a known miss did not add a strike, but there is zero feedback). Wrong Solve gives no message either — only the strike counter moves.
   - Screenshot: player-keyboard.png
7. Severity minor — TV shows no gallows/hangman art
   - Repro: play a round with strikes.
   - Expected: for a hangman game, some gallows/figure or at least X/6 strike pips.
   - Actual: only the text "(n strikes)" per player row; no drawing, no per-letter miss list.
   - Screenshot: host-in-round.png
8. Severity minor — Reveal screen prints the word twice
   - Actual: "Word: <word>" appears above the player rows and again below them.
   - Screenshot: host-reveal.png
9. Severity minor — Phones show nothing useful at reveal / scoreboard / ended
   - Actual: phone shows only "Hangman Race · reveal" / "· ended" — no word, no score, no "well played".
   - Screenshot: run2-reveal-obscure-word.png, back-to-lobby-phones.png
10. Severity minor — Round scores and SESSION TOTAL stayed 0 for the whole session
   - Note: nobody managed to solve a word (see bugs 1/3/4), so accumulation could not be positively verified; all Round scores and SESSION TOTAL entries read 0 after 8 rounds. Scoring for near-misses/partial progress gives nothing, so a full session can end 0-0-0.
   - Screenshot: round-scores.png, game-ended-zero-scores.png
11. Severity minor — Host control bar is partially hidden behind the desktop taskbar/tray icons ("Back to lobby" is obscured); cosmetic on TV-sized windows but made the button hard to hit.
   - Screenshot: game-ended-zero-scores.png

## Improvements
- Fix the clock rate first; then re-tune round length (a real 45s with this word list is still very tight).
- Replace/curate the word list (common words, alphabet-wide, difficulty tiers that mean something) and show word length/category hints.
- Grey out or colour used letters on the phone, add hit/miss feedback and a "wrong word!" toast for failed solves.
- Draw the gallows (or strike pips) on the TV and mirror each player's own word on their phone at reveal.
- Award partial credit for letters revealed so a round isn't always worth 0.
- Make "Back to lobby" broadcast a lobby state to phones.

## Screenshots
- /workspace/qa-party-games/hangman-race/host-settings.png
- /workspace/qa-party-games/hangman-race/host-in-round.png
- /workspace/qa-party-games/hangman-race/host-reveal.png
- /workspace/qa-party-games/hangman-race/player-keyboard.png
- /workspace/qa-party-games/hangman-race/back-to-lobby-phones.png
- /workspace/qa-party-games/hangman-race/round-scores.png
- /workspace/qa-party-games/hangman-race/game-ended-zero-scores.png
- /workspace/qa-party-games/hangman-race/run2-settings-hard-speedoff.png
- /workspace/qa-party-games/hangman-race/run2-instructions-rank-points-despite-speed-off.png
- /workspace/qa-party-games/hangman-race/run2-reveal-obscure-word.png
- /workspace/qa-party-games/hangman-race/timer-t0.png
- /workspace/qa-party-games/hangman-race/timer-t1.png
