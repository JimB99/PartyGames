# PartyGames post-fix retest
Live: https://party-games.jimb99.workers.dev/
Date: 2026-08-31 (Europe/Vienna)
Room: WQHF · host TV + phones 390×844 separate Chrome profiles

## P0 platform
- [x] Back to lobby — PASS
- [x] Submit confirm — PASS (most games; Draw & Guess guesses have no ack)
- [x] Session Σ — PASS when game total is correct (no doubling)
- [x] Timer bar — PASS full-width, ~1:1
- [x] /play 390px no overflow — PASS
- [x] Host room persistence — PASS
- [x] Catalog: no Caption This, no Out of Place, Impostor present — PASS (29 cards)
- [x] NEW: 3rd player join wiped session totals / dropped P2 (see lobby.md)

## P1 previously blocked
- [x] Quick Quiz — PASS scoring/lock-in; FAIL first-joined submit ends round
- [x] Word Rush — PASS tile words; FAIL gibberish valid / BE invalid
- [x] Crowd Call — PASS timer 1:1, predict/answer, scoring
- [x] Hot Seat — PASS named seat; FAIL Family 18+ prompt, blank reveal, 0 scores
- [x] Bracket Battle — PASS start-round + voting; FAIL blank ended on 1 entry
- [x] Chain Sketch — PASS phone UI; FAIL P3 guess dropped, only starter scores
- [x] Spectrum — FAIL scoring still 0 (old blocker not fixed)
- [x] Grid Blast — PASS movement, delayed bombs, round vs session scores

## P2 scoring / presentation
- [x] Fact Check — PASS scoring; FAIL 18+ prompts
- [x] Reverse Fact — PASS scoring; FAIL decoy copy; no 18+ toggle
- [x] When Was It — PASS
- [x] Trail Dash — PASS power-up gating + scores (steering out of scope)
- [x] Last on the Dike — PASS
- [x] Star Rate — PASS
- [x] Draw & Guess — PASS canvas; FAIL skip-draw round, R4 double-count
- [x] Tic-Tac-Toe — FAIL 4p stall P1 vs ?; win line PASS
- [x] Four in a Row — PASS win line/banner/Σ; FAIL P4 never played
- [x] Paddle Clash — FAIL no hockey setting, banner score, 2v2 teammate

## P3 settings / content
- [x] Forbidden Clue family vs 18+ — PASS pools; FAIL g inflation
- [x] Team Charades family vs 18+ — FAIL still tame; TV leak; score inflation
- [x] Would You Rather — PASS no speed scoring, reveal, timer; FAIL blank ended
- [x] Split the Room 18+ — FAIL badge-only
- [x] Paddle Clash pong vs hockey — FAIL setting absent

## Remaining catalog
- [x] Impostor — PASS
- [x] Hangman Race — PASS timer; FAIL empty solve = 2 strikes
- [x] Wit Showdown — PASS
- [x] Friend Sort — PASS
- [x] Agent Grid — FAIL guess limit + a-word dictionary
- [x] Block Stack — FAIL swipe move/drop
- [x] Fleet Duel — FAIL never ends, truncated boards
