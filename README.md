# Party Games

Couch party games: one big screen (host/TV) + phones as controllers.

## Stack

- **Cloudflare Workers + Durable Objects** (via `partyserver` + `wrangler`)
- **React + Vite + Tailwind** (client, served from the same Worker)
- **TypeScript monorepo** (`shared`, `server`, `client`)

## Games (30)

Display names match lobby copy. Protocol IDs are kebab-case.

| ID | Display name |
|----|----------------|
| fact-check | Fact Check |
| punchline-battle | Punchline Battle |
| quick-quiz | Quick Quiz |
| would-you-rather | Would You Rather |
| draw-guess | Draw & Guess |
| bracket-battle | Bracket Battle |
| role-sort | Friend Sort |
| timeline | When Was It |
| impostor | Impostor |
| trail-dash | Trail Dash |
| word-rush | Word Rush |
| reverse-fact | Reverse Fact |
| team-charades | Team Charades |
| hot-seat | Hot Seat |
| last-on-the-dike | Last on the Dike |
| block-stack | Block Stack |
| fleet-duel | Fleet Duel |
| four-in-a-row | Four in a Row |
| tic-tac-toe | Tic-Tac-Toe |
| split-the-room | Split the Room |
| spectrum | Spectrum |
| chain-sketch | Chain Sketch |
| crowd-call | Crowd Call |
| agent-grid | Agent Grid |
| forbidden-clue | Forbidden Clue |
| hangman-race | Hangman Race |
| paddle-clash | Paddle Clash |
| grid-blast | Grid Blast |
| draw-vote | Draw & Vote |
| draw-impostor | Draw Impostor |

## Testing

```bash
pnpm verify          # typecheck + unit + content audit
pnpm test:games      # full game test suite
pnpm content-inventory  # regenerate docs/content-inventory.md
```

## Content

```bash
pnpm harvest-jeopardy   # rebuild reverse-fact from Jeopardy-style sources
pnpm harvest-content    # jeopardy + human + mature (local) harvest
pnpm import-content     # optional API supplements
```

See [CREDITS.md](CREDITS.md) for data sources and [docs/content-inventory.md](docs/content-inventory.md) for per-game pool counts.
