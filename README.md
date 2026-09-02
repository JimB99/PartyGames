# Party Games

Couch party games: one big screen (host/TV) + phones as controllers.

## Stack

- **Cloudflare Workers + Durable Objects** (via `partyserver` + `wrangler`)
- **React + Vite + Tailwind** (client, served from the same Worker)
- **TypeScript monorepo** (`shared`, `server`, `client`)

## Games (32)

Display names match lobby copy. Protocol IDs are kebab-case.

| ID | Display name |
|----|----------------|
| fact-check | Fact Check |
| wit-showdown | Wit Showdown |
| caption-this | Caption This |
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
| star-rate | Star Rate |
| agent-grid | Agent Grid |
| forbidden-clue | Forbidden Clue |
| hangman-race | Hangman Race |
| paddle-clash | Paddle Clash |
| grid-blast | Grid Blast |
| draw-vote | Draw & Vote |
| draw-impostor | Draw Impostor |

## Testing

```bash
npx pnpm verify           # typecheck + unit + contract + content audit
npx pnpm test             # unit + integration (shared + server)
npx pnpm test:unit        # shared logic tests only
npx pnpm test:e2e         # Playwright UI tests (includes viewport matrix)
npx pnpm test:e2e -- e2e/viewport-matrix.spec.ts
```

Prerequisites for E2E:

1. `npx playwright install chromium` (once)
2. Dev servers running (`npx pnpm dev`) or let Playwright start them via `playwright.config.ts`
3. Optional WebSocket integration tests: `npx wrangler dev --port 8787` in another terminal

Test layers:

- **Unit** — scoring, board logic, content filters (`packages/shared`)
- **Content validation** — all JSON question/word pools (0 errors required)
- **Game integration** — all 32 games at min/max players via `GameModule` simulation
- **Settings matrix** — family/mature, difficulty, speed scoring, Trail Dash options
- **Room WebSocket** — join/start/max players (requires wrangler dev)
- **Playwright E2E** — host + player UI smoke per game; viewport matrix at 1280×720, 1920×1080, 390×844, 844×390, 768×1024

## Go live (one-time setup)

PartyKit’s shared `*.partykit.dev` hosting is currently broken for **new** projects. This repo deploys to your **free Cloudflare account** on `*.workers.dev` (no custom domain required).

### 1. Create a Cloudflare account

Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) (free).

### 2. Log in with Wrangler (browser)

```bash
cd PartyGames
npx wrangler login
```

Approve the OAuth prompt in your browser when it opens.

### 3. Build and deploy

```bash
npx pnpm install
npx pnpm build
npx wrangler deploy
```

Wrangler prints your live URL, e.g. `https://party-games.<your-subdomain>.workers.dev`

Share that URL with friends. Host: `/host` · Players: `/join`

## Local development

```bash
npx pnpm install
npx pnpm dev
```

- Client: http://localhost:5178
- Worker: http://localhost:8787

Copy `packages/client/.env.example` to `packages/client/.env.local`:

```
VITE_PARTYKIT_HOST=localhost:8787
```

## How to play

1. Open the site on a laptop/TV → **Host a game**
2. Share the 4-letter code or QR with friends
3. Players join on their phones with a nickname
4. Host picks a game and hits **Start**
5. Watch the big screen; play on your phone

## Test without multiple phones

Open multiple browser tabs or incognito windows — one as host (`/host`), others as players (`/join`). Use different nicknames in each tab.

## Project structure

```
packages/shared   — types, protocol, content JSON
packages/server   — Worker + room logic (partyserver)
packages/client   — React UI
wrangler.jsonc    — Cloudflare deploy config
```
