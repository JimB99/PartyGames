# Wit Showdown
Status: issues

Tested: 2026-08-30, players 3 (QA1 red / QA2 green / QA3 purple), host viewport 762px wide, phone viewports ~500px CSS (page has a ~500px min-width, see Improvements), room ZXRN on https://party-games.jimb99.workers.dev (new deploy, hard-reloaded).
Settings used: Run 1 = Content Family, Difficulty Mixed, 4 rounds (played all 4 to game end). Run 2 = Content 18+, Difficulty Mixed (1 full round + start of round 2, then Back to lobby).

## What worked
- Host connected immediately ("Connected", 4-letter code ZXRN, QR + join URL). No "Connecting…" hang.
- All 3 players joined via /join?code=ZXRN with distinct colors and showed `online` on host; "3 players connected".
- Game options panel appears inline under the game card: Content Family/18+, Difficulty Mixed/Easy/Medium/Hard. Defaults Family + Mixed.
- Full round loop works: instructions → submit (45s) → matchup (head-to-head pairs, ~20s each) → reveal (with "Written by X" attribution and voter names) → scoreboard → next round → ended.
- Vote attribution on reveal is correct: each answer shows its author and the list of players who voted for it; matches the votes we cast.
- Scoring rule shown on instructions ("+1000 for winning each head-to-head matchup vote") matches observed awards.
- SESSION TOTAL accumulates: after the 4-round game ended, host header showed 4000Σ / 2000Σ / 1000Σ and the lobby SESSION TOTAL listed QA1 4000, QA2 2000, QA3 1000. Those totals persisted into Run 2 (per-game `g` reset to 0, Σ kept). The Fact Check bug (round scores vanishing, Σ stuck at 0) does NOT reproduce here.
- Players who never submitted are excluded from matchups (QA3 skipped round 2) without breaking the round.
- Late submits are impossible: once the submit phase ends the textarea/Submit button are removed from the phone, so nothing can be posted late.
- No stale text in the next round: textarea is empty with placeholder "Type your answer…" each round, and the new prompt is shown on both host and phones.
- 18+ setting works: host shows an "18+" badge and the prompt pool changes (Family: "Hot take: been in a paragliding tandem flight"; 18+: "The group chat still has screenshots from when I tried freestyle snowmobiling in the backcountry").
- Long answers do not visually clip on host or phone — they wrap over multiple lines (but see truncation bug below).

## Bugs

### 1. "Back to lobby" does not return phones to the waiting screen
- Severity: major
- Players/settings: 3 players, both Family and 18+ runs
- Repro: (a) finish a game to "Round 4/4 · ended", press Back to lobby on host; (b) mid-game during a submit phase, press Back to lobby → OK on the confirm dialog.
- Expected: phones return to "Waiting for host to start a game…".
- Actual: host returns to the lobby/picker, but all three phones stay on the old game view. Case (a): stuck on "Wit Showdown · ended". Case (b): stuck on "Wit Showdown · submit" with the old prompt and a live Submit button; the timer runs to 0s and stays there. Still stuck 30+ s later; only starting a new game unsticks them.
- Screenshot: qa-party-games/wit-showdown/player-stuck-after-back-to-lobby.png, qa-party-games/wit-showdown/player-stuck-submit-after-back-to-lobby.png, qa-party-games/wit-showdown/host-lobby-after.png, qa-party-games/wit-showdown/host-lobby-after2.png

### 2. Players can vote for their own answer, and it scores
- Severity: major
- Players/settings: 3 players, Family (round 4) and 18+ (round 1)
- Repro: during a matchup where your own answer is one of the two options, tap your own answer.
- Expected: own answer not selectable (or vote rejected / not counted).
- Actual: the vote is accepted, appears in the reveal voter list, and awards the +1000 matchup win. 18+ round 1 reveal showed QA1's answer voted by QA1, QA2, QA3 — including the author. With 3 players this lets a contestant decide their own matchup.
- Screenshot: qa-party-games/wit-showdown/host-reveal-18plus.png, qa-party-games/wit-showdown/host-reveal.png

