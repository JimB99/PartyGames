# Live playtest findings — fix these

This folder is a **Cursor fix plan**, not documentation.

It was produced by a live couch-party playtest of https://party-games.jimb99.workers.dev/ on 2026-08-30/31 (host = TV, extra browser windows as phones). Every game was actually played.

**Cursor: implement the fixes described here.** Start with the cross-cutting bugs (they hit almost every game), then the blockers. Each `games/*.md` is a self-contained plan: repro, expected vs actual, severity. Do not wait for GitHub issues. Do not rewrite the reports — ship the product fixes.

Screenshots from the playtest were captured locally and are **not** in this folder. Trust the repro steps.

## Priority order

### 1. Cross-cutting (fix once, helps every game)

See `lobby.md` plus the repeated majors in almost every game file:

1. **"Back to lobby" does not return phones to waiting.** Host goes to the picker; every phone stays frozen on the previous game (`· ended`, a live submit screen, or even the secret word). Only starting a new game or a manual reload recovers them. Reproduced in essentially every title.
2. **Phone controllers never confirm a submit/tap.** Textareas clear, buttons stay enabled, host often still says `Waiting for players… (0)` even after answers registered.
3. **Session / round scores are wrong in most games.** Common failure modes:
   - round gold (`g`) is last-round-only and never accumulates (Fact Check, Quick Quiz, Reverse Fact, When Was It, Star Rate, Impostor, Draw & Guess, …)
   - SESSION TOTAL (`Σ`) stays 0, stays frozen from a previous game, or **doubles** the round score (Last on the Dike, Four in a Row, Tic-Tac-Toe)
   - final board shows 0/0/0 despite points awarded mid-game
4. **Timers often run faster than the displayed countdown** (Would You Rather ~3×, Hangman Race ~2×, Crowd Call ~5×). Some games were accurate — don't "fix" those.
5. **`/play` layout is too wide for a real phone** (~500px CSS min-width). Join/home at 390px were fine.
6. Host `/host` creates a **new room on every visit/refresh**. Slow loads sit on red "Connecting…" and join then says "No active host" for a valid code.

### 2. Blockers (game unplayable or missing)

| Game | Blocker |
| --- | --- |
| Word Rush | Every valid word rejected as "Invalid" |
| Crowd Call | Timer ~5× too fast; predict lock-out; scores stuck at 200 |
| Hot Seat | Nobody is put in the hot seat; raw pronoun placeholders |
| Bracket Battle | "Start round" on instructions **ends the whole game** at 0 |
| Chain Sketch | Phone UI blank every phase until reload; previous sketch never shown |
| Spectrum | Scoring always 0 |
| Out of Place | **Not on the live catalog** (31 cards, no match) |
| Trail Dash | Humans cannot steer / die instantly; TV dropped to lobby mid-round |
| Grid Blast | Bombs detonate instantly and kill the placer; movement barely works |
| Quick Quiz | Scores reset every round; final 0/0/0 |

### 3. Then per-game files

Work through `INDEX.md`. One file per game in `games/`. Verify each fix with host + at least min-players on separate sessions.

## What already works (don't break)

- Host + join with a 4-letter code, nickname, 16-colour picker — no auth
- Several games are actually fun: Wit Showdown (scoring OK), Draw & Guess (canvas + TV mirror), Friend Sort (majority scoring OK), Forbidden Clue (secrets stay on the giver phone), Four in a Row / Tic-Tac-Toe / Paddle Clash (core mechanics)
- Family vs 18+ **does** change some pools (Fact Check, Star Rate). In others it is a badge-only no-op (Team Charades, Forbidden Clue, Split the Room) — those are bugs, not intended.

## Layout of this folder

```
qa-playtest/
  README.md     ← you are here
  INDEX.md      ← 31-game checklist with one-line outcomes
  lobby.md      ← host / join / picker / playlist
  games/*.md    ← one Cursor-ready report per game
```
