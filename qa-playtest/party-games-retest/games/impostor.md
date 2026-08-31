# Impostor — post-fix retest
Status: pass
Tested: 2026-08-31, players 4, defaults (no content toggle)
Room: WQHF

## Checks

[PASS] Hidden role, secret not leaked on TV
Actual: R1 Places/School civilians P1 P3 P4; P2 stranger. R2 Jobs/Scientist stranger P4. TV category only until reveal.
Screenshot: screenshots/imp-03-host-tv-category-only-p4-secret.webp

[PASS] Accusation vote lock-in + stranger guess path
Actual: Accuse buttons dim after vote. R2 P4 guessed Scientist → immediate reveal correct.
Screenshot: screenshots/imp-04-accusation-locked-dimmed.webp

[PASS] Scores / Σ exact
Actual: R1 +200 civilians; R2 spy +400. Lobby P3 69230, P1 63300, P2 47061, P4 28600.
Screenshot: screenshots/imp-06-back-to-lobby-totals-p4-cleared.webp

[PASS] Timer 360s/30s in sync

[PASS] Back to lobby mid-R3 cleared "Lifeguard"
Screenshot: screenshots/imp-06-back-to-lobby-totals-p4-cleared.webp
