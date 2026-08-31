# Party Games QA playtest

**Live:** https://party-games.jimb99.workers.dev/

## Retest handoff

Use **`RETEST-HANDOFF.md`** for the current deploy — what changed, why, and what to verify. Give that file to automated or human testers.

## Historical reports

`games/*.md`, `lobby.md`, and `INDEX.md` are from the 2026-08-30/31 playtest that drove the fixes. They describe bugs *before* the latest deploy; use them for context only, not as a fresh test plan.

## Test method

- Host: `/host` on a large desktop viewport  
- Players: `/join` at **390×844** in separate browser sessions  
- Hard-reload after each deploy  
