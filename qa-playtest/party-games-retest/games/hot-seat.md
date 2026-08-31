# Hot Seat — post-fix retest
Status: issues (old blocker fixed; scoring/content/reveal broken)
Tested: 2026-08-31, players 3, Family Mixed, 4/4 rounds
Room: WQHF

## Handoff checks

[PASS] Hot-seat player assigned (old BLOCKER)
Expected: named player in the hot seat
Actual: "P1/P3/P2 is in the hot seat" every round. 4 rounds, 3 distinct targets.
Screenshot: screenshots/hs-02-BUG-family-adult-prompt-P1-hotseat.webp
Old vs new: **old blocker fixed**.

[PASS] Personalized prompts, no raw placeholders
Actual: "What would P1 say about: …". No braces. Minor grammar: "P3's what is the worst gift you've ever received"
Screenshot: screenshots/hs-04-round2-P3-hotseat-phones.webp

[PASS] TV pick phase
Actual: host cycles submit → pick → reveal → scoreboard; hot-seat phone gets tappable answer card
Screenshot: screenshots/hs-07-host-pick-phase-answer-card.webp

[PASS] Lock-in
Actual: green Submitted! waiting
Screenshot: screenshots/hs-05-lockin-submitted-P3.webp

[PASS] Timer bar present on host and phones

[PASS] Back to lobby
Actual: 3 phones waiting immediately
Screenshot: screenshots/hs-11-back-to-lobby-phones-waiting.webp

## New / still open

### Family setting serves 18+ prompt
- Severity: major
- Old vs new: **new** (or unfixed content filter)
- Repro: Content = Family. Round 1 prompt: "If you were/are into BDSM stuff…"
- Screenshot: screenshots/hs-02-BUG-family-adult-prompt-P1-hotseat.webp

### Reveal and ended screens blank
- Severity: major
- Actual: Round N · reveal and Round 4/4 · ended empty — no answers, no scores
- Screenshot: screenshots/hs-08-BUG-blank-reveal-host.webp, screenshots/hs-09-BUG-ended-blank-no-scores.webp

### No scores awarded / Σ unchanged
- Severity: major
- Expected: +1000 if hot seat picks your answer
- Actual: P2 picked P3's answer in r3; all stayed 0g; session still P1 5000 / P2 5000 / P3 4000
- Screenshot: screenshots/hs-09-BUG-ended-blank-no-scores.webp, screenshots/hs-12-host-lobby-session-unchanged.webp

### Phone timer desync with host Pause/+30s
- Severity: minor
- Actual: host paused at 25s, phones drained to 0; after +30s host 54s vs phones 32s
- Screenshot: screenshots/hs-10-BUG-timer-desync-phone32-host54.webp

### Non-hot-seat phones blank during pick
- Severity: minor
- Actual: empty body, no "waiting for P2 to pick"
- Screenshot: screenshots/hs-06-pick-phase-phones-hotseat-only.webp

### Hot-seat player answers their own prompt
- Severity: minor
- Actual: target also gets the answer box; host waits 0/3 including them
- Screenshot: screenshots/hs-04-round2-P3-hotseat-phones.webp
