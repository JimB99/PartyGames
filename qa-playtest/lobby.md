# Lobby, host, and join (cross-cutting)

Status: issues
Tested: 2026-08-30, live site https://party-games.jimb99.workers.dev/
Viewports: desktop host + iPhone 390×844 join/home

These are not game-specific. Fix here before (or alongside) per-game work.

## Bugs

### Host room created on every visit
- Severity: minor
- Players / settings: n/a
- Repro: Open `/host`. Note the 4-letter code. Refresh or visit `/host` again.
- Expected: Returning to host should reconnect to the existing session, or ask before creating a new room.
- Actual: Every visit/refresh burns a new code. Anyone with the old code is stranded.

### Host can stall on “Connecting…” with a blank body
- Severity: major
- Players / settings: n/a
- Repro: Open `/host`. Watch the header. Slow or headless loads sit on a red “Connecting…” for 1–2s or indefinitely. While that is up, a player joining with the valid code gets “No active host in this room. Ask the host to open the game on their screen first.”
- Expected: Connecting state has a timeout and a retry. Join error distinguishes “host still connecting” from “no such room.” Host tab staying in the background should not look like a dead room.
- Actual: Valid code + host tab merely loading or backgrounded looks like a dead room. No fallback message if the WebSocket never attaches.

### Player-count gate duplicated on every game card
- Severity: minor
- Repro: Host a room with 0–1 players. Look at the picker.
- Expected: One place (Start button / footer) says how many more players are needed.
- Actual: “Need N more” is repeated on all 31 cards.

### Empty GAME SETTINGS panel
- Severity: minor
- Repro: Pick Spectrum, Impostor, Friend Sort, Block Stack, Paddle Clash, Grid Blast, Fleet Duel, Four in a Row, Tic-Tac-Toe, Last on the Dike, Crowd Call, or Out of Place.
- Expected: Hide the settings rail, or show “No options for this game.”
- Actual: Heading “GAME SETTINGS” with an empty body.

### Playlist chips have no remove affordance
- Severity: minor
- Repro: Add a game to the session playlist. Look at the chip.
- Expected: Clear remove control (x) or selected/unselected styling that reads as a toggle.
- Actual: Chips toggle add/remove with no visual cue for removal. “Start session (0 games)” stays visible but disabled/green.

### Game names truncate in narrow layouts
- Severity: minor
- Repro: Host at ~390×844 (or a narrow TV column). Scan the picker.
- Expected: Names wrap or show a tooltip.
- Actual: Some names are cut off.


### Players stay on the old game after “Back to lobby”
- Severity: major
- Confirmed in: Fact Check, Wit Showdown (reproduced twice)
- Repro: Mid-game or after game-over, host clicks “Back to lobby” → confirm.
- Expected: phones immediately show “Waiting for host to start a game…”.
- Actual: host returns to the picker; phones stay on the previous phase (submit with a live Submit button, or “ended”) for 30s+ and only recover when a new game starts. Players can still submit into a dead round.
- Screenshot: `/workspace/qa-party-games/wit-showdown/` stuck-phone shots

### Phone controller has ~500px CSS min-width
- Severity: minor
- Repro: Size a player window to iPhone 390×844 after join.
- Expected: controller layout fits a real phone width.
- Actual: page overflows horizontally; testers had to use ~500px player windows. Join/home at 390px were fine — this is the in-room `/play` layout.

## Improvements
- Keep the host WebSocket alive when the tab is backgrounded, or show “host is reconnecting” on the player side instead of “no active host.”
- Prefill join from `?code=` is good; consider copying the code to clipboard from the giant TV code with one tap.
- Push a lobby state to phones immediately when the host leaves a game (Fact Check + Wit Showdown).
- Fit `/play` to real phone widths (~390px); drop the ~500px min-width.
- iPhone homepage and join already look solid — don’t break that while fixing host.

## Screenshots
- `/workspace/qa-party-games/home.png`
- `/workspace/qa-party-games/join.png`
- `/workspace/qa-party-games/home-mobile-390x844.png`
- `/workspace/qa-party-games/join-mobile-390x844.png`
