# Party Games — post-fix retest handoff

**Live URL:** https://party-games.jimb99.workers.dev/  
**Deployed:** 2026-08-31 (Worker version `c70ad5f6-fe20-4d06-8db3-aa73d6b5ea7f`)  
**Games in catalog:** 30 (Caption This removed; Out of Place superseded by Impostor)

Use this document as the single source of truth for the next playtest. Historical per-game reports in `games/*.md` describe *old* bugs; verify fixes here instead of re-filing those verbatim.

---

## How to test

| Role | URL | Viewport |
|------|-----|----------|
| Host (TV) | `/host` | Large desktop (~1200px+) |
| Players | `/join` → room code → `/play` | **390×844** (iPhone, or better even Android if possible). Do not use ~500px — old layout bug was min-width overflow. |

**Setup:** 1 host + at least min players per game in **separate browser sessions** (not tabs sharing storage). Hard-reload all windows after deploy.

**Settings matrix (when relevant):**
- Family vs 18+ content
- Speed scoring on vs off (trivia / bluff games only — WYR has no speed scoring)
- Trail Dash: power-ups **off** vs normal
- Paddle Clash: pong vs hockey mode

---

## What shipped in this deploy

### Cross-cutting platform

| Change | Why | What to verify |
|--------|-----|----------------|
| **`player_view_clear` on back to lobby** | Phones stayed frozen on ended/submit screens | After host taps Back to lobby, every phone shows waiting/lobby — not old game UI or secret words |
| **Session Σ scoring** | Totals doubled or stayed frozen (Four in a Row, Tic-Tac-Toe, Last on the Dike, etc.) | Play 2+ rounds; session total increases once per game, not every tick; no 2× round score |
| **In-game `g` cumulative scores** | Quick Quiz, Fact Check, Reverse Fact, When Was It reset each round | Round panel shows *this round*; final/ended shows game total; `g` accumulates across rounds |
| **Host timer bar** | Cramped beside sidebar on TV | Full-width timer under phase header on host during timed phases |
| **`timerTotalMs` on 8+ engines** | Progress bar drifted vs countdown | Bar matches seconds remaining on: Bracket Battle, Friend Sort, Draw & Guess, Forbidden Clue, Last on the Dike, Chain Sketch, Grid Blast, Wit Showdown / Hot Seat flows |
| **`ScoringPhase` component** | Arcade games showed session totals on "Round scores" | Trail Dash / Grid Blast `round_end`: panel shows **points earned this round only**; `ended` shows **final totals** |
| **Submit lock-in UI** | Phones gave no feedback after tap | After answer/vote/submit, phone shows locked/waiting state; host count updates |
| **Host room persistence** | New room code every `/host` visit | Revisit `/host` — same room code if sessionStorage intact |
| **`/play` overflow** | Horizontal scroll on 390px | No sideways scroll on player page |

### Game-specific

| Game | Fix | Verify |
|------|-----|--------|
| **Caption This** | **Removed** from catalog (no image pipeline) | Card absent from picker; no broken game slot |
| **Impostor** | Replaces "Out of Place" naming | Hidden-role game playable; no "Out of Place" card |
| **Trail Dash** | Jump/Fire hidden when power-ups off; round score labels | With power-ups off: only ◀ ▶ turn buttons; round-end scores are round delta not session total |
| **Trail Dash steering** | **Not fixed** (skipped per product) | Still expect steering issues if testing movement — out of scope |
| **Tic-Tac-Toe** | Board + winning line on ended; session fix | Winner banner; line highlight; back to lobby works |
| **Four in a Row** | Win line on ended; session fix | Same as TTT |
| **Paddle Clash** | Ended UI, paddle mode setting, timer | Winner + score; pong/hockey option applies |
| **Fact Check / Reverse Fact** | Cumulative scores; better 18+ decoys | Scores stack; mature decoys grammatically plausible (not obvious trivia outliers) |
| **Forbidden Clue** | `rating` on cards + mature pool | Family vs 18+ shows different cards |
| **Team Charades** | Expanded mature word pool | 18+ mode clearly different from family (not 3 words) |
| **Would You Rather** | No speed scoring option; reveal/timer fixes | Speed scoring hidden in settings; no mid-game instructions between rounds; reveal shows votes |
| **Bracket Battle** | Start round no longer ends game | Instructions → Start round → submit phase, not instant end |
| **Word Rush** | Letter-tile validation (not broken dictionary) | Valid words from tiles accepted |
| **Chain Sketch** | Word pool + phone views | No blank "Draw: ?"; sketch carries between turns |
| **Hot Seat** | Personalized prompts + hot-seat UI | Target player named; pick phase on TV |

