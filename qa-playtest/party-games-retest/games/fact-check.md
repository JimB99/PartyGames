# Fact Check — post-fix retest
Status: issues (scoring/platform PASS; 18+ content FAIL)
Tested: 2026-08-31, players 2 (P1 blue first-joined, P2 pink), Family then 18+
Room: WQHF (session continued from Quick Quiz)

## Handoff checks

[PASS] Submit lock-in
Expected: phone locked/waiting after fake fact / vote
Actual: green "Submitted! … Waiting for other players…" and "Vote recorded · Waiting for other players…"; no re-submit
Screenshot: screenshots/fc-r3-p1-submit-lockin-host-1of2.webp

[PASS] Host waiting count
Expected: (n/2) increments; advances only when both in or timer expiry
Actual: 0/2 → 1/2 → waits
Screenshot: screenshots/fc-r3-p1-submit-lockin-host-1of2.webp

[PASS] Timer bar
Expected: full-width, tracks countdown
Actual: full-width on host and phones, depletes with seconds
Screenshot: screenshots/fc-r1-host-vote-timer-0of2.webp

[PASS] Scores accumulate (g)
Expected: g stacks across rounds
Actual: P1 0g → 1000g (r3) → 2000g (r5); no reset
Screenshot: screenshots/fc-r5-scores-accumulated-2000g.webp

[PASS] Final board non-zero
Expected: ended shows game totals
Actual: Final scores P1 2000, P2 0 at Round 5/5 · ended
Screenshot: screenshots/fc-ended-host-fullpage.png

[PASS] Session Σ not doubled
Expected: prior session (P1 2000 / P2 4000 from Quick Quiz) + this game (2000 / 0) = 4000 / 4000
Actual: lobby SESSION TOTAL P1 4000, P2 4000 — exact
Screenshot: screenshots/fc-back-to-lobby-phones-waiting-session-4000-4000.webp

[PASS] Back to lobby
Expected: phones waiting within ~2s
Actual: both phones waiting <2s after family and after 18+ (18+ showed "Return to lobby?" confirm)
Screenshot: screenshots/fc-back-to-lobby-phones-waiting-session-4000-4000.webp, screenshots/fc-18plus-back-to-lobby-phones-waiting.webp

[PASS] Early-reveal on first-joined submit
Expected: round waits for all players
Actual: P1 submit with 5s left held at (1/2); vote phase also held. Reverse order also waited. (Unlike Quick Quiz.)
Screenshot: screenshots/fc-18plus-r1-p1-submit-lockin-waits-1of2.webp

[FAIL] 18+ decoys / prompts plausible
Expected: grammatically plausible, consistent-style answers
Actual: three problems in 2 rounds:
1. Double template prefix: "The worst thing about this is: Worst thing: surprised someone butt-naked."
2. Decoys leak raw template prefix; one option is the prompt text itself.
3. Style mismatch: real "hidden porn in my room." vs full-sentence decoys.
Screenshot: screenshots/fc-18plus-r2-malformed-prompt-double-prefix.webp, screenshots/fc-18plus-r2-decoys-template-prefix-leak.webp
Old vs new: **old** finding (better 18+ decoys was in the handoff as a shipped fix) — **not actually fixed**.

## New / still open

### Family decoys are word-salad
- Severity: minor
- Actual: "mildly haunted yogurt and a limp handshake from fate", "unlicensed dolphins and moist congress", "aggressive politeness, but make it weaponized nostalgia" vs short human answers.
- Old vs new: same class as original decoy-quality complaint.

### Observation: first round skipped submit
- Low confidence. After Start game, Round 1/5 opened already in vote with house decoys (26s, 0/2). Later rounds had submit. Possibly "Start round" during instructions.
- Screenshot: screenshots/fc-r1-host-vote-timer-0of2.webp
