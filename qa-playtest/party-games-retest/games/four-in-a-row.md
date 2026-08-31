# Four in a Row — post-fix retest
Status: pass (win line + Σ; 4p bracket incomplete)
Tested: 2026-08-31, players 4, defaults, room WQHF

## Handoff checks

[PASS] Playable board
Actual: column ▼ drops; TV mirrors; turn P1 → P3 → …
Screenshot: screenshots/fiar-00-start-board.webp

[PASS] Winner banner + win line on ended
Actual: M1 P1 4-in-a-row yellow rings. Final: "P1 wins!" yellow banner, highlighted discs, board visible, Play again / Back to lobby
Screenshot: screenshots/fiar-01-match1-win-line.webp, screenshots/fiar-02-ended-winner-banner-scores.webp

[PASS] 4p bracket does not TTT-stall
Actual: match 2 auto-started ~2s as P1 vs P2. No "P1 vs ?"
Screenshot: screenshots/fiar-04-match2-started-no-stall.webp

[PASS] Session Σ once
Actual: game P1 1000 / others 200 → Σ 21750 / 11500 / 9456 / 4400
Screenshot: screenshots/fiar-02-ended-winner-banner-scores.webp

[PASS] Back to lobby <1s
Screenshot: screenshots/fiar-03-back-to-lobby-session.webp

## New bugs

### 4-player bracket skips P4
- Severity: minor
- Actual: only M1 P1vP3 and M2 P1vP2. P4 never played, still got 200g. Expected P2vP4 then final.

### Round counter stuck at 1/4
- Severity: minor
- Actual: "Round 1/4 · ended" after two matches.
