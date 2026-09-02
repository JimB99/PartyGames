# PartyGames QA findings

Structured audit from automated simulators, content heuristics, and targeted UX fixes (Aug 2026).

**Legend:** severity — `critical` | `high` | `medium` | `low` | `fixed`

## Content pipeline

| Game | Issue | Severity | Status | Notes |
|------|-------|----------|--------|-------|
| Fact Check (`fact-check`) | 80 mature entries shared identical truth "That's what my therapist said!" | critical | fixed | Import script now dedupes placeholders; pool extended from wit-showdown with unique truths |
| Reverse Fact (`reverse-fact`) | Only 15 trivia pairs; fact always gave away question | critical | fixed | Rebuilt from quiz/timeline (4000+ pairs) with triviality filter |
| Fact Check (`fact-check`) | Mature prompts mis-tagged as family | high | fixed | `isMatureText` re-rating on import |
| All prompt pools | No CI gate on duplicate truths or ordering | medium | fixed | `content-validation.test.ts` heuristics |

## Arcade / strategy UX (user-reported)

| Game | Issue | Severity | Status | File |
|------|-------|----------|--------|------|
| Block Stack | Swipes broken; board not full-screen | critical | fixed | `BlockStackBoard.tsx`, `GameViews.tsx` — gestures on board overlay |
| Block Stack | Rotate on pointerdown conflicted with swipe | high | fixed | Removed separate control panel; tap = rotate |
| Fleet Duel | Could not place boats; misleading UI | critical | fixed | `battleship-engine.ts`, `FleetDuelPlacement.tsx` |
| Fleet Duel | Fleet auto-placed at phase start | high | fixed | Empty fleet start; auto-place only on timer |
| Fleet Duel | No random placement | medium | fixed | `fleet_duel_random` action + button |
| Fleet Duel | No fleet sunk/remaining status | medium | fixed | `FleetDuelFleetStatus.tsx` |
| Fleet Duel | Opponent ships revealed on partial hit | medium | fixed | Opponent grid shows hits/misses; sunk ships only when fully destroyed |

## Per-game audit matrix (automated + code review)

Simulators run min/max players to `ended` phase. Manual browser pass still recommended for TV readability and touch targets.

### Social & voting

| Game | Min | Typical | Max | Settings | Bots | Multi-round | Late game | Notes |
|------|-----|---------|-----|----------|------|-------------|-----------|-------|
| Fact Check | pass | pass | pass | family/mature/speed | n/a | pass | pass | Pool quality gates added |
| Wit Showdown | pass | pass | pass | family/mature/difficulty | n/a | pass | pass | — |
| Would You Rather | pass | pass | pass | family/mature/difficulty | n/a | pass | pass | — |
| Caption This | pass | pass | pass | family/mature/difficulty | n/a | pass | pass | — |
| Reverse Fact | pass | pass | pass | family/mature | n/a | pass | pass | New content pool |
| Hot Seat | pass | pass | pass | family/mature | n/a | pass | pass | — |

### Party & teams

| Game | Min | Typical | Max | Settings | Bots | Multi-round | Late game | Notes |
|------|-----|---------|-----|----------|------|-------------|-----------|-------|
| Bracket Battle | pass | pass | pass | family/mature | n/a | pass | pass | Bracket finals via simulator |
| Friend Sort | pass | pass | pass | family/mature | n/a | pass | pass | Max 8 players |
| Impostor | pass | pass | pass | family/mature | n/a | pass | pass | Final-3 via full session |
| Team Charades | pass | pass | pass | family/mature | n/a | pass | pass | — |
| Last on the Dike | pass | pass | pass | n/a | n/a | pass | pass | Tie-bid logic covered in unit tests |

### Trivia

| Game | Min | Typical | Max | Settings | Bots | Multi-round | Late game | Notes |
|------|-----|---------|-----|----------|------|-------------|-----------|-------|
| Quick Quiz | pass | pass | pass | display/speed/mature | n/a | pass | pass | — |
| When Was It | pass | pass | pass | pts/year off | n/a | pass | pass | — |

### Creative

| Game | Min | Typical | Max | Settings | Bots | Multi-round | Late game | Notes |
|------|-----|---------|-----|----------|------|-------------|-----------|-------|
| Draw & Guess | pass | pass | pass | family/mature | n/a | pass | pass | Canvas not E2E-drawn |

### Arcade

| Game | Min | Typical | Max | Settings | Bots | Multi-round | Late game | Notes |
|------|-----|---------|-----|----------|------|-------------|-----------|-------|
| Trail Dash | pass | pass | pass | bots/rounds/time | 0–7 | pass | pass | Bot panel wired |
| Word Rush | pass | pass | pass | difficulty | n/a | pass | pass | — |
| Block Stack | pass | pass | pass | n/a | n/a | pass | pass | UX fixes applied |

### Strategy

