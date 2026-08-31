# Party Games QA

Live site: https://party-games.jimb99.workers.dev/
Repo: https://github.com/JimB99/PartyGames

## How findings are written

One markdown file per game, Cursor-ready: repro, expected vs actual, severity, screenshots.
Hand a file to Cursor to fix that game. Do not start with GitHub issues.

## Test method

- Host: TV / large desktop viewport (`/host`)
- Players: iPhone-sized viewport (~390×844) in separate browser sessions (`/join`)
- Player counts per game: min, typical couch (4), and max if max ≤ 8 (otherwise 8 as crowded couch)
- Settings: defaults first, then the options that actually change content or rules (family/mature, difficulty, speed scoring, game-specific)

## Queue (30 live games)

Status: initial playtest done; **retest against `RETEST-HANDOFF.md`** after 2026-08-31 deploy.

### Trivia / prompt
- [x] Fact Check (min 2 / max 16) — issues: session totals reset, no submit confirm, back-to-lobby doesn't push players
- [x] Wit Showdown (min 3 / max 16) — issues: back-to-lobby stuck phones, self-vote scores, silent 120-char truncate; scoring OK
- [x] Quick Quiz (min 1 / max 16) — blocker: scores reset every round, final 0/0/0; session total frozen; no tap confirm
- [x] Would You Rather (min 2 / max 16) — issues: timer ~3x too fast, A looks pre-selected, blank reveal if no votes, mid-game instructions skip a round
- [x] Reverse Fact (min 2 / max 16) — issues: scores don't accumulate, back-to-lobby stuck phones, no submit/vote confirm
- [x] When Was It / timeline (min 2 / max 16) — issues: scores don't accumulate, back-to-lobby stuck, no lock-in confirm, stale year label
- [x] Word Rush (min 2 / max 16) — BLOCKER: every valid word rejected Invalid; TV blank in play
- [x] Hangman Race (min 2 / max 16) — issues: timer ~2x fast, words all start with a, Speed Off ignored, back-to-lobby stuck
- [x] Crowd Call (min 3 / max 16) — BLOCKER: timer ~5x fast, scores stuck at 200, predict-locks-out-answer
- [x] Star Rate (min 3 / max 16) — issues: scores overwrite each round, flat 1500 regardless of stars, Family leaks adult prompt
- [x] Split the Room (min 3 / max 16) — issues: scores award once then freeze, unused type-answer phase, 18+ same pool
- [x] Hot Seat (min 3 / max 10) — BLOCKER: no hot-seat player, raw pronoun placeholders, TV blank on pick
- [x] Bracket Battle (min 4 / max 16) — BLOCKER: Start round on instructions ends the game; 1-entry bracket still pays +2000

### Creative / talking
- [x] Draw & Guess (min 3 / max 12) — playable; issues: scores don't accumulate, guessers blank 60s, no Done drawing
- [x] Chain Sketch (min 3 / max 8) — BLOCKER: phones blank until reload every phase, Draw: ?, previous sketch never shown
- [x] Team Charades (min 3 / max 12) — issues: no teams, TV blank while acting, 18+ words unchanged
- [x] Spectrum (min 3 / max 12) — BLOCKER: scoring always 0; clue+guess share one timer; reveal has no guess markers
- [x] Friend Sort / role-sort (min 3 / max 8) — playable; scoring OK; no submit confirm, TV blank during assign

### Hidden role / social
- [x] Impostor (min 4 / max 10) — issues: no accuse UI on crew phones, scores don't accumulate, secret stuck on phones after lobby
- [x] Agent Grid (min 4 / max 12) — issues: guesser phones blank on clue, tap ends turn at 2, 18+ truncated dares
- [x] Forbidden Clue (min 4 / max 12) — issues: points only to giver, 18+ same deck, dead Submit clue box
- [x] Last on the Dike (min 4 / max 16) — issues: SESSION TOTAL 2x, ranking ignores survivors, ends at round 2/3

### Realtime / board
- [x] Trail Dash (min 1+bot / max 8) — BLOCKER: humans can't steer / die instantly; TV dropped to lobby mid-round
- [x] Block Stack (min 2 / max 8) — issues: gravity too fast (~10s rounds), only last round scores, round 1 always 0-0
- [x] Fleet Duel (min 2 / max 8) — issues: hit and miss look identical, no in-round score
- [x] Four in a Row (min 2 / max 4) — playable; SESSION TOTAL doubles, no win highlight, phone/TV color mismatch
- [x] Tic-Tac-Toe (min 2 / max 8) — playable; board vanishes on win, SESSION TOTAL doubles, stuck-lobby
- [x] Paddle Clash (min 2 / max 4) — playable; no pong/hockey setting, no win presentation, stuck-lobby
- [x] Grid Blast (min 2 / max 8) — BLOCKER: bombs instant-kill the placer, movement barely works

## Report template

Each `games/<id>.md` uses:

```
# <Game name>
Status: pass | issues
Tested: <date>, players <n>, viewport host TV + players iPhone

## Bugs
### <short title>
- Severity: blocker | major | minor
- Players / settings:
- Repro:
- Expected:
- Actual:
- Screenshot:

## Improvements
- ...
```
