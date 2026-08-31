# Forbidden Clue — post-fix retest
Status: issues (content PASS; g/Σ inflation FAIL)
Tested: 2026-08-31, players 4, Family then 18+
Room: WQHF

## Handoff checks

[PASS] Hidden secret / playable
Actual: TV no word during clue; non-givers "Listen and shout guesses!"; giver word + 5 forbidden + Got it/Skip/Foul. Live Correct/Fouls.
Screenshot: screenshots/fc2-family-host-clue.png, screenshots/fc2-family-p4-card-P4.png

[PASS] Family content appropriate
Actual: Piano, Diamond, Circus, Treasure, Guitar, Bicycle, Library, Sandwich, Pizza
Screenshot: screenshots/fc2-family-p4-card-P4.png

[PASS] 18+ pool different (old badge-only no-op FIXED)
Actual: 18+ badge; Shotgun wedding, Revenge outfit, Body shot, Hangover, Karaoke fail, Situationship. Family cards still interleaved. Mild innuendo, not explicit.
Screenshot: screenshots/fc2-18plus-p3-card-P3.png
Old vs new: **content fix confirmed**.

[PASS] Timer 1:1 60s host+phones
Screenshot: screenshots/fc2-family-host-clue.png

[PASS] Back to lobby clears secrets ~2s (even mid-round with Situationship on P2)
Screenshot: screenshots/fc2-18plus-back-to-lobby-final-P2.png

[FAIL] g re-adds team total every round
Expected: g = sum of round results; Σ +final once
Actual: 18+ R1 A 3500 OK; R2 A 3500→7000 without playing; R3 A 11500 expected 4500; ended 20500 per player into Σ. Family: round panel A 1400 / B 1000 but Final A 6000 / B 2000.
Screenshot: screenshots/fc2-18plus-BUG-teamA-doubled.png, screenshots/fc2-family-host-ended.png
Old vs new: **new** (or unfixed scoring; round panel is the correct one)

### Cosmetic: "Team 's turn" / "Clue giver: ?" on instructions/ended
Screenshot: screenshots/fc2-family-host-ended.png