| Game | Min | Typical | Max | Settings | Bots | Multi-round | Late game | Notes |
|------|-----|---------|-----|----------|------|-------------|-----------|-------|
| Fleet Duel | pass | pass | pass | duel/royale by count | n/a | pass | pass | Placement UX fixed |
| Four in a Row | pass | pass | pass | bracket @ 3–4p | n/a | pass | pass | — |
| Tic-Tac-Toe | pass | pass | pass | n/a | n/a | pass | pass | Bracket bye handling |

## Remaining manual checks (low automation coverage)

| Area | Severity | Recommendation |
|------|----------|----------------|
| TV host layout at 1280×720 | medium | Spot-check timer/reveal text size per game in browser |
| Phone touch targets ≥44px | medium | Verify lobby + voting buttons on 390×844 |
| Reverse Fact fun factor | medium | Sample 20 rounds in play; Jeopardy-style answers may still feel guessable |
| Draw & Guess touch drawing | low | Manual canvas test on real device |
| Mature API harvest | low | Run full `import-content` (network) periodically for fresh mature pools |

## Test coverage added

- Content: duplicate truth rate, reverse-fact triviality sample, ordering detection, family vs mature pool diff
- Battleship: empty fleet start, manual/random place, timer auto-place
- Tetris: `parseBlockStackGesture` unit tests
- Smoke: multi-round assertion for fact-check/wit-showdown
- E2E: battleship random fleet + tetris board swipe

---

## Post–full-import content audit (Aug 2026)

Full `import-content` run completed (OpenTDB, party-game-sentences, nhie.io, TruthOrDareBot, dwyl dictionary). All 82 content-validation tests pass.

### Pool sizes after import

| Pool | Total | Family | Mature |
|------|------:|-------:|-------:|
| fact-check | 107 | 20 | 87 |
| reverse-fact | 4098 | 4098 | 0 |
| wit-showdown | 1079 | 816 | 263 |
| caption | 225 | 220 | 5 |
| hot-seat | 693 | 672 | 21 |
| quiz | 3659 | 3653 | 6 |
| timeline | 1540 | 1540 | 0 |
| would-you-rather | 407 | 405 | 2 |
| draw / charades | ~2700 each | ~2705 | 2 each |
| bracket categories | 261 | 258 | 3 |
| dictionary | 12018 | — | — |

### Per-game content quality verdict

| # | Game | Q&A quality | “Vs bot” / decoys | Mature spicy? | Verdict |
|---|------|-------------|-------------------|---------------|---------|
| 1 | Fact Check | Family: excellent (20 witty hand-crafted). Mature: spicy truths but **80/87** use awkward `"The worst thing about this is:"` adapter | No bot lies — only player submissions + truth. With 2 players you get **3 options max**; feels thin | **Yes** (sex, nudity, affairs) but prompt phrasing is clunky | Family great; mature content spicy but poorly framed; pool repeats fast (107 total) |
| 2 | Wit Showdown | **825/1079** prompts start with `"Worst thing:"` — repetitive template. Rest is varied | Player-written answers only | **Yes** — nhie.io harvest is genuinely adult | Mature mode works; family pool fine; format monotony hurts replay |
| 3 | Would You Rather | 407 solid pairs; only **2 mature** | Vote-only, no bots | **No** — mature pool essentially empty | Mature setting does almost nothing |
| 4 | Caption This | 225 image prompts; family OK | Player captions only | **Mild** — 5 mature captions, some spicy | Mature barely exists |
| 5 | Reverse Fact | Quiz-derived pairs (2566) are good Jeopardy style. **1532 timeline entries share identical truth** `"In what year did this take place?"` — once seen, always pick that | Player decoy questions only; no bot fillers | N/A (no mature pool) | Biggest remaining content bug: timeline slice is a metagame (“pick the year question”) |
| 6 | Hot Seat | 693 prompts; mature wrapped in `"What they'd say about:"` | Player answers only | **Moderate** — 21 mature, some explicit | Playable; adapter text is stiff |
| 7 | Bracket Battle | 261 category names | Player submissions | 3 mature categories only | Categories fine; mature thin |
| 8 | Friend Sort | Uses bracket categories as roles | N/A | Same as bracket | Fine |
| 9 | Impostor | No text content — procedural sync/pattern/code tasks | N/A | N/A | Content N/A; tasks are fine |
| 10 | Team Charades | 2707 words, family-heavy | N/A | 2 mature words | Word pool is large and usable |
| 11 | Last on the Dike | No question content | N/A | N/A | N/A |
| 12 | Quick Quiz | 3659 trivia mostly solid; **6 “mature” are yes/no** (`"Have you ever..." → Yes`) — useless as quiz | No bots | **Tagged mature is not spicy** — lazy NHIE conversion | Family/mixed trivia good; **disable or fix mature quiz** |
| 13 | When Was It | 1540 historical events; ~87 very short | N/A | No mature mode | Good variety; some terse events |
| 14 | Draw & Guess | 2700 draw words; 2 mature | N/A | Effectively none | Strong word list |
| 15 | Trail Dash | N/A | **Bots use raycast steering** — reasonable arcade opponents, not content-related | N/A | Bots feel OK for filler; not “guess the bot” |
| 16 | Word Rush | 12k dictionary | N/A | N/A | Dictionary solid |
| 17–20 | Tetris / Fleet Duel / Connect4 / TTT | N/A | N/A | N/A | No content pools |

