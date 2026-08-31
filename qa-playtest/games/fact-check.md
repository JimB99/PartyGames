# Fact Check

Status: issues
Tested: 2026-08-30 (NEW deploy, re-tested after mid-session redeploy; old-build findings discarded), room RDXU, players 2 (QA1, QA2), host window ~500px "TV" + two ~390px-wide player windows (phone-ish)

Run 1: Fact Check, defaults (Content Family, Difficulty Mixed, Speed scoring Rank by speed) — 2 full rounds played.
Run 2: same room returned to lobby, Fact Check with Content 18+ and Speed scoring Off (flat points) — 1 round played.

## What worked
- Host `/host` connected quickly on the new build; room code + QR + join URL shown; header stayed "Connected" for the whole session.
- Joining works: nickname + 16-colour picker, players appear in host list as "online", session total list populates.
- Game start, prompt broadcast, submit phase, vote phase, reveal and auto-advance to the next round all worked end-to-end with only 2 players (min).
- Host in-round controls present and functional: Pause, Skip, +30s, Back to lobby (with a confirm dialog).
- Voting attribution and scoring were correct in round 2 of Run 1 and in Run 2: reveal shows "Real answer" / "Written by house" / "Written by <player>" plus voter chips; correct vote = +1000.
- Content 18+ clearly changes the material: prompts/decoys like "The story that still haunts the group chat is…", "called a sex hotline.", "lied about being a virgin" vs. family prompts ("A rejected candy bar flavor would be…").
- Speed scoring Off works: correct voter got a flat 1000 with no speed ranking; round resolved normally.
- Rounds advance automatically after reveal (no host click needed); host header shows "Round n/5 · phase" with a countdown bar.

## Bugs

1. Session total never accumulates / scores reset
- Severity: major
- Players/settings: 2 players, Run 1 defaults
- Repro: Play round 1 (QA2 scored 1000), continue to round 2 (QA1 scored 1000). Watch the header chips and the lobby "SESSION TOTAL".
- Expected: per-player totals accumulate across rounds (QA2 1000, QA1 1000) and the session total reflects them.
- Actual: the score chip only ever shows the *current round's* winner at 1000 and everyone else 0 — QA2's round-1 1000 was gone in round 2. The "Σ" session figure stayed 0Σ for both players all game, and after "Back to lobby" the SESSION TOTAL list showed 0 for both.
- Screenshot: /workspace/qa-party-games/fact-check/host-reveal.png

2. No confirmation after a player submits
- Severity: major (UX)
- Players/settings: any
- Repro: Type an answer on a phone, tap Submit.
- Expected: "Answer submitted — waiting for others", or the form locks/greys out.
- Actual: the textarea just empties and the Submit button stays live; nothing tells the player it was received. Only the TV shows "Waiting for players… (1)". Players cannot tell if they submitted, and can tap Submit again.
- Screenshot: /workspace/qa-party-games/fact-check/player-submit.png

3. Stale answer text carried into the next round's submit box
- Severity: minor
- Players/settings: QA2, both runs
- Repro: Miss the submit deadline (or have text left in the box) → next round starts.
- Expected: the answer field is cleared for each new prompt.
- Actual: QA2's old text ("hug the steering wheel") persisted in the field across the next round and even across the return-to-lobby + new game, so it can be accidentally submitted against a different prompt.
- Screenshot: /workspace/qa-party-games/fact-check/host-in-round.png (QA2 pane on the right shows the stale text)

4. Submissions made near the deadline are silently dropped
- Severity: minor
- Players/settings: QA2, Run 1 round 1
- Repro: Submit with ~1–3s left on the timer.
- Expected: either accepted, or a clear "too late" message.
- Actual: the answer never appears among the vote options and the player gets no feedback at all — indistinguishable from a successful submit (see bug 2).
- Screenshot: /workspace/qa-party-games/fact-check/player-vote.png

5. Players are not returned to the lobby when the host clicks "Back to lobby"
- Severity: major
- Players/settings: 2 players, Run 1
- Repro: Mid-round on host, click "Back to lobby" → OK.
- Expected: player phones drop back to "Waiting for host to start a game…".
- Actual: host went to the lobby/game picker, but both phones kept showing the previous round's submit screen with a live timer for several seconds; they only recovered when the next game started. Players could still type/submit into a dead round.
- Screenshot: /workspace/qa-party-games/fact-check/host-settings-18plus.png (host in lobby, player panes still in "submit")

6. Possible vote mis-attribution (not reproduced)
- Severity: minor (unconfirmed)
- Players/settings: 2 players, Run 1 round 1
- Repro: QA2 tapped the 2nd option ("check your mirrors twice", QA1's lie); reveal credited QA2's chip to the 3rd option (the real answer) and awarded 1000.
- Expected: the vote lands on the tapped option.
- Actual: chip appeared on a different option. Round 2 and Run 2 attributed votes correctly, so this may have been a click landing during a re-render — flagging it for the dev to check the vote index handling.
- Screenshot: /workspace/qa-party-games/fact-check/host-reveal.png

7. 18+ decoys don't match the prompt grammar
- Severity: minor (content)
- Players/settings: Content 18+, Run 2
- Repro: Prompt "The story that still haunts the group chat is…" with options "called a sex hotline.", "had sex while standing.", "lied about being a virgin".
- Expected: options read as grammatical completions of the prompt.
- Actual: the 18+ house lies look pulled from a different ("I have never…") pool, so they don't fit the sentence stem — which also makes the human-written answer easy to spot.
- Screenshot: /workspace/qa-party-games/fact-check/host-reveal-speed-off.png

8. Long options overflow / clip on narrow phone widths
- Severity: minor
- Players/settings: ~390px player windows
- Repro: Any round with a long house lie ("cheese-based trauma, but make it sweaty confidence").
- Expected: text wraps inside the card.
- Actual: long strings run to the edge and get clipped horizontally on the narrow player viewport; the host TV column wraps fine.
- Screenshot: /workspace/qa-party-games/fact-check/player-vote.png

## Improvements
- Show a "submitted ✓" state (lock the field, show your own answer) and a live "3/4 submitted" count on the phone, not just the TV.
- Clear the answer field on every new prompt and disable it once the phase ends.
- Carry per-round points into a visible cumulative session score; show a scoreboard screen at the end of the 5 rounds.
- Tell late submitters what happened ("too late — you'll vote this round").
- Push a lobby state to phones immediately when the host leaves a game.
- Give the vote screen a "you voted for X" confirmation; currently only a faint highlight.
- Curate 18+ decoys per prompt template so they complete the sentence.
- Consider forbidding (or at least visually marking) voting for your own submission.

## Screenshots
- /workspace/qa-party-games/fact-check/host-lobby.png
- /workspace/qa-party-games/fact-check/host-2players.png
- /workspace/qa-party-games/fact-check/player-waiting.png
- /workspace/qa-party-games/fact-check/host-settings.png
- /workspace/qa-party-games/fact-check/player-submit.png
- /workspace/qa-party-games/fact-check/host-in-round.png
- /workspace/qa-party-games/fact-check/player-vote.png
- /workspace/qa-party-games/fact-check/host-reveal.png
- /workspace/qa-party-games/fact-check/player-reveal.png
- /workspace/qa-party-games/fact-check/host-settings-18plus.png
- /workspace/qa-party-games/fact-check/host-reveal-speed-off.png
