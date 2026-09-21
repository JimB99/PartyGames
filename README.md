# Party Games

Couch party games: one big screen (host/TV) + phones as controllers.

## Stack

- **Cloudflare Workers + Durable Objects** (via `partyserver` + `wrangler`)
- **React + Vite + Tailwind** (client, served from the same Worker)
- **TypeScript monorepo** (`shared`, `server`, `client`)

## Games (21)

Display names match lobby copy. Protocol IDs are kebab-case. Several games support **mode settings** in the lobby (e.g. Bluff: fill-in-blank vs reverse-question).

| ID | Display name |
|----|----------------|
| bluff | Bluff |
| prompt-vote | Write & Vote |
| opinions | Opinions |
| spectrum | Spectrum |
| impostor | Impostor |
| agent-grid | Agent Grid |
| bracket-battle | Bracket Battle |
| forbidden-clue | Forbidden Clue |
| team-charades | Team Charades |
| last-on-the-dike | Last on the Dike |
| trivia | Trivia |
| drawing | Drawing |
| trail-dash | Trail Dash |
| word-rush | Word Rush |
| block-stack | Block Stack |
| grid-blast | Grid Blast |
| paddle-clash | Paddle Clash |
| hangman-race | Hangman Race |
| fleet-duel | Fleet Duel |
| four-in-a-row | Four in a Row |
| tic-tac-toe | Tic-Tac-Toe |

## Testing

```bash
pnpm verify          # typecheck + unit tests
pnpm test:games      # game engine smoke + scoring
pnpm test:games:audit # E2E interaction coverage audit
pnpm test:contract   # shared protocol tests
```

See `PartyGames/.cursor/rules/partygames-testing.mdc` for coverage requirements.