### Mature content summary

| Rating | Assessment |
|--------|------------|
| **Actually spicy** | Quiplash mature (263), Fibbage mature (87), Hot Seat mature (21), Caption mature (5) |
| **Not spicy / broken** | WYR mature (2), Quiz “mature” (6 yes/no), Draw/Charades mature (2 each), Bracket mature (3 categories) |
| **Missing mature** | Reverse Facts, Timeline — family only |

### Recommended fixes (priority)

1. ~~**Reverse Facts** — exclude timeline template~~ **Done** — quiz-only pool (2600+), no duplicate year question.
2. ~~**Fibbage mature** — improve adapter~~ **Done** — statement truths, question-form rejected, 582 entries (200+ min).
3. ~~**Quiplash** — cap `"Worst thing:"`~~ **Done** — rebalanced to ~20% max via `rebalanceWitShowdownPrefixes`.
4. ~~**Quiz mature** — remove yes/no NHIE~~ **Done** — confession-style yes/no filtered; mature tagged via keyword scan.
5. **WYR / draw / charades mature** — WYR API harvest increased; mature still thin in some pools (caption 5+, draw from dares).
6. ~~**Fibbage family** — expand beyond 20~~ **Done** — `generateFactCheckFamilyPairs` + wit-showdown mature extension.
7. ~~**Voting truth obviousness**~~ **Done** — `isFactCheckTruthValid`, `isObviousBluffTruth` CI checks; house decoys in bluff engine when <4 options.

### Post-fix pool snapshot (full import)

| Pool | Count | Mature |
|------|------:|-------:|
| fact-check | 582 | ~500 |
| reverse-fact | 2627 | 0 |
| wit-showdown | 1779 | ~300 |
| caption | 230 | 5+ |
| hot-seat | 712 | 20+ |
| quiz | 3732 | keyword-tagged |
| timeline | 1540 | 0 |
| would-you-rather | 409 | API harvest |
| draw / charades | ~2700 | dare-derived |
| bracket | 261 | 77 |

All pools meet **200+ minimum** (CI enforced via `MIN_CONTENT_POOL_SIZE`).

## Remediation gate (Sep 2026)

| Area | Status | Notes |
|------|--------|-------|
| Contract tests (31 games) | pass | min/max player smoke + malformed action guards |
| Content audit | pass (errors) | 0 errors; **22 warnings** at the 200/50 bar — see `docs/audit-2026-09.md` |
| `GameViewById` typed snapshots | done | `assembleHostView` / `assemblePlayerView` in `game-view-types.ts`; `pnpm typecheck` green |
| GameViews modularization | partial | `HostGameContent.tsx` (~598) + `PlayerGameContent.tsx` (~1156) + panels; not per-game modules |
| Viewport E2E matrix | spec exists | `e2e/viewport-matrix.spec.ts` + `pnpm test:e2e:viewport` — **not CI-green** (lobby Start / accordion) |
| WYR scoring | done | participation + others-only majority prediction |
| Hot Seat skip | done | `hot_seat_skip` action, no penalty |
| Agent Grid repeated cell | done | server rejects already-revealed guesses |
| Role Sort self-assign | done | server validation + deterministic ties |
| Dead code cleanup | done | `BlockStackPhoneControls`, `renderGameSettings` removed |

---

## Full audit pass (Sep 2026)

Deliverable: [`docs/audit-2026-09.md`](audit-2026-09.md). Confirmed engineering fixes from that pass only:

| Item | Severity | Status | Notes |
|------|----------|--------|-------|
| Server/client typecheck (`HostViewSnapshot` vs `room.ts`) | high | fixed | Assemblers + client Vite env + loose `data` in monoliths |
| WYR `scoringRules` said no points | high | fixed | Copy matches +200 / +800 others-majority / +400 tie |
| Content audit min pool 20 | medium | fixed | Inventory at 200 family / 50 mature; orphans flagged; `caption.json` kept (P3 register) |
| README Friend Sort / When Was It vs IDs | low | fixed | ID ↔ display-name table |
| `usePartyRoom` `GameAction` inferred `never` | medium | fixed | Host skip / player actions typecheck |
| Verify gate | medium | fixed | `pnpm verify` includes dead-export scan; optional viewport + `--strict-pools` |

Do not treat the Aug “all pools meet 200+” snapshot as current — crowd-call (5), spectrum (8), and split-room (8) are P0 thin pools. **Caption This** is content + engine mode only; it is **not** in `registry.ts`.


