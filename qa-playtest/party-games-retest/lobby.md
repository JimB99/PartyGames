# Lobby / host / join — post-fix retest
Status: issues (P0 platform fixes pass; new minors)
Tested: 2026-08-31, 2 players, host 1280×800 + phones 390×844 (separate Chrome profiles)
Room: WQHF

## P0 results

[PASS] Host room persistence
Game: Lobby  Players: 2  Settings: defaults
Expected: same 4-letter code after refresh
Actual: /host redirected to /host/WQHF; after Ctrl+Shift+R the code is still WQHF, both players stay connected
Screenshot: screenshots/p1-host-code-persist-catalog.webp

[PASS] Catalog: no Caption This, no Out of Place, Impostor present
Expected: those two absent, Impostor present, ~30 cards
Actual: no "Caption This" / "Out of Place"; Impostor present (Social & Voting, 4–8). Card count = 29 (not 30).
Screenshot: screenshots/p1-host-code-persist-catalog.webp

[PASS] /play 390px no horizontal overflow
Expected: scrollWidth == innerWidth == 390
Actual: both phones report innerWidth 390, documentElement.scrollWidth 390, body.scrollWidth 390; no sideways scroll in lobby or in-game
Screenshot: screenshots/p0-phones-390-waiting.webp

[PASS] Back to lobby clears phones within ~2s
Game: Quick Quiz  Players: 2
Expected: phones leave game UI
Actual: within <1s both phones show "Waiting for host to start a game…"; neither stuck on ended/submit
Screenshot: screenshots/qq-back-to-lobby-phones-cleared.webp
Note: no confirmation dialog — one click returned straight to picker (see new bugs).

## New bugs
### Session totals wipe / player dropped when a third player joins
- Severity: major
- Old vs new: **new**
- Repro: Room WQHF with P1 6000 / P2 6025 session totals. Launch a third Chrome profile and join as P3.
- Expected: P3 appears; existing players stay; session totals persist.
- Actual: host dropped to 2 players with SESSION TOTAL P1 0 / P3 0. P2 phone: "No active host in this room…" until reload, then P2 reappeared at 0. Crowd Call Σ therefore started from 0.
- Screenshot: screenshots/cc-07-host-lobby.png (after). Before captured in tester assets.


### Host GAME OPTIONS panel clips at 1280px
- Severity: minor
- New vs old: new (or newly visible with timer bar layout)
- Repro: Host Quick Quiz settings at 1280×800.
- Expected: options fully readable.
- Actual: panel has its own horizontal scrollbar; "TV display: Question only on TV" is clipped.
- Screenshot: screenshots/p2-host-quickquiz-settings.webp

### Back to lobby has no confirm
- Severity: minor / product
- Expected (old flow): confirm before leaving.
- Actual: one click returns to picker. Phones do clear (the important fix). Confirm may have been removed on purpose.
