# PartyGames post-fix retest — 2026-08-31

Live: https://party-games.jimb99.workers.dev/  
Handoff: `HANDOFF.md` (Cursor claimed Worker `c70ad5f6-fe20-4d06-8db3-aa73d6b5ea7f`)  
Method: 1 host TV (~1280px) + 2–4 phones at **390×844** in separate Chrome profiles. Room WQHF for the whole session.

**Cursor: this folder is the retest of the previous `qa-playtest/` pass.** Old bugs that now PASS should not be re-fixed. FAIL items below still need product fixes. Do not file Trail Dash steering (still out of scope). Caption This is gone. Out of Place is gone.

## What actually shipped (keep)

Cross-cutting platform is in good shape:

1. **Back to lobby** clears phones (including secrets) within ~2s
2. **Submit lock-in** works on trivia/bluff/vote games
3. **Session Σ** adds once (no 2×) when the game total is correct
4. **Timer bar** full-width, ~1:1 on timed games we measured
5. **`/play` at 390px** — no horizontal page overflow
6. **Host room code persists** across refresh

Old blockers that are **fixed**: Word Rush tile-words, Crowd Call 5× timer, Hot Seat named seat, Bracket Battle start-round, Chain Sketch blank phones, Grid Blast instant bombs, Hangman 2× timer.

## Still broken — fix next (priority)

### Blockers / unplayable

| Game | Issue |
| --- | --- |
| **Spectrum** | Scoring still always 0 (old blocker **not** fixed). Guess phase sometimes skipped; one lock-in ends the round. |
| **Fleet Duel** | 4p never ends; TV boards truncated; every phone mirrors P1; no hits. |
| **Tic-Tac-Toe** | 4p bracket stalls on `P1 vs ?` after match 1. No winner banner. |
| **Hot Seat** | Reveal/ended blank; 0 scores; Family served a BDSM prompt. |
| **Block Stack** | Swipe left/right/drop do not steer; rotate/hold work. Confirm on a real phone. |

### High — scoring still wrong

| Game | Issue |
| --- | --- |
| **Quick Quiz** | First-joined player answering **ends the round** while others still have time (speed scoring?). |
| **Forbidden Clue** | Round panel correct; header `g` re-adds team totals every round (18+ ended at 20500). |
| **Team Charades** | Points go to a non-actor and inflate every round. |
| **Draw & Guess** | Round 2 can skip drawing; last-round points double-counted into game total. |
| **Chain Sketch** | 3rd-player guess dropped; only chain starter scores. |
| **Paddle Clash** | Banner `P2 wins 3–3!` when arena is 7–3; 2v2 winning teammate told “You lost”. |
| **Word Rush** | Tile-letter gibberish accepted (`CEBRAF`); real `BE` rejected. Copy says length×100, awards look like speed buckets. |

### Content / settings (badge-only or broken pools)

| Game | Issue |
| --- | --- |
| **Fact Check 18+** | Double prefix `The worst thing about this is: Worst thing: …`; prompt appears as a vote option. |
| **Reverse Fact** | House lines are statements with `?` glued on; apostrophes stripped (`Belgiums`). No 18+ toggle. |
| **Team Charades 18+** | Badge only; pool still tame (`brunette`, `skier`). TV leaks the next word. Family had “Try to lick your own nose”. |
| **Split the Room 18+** | Badge only; Family prompt `Working from home` reused. |
| **Forbidden Clue 18+** | Pool **does** differ (fix confirmed). |
| **Star Rate 18+** | Pool **does** differ (fix confirmed). |
| **Paddle Clash** | **No options panel** — hockey unreachable. |
| **Agent Grid** | Guess count not enforced; Family board is all obscure `a-` dictionary words. |

## Clean passes (don’t churn)

When Was It, Last on the Dike, Star Rate, Crowd Call, Grid Blast, Impostor, Wit Showdown, Friend Sort, Would You Rather (blank ended only), Bracket Battle (start-round fixed), Trail Dash scoring/power-up gating (steering still out of scope), Hangman Race (empty Solve = 2 strikes).

## Layout

```
party-games-retest/
  README.md      ← you are here
  HANDOFF.md     ← Cursor’s claimed fixes
  INDEX.md       ← checklist
  lobby.md       ← platform
  games/*.md     ← one file per title
  screenshots/   ← playtest captures
```
