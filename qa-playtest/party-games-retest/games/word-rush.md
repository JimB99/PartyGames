# Word Rush — post-fix retest
Status: issues (old blocker fixed; dictionary + scoring still wrong)
Tested: 2026-08-31, players 2, defaults (Difficulty Mixed, Speed scoring Rank by speed), 3 rounds × 60s
Room: WQHF

## Handoff checks

[PASS] Tile-word validation (old BLOCKER)
Expected: valid words from tiles accepted
Actual: R1 tiles V A E G L D T — P1 "GAVE" Valid ✓ +1000g. R2 C L H A Y D E — "CLAY" and "HEAD" Valid. No blanket Invalid.
Screenshot: screenshots/wr-r1-p1-valid-GAVE-accepted-lockin.webp
Old vs new: **old blocker fixed**.

[PASS] Letters not on tiles still reject
Actual: P2 "BRICK" → Invalid ✗, 0g
Screenshot: screenshots/wr-r1-reveal-p1-valid-1000g-p2-BRICK-invalid.webp

[PASS] Submit lock-in
Actual: green Submitted! “WORD” Waiting for other players…
Screenshot: screenshots/wr-r2-p1-lockin-CLAY.webp

[PASS] Scores accumulate / final non-zero
Actual: P1 0→1000→2000; P2 0→25→1025→2025; final P2 2025, P1 2000
Screenshot: screenshots/wr-final-scores-p1-2000-6000sum-p2-2025-6025sum.webp

[PASS] Session Σ added once
Actual: prior 4000/4000 → P1 6000 (+2000), P2 6025 (+2025). Lobby SESSION TOTAL 6025 / 6000
Screenshot: screenshots/wr-back-to-lobby-phones-waiting-sessiontotals.webp

[PASS] Timer bar
Actual: full-width, 60s→0 in sync host + phones
Screenshot: screenshots/wr-r1-start-tiles-timer.webp

[PASS] Back to lobby
Actual: phones waiting within ~2s
Screenshot: screenshots/wr-back-to-lobby-phones-waiting-sessiontotals.webp

## New bugs

### No dictionary: tile-letter gibberish accepted; short real words rejected
- Severity: major
- Old vs new: **new** (old bug was the opposite: everything Invalid)
- Repro: R3 tiles include R C E A B P F. Submit "CEBRAF" (gibberish, tiles only). Submit "BE" (English, tiles only).
- Expected: dictionary rejects CEBRAF; BE accepted (or min-length shown).
- Actual: CEBRAF Valid ✓ +1000g; BE Invalid ✗ 0g with no reason.
- Screenshot: screenshots/wr-r3-BUG-gibberish-CEBRAF-valid-BE-invalid.webp

### Scores don't match stated rule
- Severity: minor
- Expected: instructions "Valid words score length × 100" → 4 letters = 400
- Actual: GAVE=1000, CLAY=1000, HEAD=25, 6-letter gibberish=1000. Looks like speed-rank buckets, never explained in-round.
- Screenshot: screenshots/wr-r2-both-valid-scores-p1-2000-p2-25.webp
