# Last on the Dike
Status: issues

Tested: 2026-08-31, players 4 (QA1–QA4), viewports: host ~770x800 (TV), phones 4 tabs in one ~500px window, settings: none (game has no settings rail)

## What worked
- Game is present in catalog under **Party & Teams** ("Bid just enough to survive (based on Ostfriesische Deichwandern)", 4–16 players); greyed out until 4 players joined, enabled at exactly 4.
- Fresh room hosted at /host (code HDLG), "Connecting…" cleared, "Pick a game" visible, 4 phones joined with distinct colors.
- Instructions screen auto-advanced (no need to click "Start round") and showed the scoring rule: 3000 / 1500 / 750 / 250 for other survivors.
- Bid phase: phones show "Balance: N", numeric input, three quick-bid chips (0 / half / all) and a "Bid N" button. Different bids per player accepted; phone showed "Bid locked in — Waiting for other walkers…" (clear confirmation), host counter "Waiting for bids… (0/4)".
- Reveal: TV listed every walker with bid, remaining balance, "off the dike" tag for the lowest bidder, and "+bonus" for the highest bidder. Phones mirrored the TV reveal.
- Eliminated player's phone correctly showed "You fell off the dike / Watch the TV for the results."
- Round 2 correctly dropped to "3 walkers on the dike" with reduced balances (180 / 150 / 125).

## Bugs
1. Severity: major — SESSION TOTAL is double the awarded game points
   - Players/settings: 4 players, no settings.
   - Repro: play one full game; look at header chips and lobby SESSION TOTAL at the end.
   - Expected: session total = points earned this game (3000 / 1500 / 750 / 0) after a single game.
   - Actual: QA1 3000g · 6000Σ, QA2 1500g · 3000Σ, QA4 750g · 1500Σ — every session total is exactly 2× the game points, in the first and only game of the session.
   - Screenshot: /workspace/qa-party-games/last-on-the-dike/host-ended-session-total.png

2. Severity: major — final ranking ignores elimination order; last surviving walker scores 0
   - Repro: R1 bids QA1 20, QA2 50, QA3 80, QA4 0 → QA4 off the dike. R2 bids QA1 100, QA2 30, QA3 60 → QA2 off the dike, QA1 winner, QA3 survived to the end.
   - Expected: survivors ranked above earlier-eliminated players; QA3 (survived, never fell off) should be 2nd or at least get the documented "250 for other survivors".
   - Actual: QA1 3000 (1st), QA2 1500 (2nd — eliminated in R2), QA4 750 (3rd — eliminated in R1), QA3 0 (last, despite surviving every round). The "250 for other survivors" rule from the instructions was never applied to anyone.
   - Screenshot: /workspace/qa-party-games/last-on-the-dike/host-reveal-r2.png

3. Severity: minor — game ends after round 2 of an advertised "Round x/3"
   - Repro: as above; header read "Round 2/3 · bid" then "Round 2/3 · ended".
   - Expected: either 3 rounds, or a header that reflects the real (elimination-driven) round count.
   - Actual: game ended in round 2 while the header still claimed 3 rounds — misleading progress indicator.
   - Screenshot: /workspace/qa-party-games/last-on-the-dike/host-ended-session-total.png

4. Severity: major — "Back to lobby" leaves phones stuck on the ended screen
   - Repro: at the end screen press "Back to lobby" on the host; watch the 4 phone tabs.
   - Expected: phones return to "Waiting for host to start a game…".
   - Actual: host went to the lobby (Pick a game) but all 4 phones kept showing "Last on the Dike · ended" with the R2 reveal list; per-game points reset to 0g while stale results stayed. A manual reload of a phone recovers it (returns to "Waiting for host…"), so state is only a client-side stale view.
   - Screenshot: /workspace/qa-party-games/last-on-the-dike/back-to-lobby-phones.png

5. Severity: minor — remaining balance after a bid doesn't match balance − bid
   - Repro: R1, QA3 balance 200, bid 80 → "Left 125"; QA1 bid 20 → "Left 180"; QA2 bid 50 → "Left 150".
   - Expected: 200 − 80 = 120 (or an explained bonus amount).
   - Actual: 125 shown with only a "+bonus" tag; the bonus size is never explained on TV or phone, so players can't reason about the maths.
   - Screenshot: /workspace/qa-party-games/last-on-the-dike/host-reveal.png

## Improvements
- Show what "+bonus" is worth (e.g. "+5 highest bid") on the reveal.
- Show each player's own balance/rank persistently on the phone during reveal.
- State on the TV how many walkers get eliminated and the real number of remaining rounds.
- Push a lobby-state message to phones when the host leaves a game so no reload is needed.

## Screenshots
- /workspace/qa-party-games/last-on-the-dike/host-settings.png (game selected, no settings rail — only "Start game")
- /workspace/qa-party-games/last-on-the-dike/host-in-round.png (R1 bid phase)
- /workspace/qa-party-games/last-on-the-dike/player-bid.png (phone bid UI)
- /workspace/qa-party-games/last-on-the-dike/host-reveal.png (R1 reveal)
- /workspace/qa-party-games/last-on-the-dike/host-reveal-r2.png (R2 / final scores)
- /workspace/qa-party-games/last-on-the-dike/host-ended-session-total.png (session total 2x)
- /workspace/qa-party-games/last-on-the-dike/back-to-lobby-phones.png (phone stuck on ended screen)