### Content-only (no UI logic)

- `forbidden-clue.json`: all cards have `rating`; 18 mature cards added  
- `charades.json`: mature entries expanded; mis-tagged family sexual prompts moved to mature  

---

## Priority retest checklist

Do these **first** — they were the highest-impact cross-game bugs.

### P0 — Cross-cutting (every game sample)

1. [ ] **Back to lobby:** Host returns to picker → all phones leave game UI within ~2s  
2. [ ] **Submit confirm:** Trivia answer, bluff submit, WYR pick — phone shows locked state  
3. [ ] **Session Σ:** Play one full game → session total matches sum of game scores (no double)  
4. [ ] **Timer bar:** Pick any timed host game → bar width full, tracks countdown  

### P1 — Previously blocked games

| Game | Min players | Focus |
|------|-------------|-------|
| Word Rush | 2 | Words from tiles validate |
| Crowd Call | 3 | Timer speed, scoring updates, predict vs answer phases |
| Hot Seat | 3 | Hot seat player assigned, TV shows pick |
| Bracket Battle | 4 | Start round works; need ≥2 entries |
| Chain Sketch | 3 | Phones show draw/guess each phase without reload |
| Spectrum | 3 | Non-zero scoring when guesses submitted |
| Quick Quiz | 2 | Scores accumulate; final board non-zero |
| Grid Blast | 2 | Movement + bombs; round scores at round end |

### P2 — Scoring / presentation

| Game | Check |
|------|-------|
| Fact Check, Reverse Fact, When Was It | Round + final scores; 18+ decoys |
| Trail Dash | Round-end vs final scores; power-up UI gating |
| Last on the Dike | Survivor ranking; session total |
| Star Rate | Star count affects points; family filter |
| Draw & Guess | Guesser sees canvas; drawer can finish |
| Tic-Tac-Toe, Four in a Row, Paddle Clash | End screen + session + lobby |

### P3 — Settings / content

| Game | Check |
|------|-------|
| Forbidden Clue, Team Charades | Family ≠ 18+ content |
| Would You Rather | No speed scoring in settings |
| Split the Room | Mature scenarios in 18+ |
| Paddle Clash | Pong vs hockey |

---

## Explicitly out of scope (do not file as regressions)

- **Trail Dash human steering / instant death** — known, not fixed this pass  
- **Team Charades "teams" mechanic** — still solo actor; product decision  
- **Paddle Clash 2000/0 winner-takes-all scoring** — intentional unless rules change  
- **Caption This** — removed, not coming back without image pipeline  

---

## Suggested test order (one session)

1. Lobby smoke: join, colors, playlist, start game, back to lobby (2 players)  
2. Quick Quiz (2) — scoring + lock-in + lobby  
3. Fact Check (2) — bluff flow + 18+  
4. Trail Dash (1 human + 1 bot) — power-ups off, round scores, lobby  
5. Tic-Tac-Toe or Four in a Row (2) — end screen + session Σ  
6. Forbidden Clue or Team Charades (4+) — family vs mature  
7. Word Rush or Grid Blast — prior blockers  

---

## Pass / fail reporting

For each checklist item, report:

```
[PASS|FAIL] <item>
Game: <name>  Players: <n>  Settings: <family/mature, etc.>
Expected: ...
Actual: ...
Screenshot: <optional>
```

If FAIL, note whether it matches an **old** finding in `games/<id>.md` or is **new**.

---

## Repo reference

- Monorepo: `PartyGames/` (`packages/client`, `packages/server`, `packages/shared`)  
- Deploy: `pnpm build && npx wrangler deploy` from `PartyGames/`  
- Automated tests passed before deploy: shared 100/100, server 118/118 (4 WS tests skipped)