### 3. No submit confirmation on the phone; host "Waiting for players…" counter stays (0)
- Severity: minor (confusing, invites double submits)
- Players/settings: 3 players, Family round 2
- Repro: type an answer on a phone, press Submit, look at the phone and the host.
- Expected: phone shows a "submitted / waiting for others" state; host shows "Waiting for players… (2)".
- Actual: the phone clears the textarea and keeps showing the same prompt + an active Submit button (indistinguishable from not having submitted), and the host counter stayed "Waiting for players… (0)" even with 2 of 3 answers in. The submissions did register (the round advanced and the answers appeared in matchups), so it is display-only.
- Screenshot: qa-party-games/wit-showdown/player-after-submit.png, qa-party-games/wit-showdown/host-in-round.png

### 4. Long answers are silently truncated (~120 chars)
- Severity: minor
- Players/settings: 3 players, Family round 1, QA1
- Repro: submit a 165-char answer ("QA1: I now believe gravity is a personal attack and my harness was the only thing that ever truly loved me, a very long answer to test clipping at narrow phone widths").
- Expected: either a visible character limit/counter on the textarea, or the whole answer displayed.
- Actual: answer is cut mid-sentence at "…a very long" everywhere (host matchup, host reveal, phones) with no ellipsis and no limit indicated while typing.
- Screenshot: qa-party-games/wit-showdown/host-reveal.png

### 5. Points earned in an abandoned game are lost without warning
- Severity: minor
- Players/settings: 3 players, 18+ run, after round 1 (QA1 1000g, QA2 1000g)
- Repro: win a matchup, then Back to lobby mid-game.
- Expected: either carry the earned points into SESSION TOTAL or warn that scores will be discarded.
- Actual: the confirm dialog only says "Return to lobby?"; on return, SESSION TOTAL is unchanged (4000/2000/1000) and the 1000g each from the completed round is dropped.
- Screenshot: qa-party-games/wit-showdown/host-lobby-after2.png

## Improvements
- Phone page has a ~500px CSS min-width, so at a true 390px phone/window width the layout overflows horizontally (a real phone would render it zoomed out or side-scrolling). Worth a max-width/fluid pass.
- The header player chip strip on the phone needs a horizontal scrollbar with 3 players already ("QA3 0g · 0Σ" chips get cut off); consider wrapping or compacting.
- Show a submitted checkmark per player on the host during submit, and a "waiting for others" state on the phone.
- Show a character counter / limit on the answer textarea instead of silently truncating.
- Disable self-vote (grey out your own answer with "your answer").
- "Round scores" on the scoreboard is actually the cumulative game score, not the score for that round — label it "Game scores" or show the delta.

## Screenshots
- qa-party-games/wit-showdown/host-lobby.png
- qa-party-games/wit-showdown/host-3players.png
- qa-party-games/wit-showdown/host-settings.png
- qa-party-games/wit-showdown/host-in-round.png
- qa-party-games/wit-showdown/host-reveal.png
- qa-party-games/wit-showdown/host-final.png
- qa-party-games/wit-showdown/host-gameover.png
- qa-party-games/wit-showdown/host-lobby-after.png
- qa-party-games/wit-showdown/host-lobby-after2.png
- qa-party-games/wit-showdown/host-reveal-18plus.png
- qa-party-games/wit-showdown/player-join-QA1.png
- qa-party-games/wit-showdown/player-join-QA2.png
- qa-party-games/wit-showdown/player-join-QA3.png
- qa-party-games/wit-showdown/player-waiting.png
- qa-party-games/wit-showdown/player-submit.png
- qa-party-games/wit-showdown/player-after-submit.png
- qa-party-games/wit-showdown/player-vote.png
- qa-party-games/wit-showdown/player-gameover.png
- qa-party-games/wit-showdown/player-stuck-after-back-to-lobby.png
- qa-party-games/wit-showdown/player-stuck-submit-after-back-to-lobby.png
