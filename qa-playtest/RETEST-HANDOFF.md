# Party Games — Grok retest fix handoff

**Live URL:** https://party-games.jimb99.workers.dev/  
**Last deploy:** 2026-09-01 (`1e8be267…`) — includes QA follow-up pass  
**Games in catalog:** 29 (Caption This removed)

---

## What this pass fixed

### Blockers

| Game | Fix |
|------|-----|
| **Spectrum** | Clue timeout no longer skips guess/scoring; guessers counted from live `ctx.playerIds`; cumulative scores + reveal deltas on TV |
| **Tic-Tac-Toe (4p)** | Semifinal 2 plays before bracket advances (`matchIndex` increment) |
| **Fleet Duel (4p)** | Royale target picker per opponent; your-waters vs enemy-waters shots fixed; per-target grids in player view |
| **Hot Seat** | `getRoundScores` → `cumulativeScores`; mis-rated mature prompts re-rated in content |
| **Block Stack** | Touch swipe uses `useRef` (left/right/drop work on phone) |

### Scoring / gameplay

| Game | Fix |
|------|-----|
| **Quick Quiz** | Round advances only when every connected player answered; stale answer keys pruned; `lastRoundScores` for round panel |
| **Forbidden Clue** | `roundScoresAreCumulative: true` (header `g` no longer inflates) |
| **Team Charades** | Same cumulative flag; TV no longer leaks word on reveal |
| **Draw & Guess** | Round transition resets state; final-round double commit prevented in `room.ts` |
| **Chain Sketch** | Active guesser’s text used; multi-player chain scoring |
| **Paddle Clash** | Team scores in ended banner; 2v2 teammates share win; hockey/pong options panel visible |
| **Word Rush** | Dictionary required when loaded; gibberish from tiles rejected |

### Content / settings

| Game | Fix |
|------|-----|
| **Fact Check 18+** | 75 mature prompts deduplicated (`prompt` vs `truth`); decoys exclude prompt text |
| **Reverse Fact** | `supportsMatureContent: true` |
| **Split the Room 18+** | Mature pool exclusive (not appended to family) |
| **Team Charades** | “Lick your own nose” re-rated mature |
| **Agent Grid** | Guess count decrements on `continue`; family word pool filters obscure `a-` words |

### Platform

| Fix |
|-----|
| **Lobby persistence** — Durable Object storage restores session/players on cold start (fixes 3rd-player join wiping totals) |

---

## Still out of scope

- Trail Dash steering
- Full Fact Check decoy grammar overhaul

### QA follow-up (deployed 2026-09-01)

- Blank ended screens (WYR, Bracket), Hangman empty solve, FiAR 4p bracket, back-to-lobby confirm, host options clip
- Paddle goal points + win bonus; Reverse Fact decoy filtering; Team Charades Solo/Teams toggle
- Charades 18+ pool expansion; hot-seat family content audit; room-scores regression tests

---

## Retest priority (Grok setup)

Host ~1280px + phones **390×844**, separate profiles.

1. Spectrum — full round: clue → all guess → non-zero scores  
2. TTT 4p — both semifinals then final  
3. Fleet Duel 4p — fire at chosen target, game ends with one survivor  
4. Hot Seat — Family content, reveal + scores  
5. Block Stack — swipe steer on real phone  
6. Quick Quiz — P1 answers first; round waits for P2  
7. Forbidden Clue — 3 rounds, header `g` stable  
8. Paddle Clash — hockey toggle + 2v2 win message  

---

## Tests

`pnpm test` — shared 100/100, server 121/121 (4 WS skipped)

---

## Deploy

```bash
cd PartyGames && pnpm build && npx wrangler deploy
```
