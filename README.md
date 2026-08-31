# Party Games

Couch party games: one big screen (host/TV) + phones as controllers.

## Stack

- **Cloudflare Workers + Durable Objects** (via `partyserver` + `wrangler`)
- **React + Vite + Tailwind** (client, served from the same Worker)
- **TypeScript monorepo** (`shared`, `server`, `client`)

## Games (30)

Fact Check, Wit Showdown, Quick Quiz, Would You Rather, Draw & Guess, Bracket Battle, Friend Sort, When Was It, Impostor, Trail Dash, Word Rush, Reverse Fact, Team Charades, Hot Seat, Last on the Dike, Block Stack, Fleet Duel, Four in a Row, Tic-Tac-Toe, Split the Room, Spectrum, Chain Sketch, Crowd Call, Star Rate, Agent Grid, Forbidden Clue, Hangman Race, Paddle Clash, Grid Blast.

## Testing

```bash
npx pnpm test              # unit + integration (shared + server)
npx pnpm test:unit         # shared logic tests only
npx pnpm test:e2e          # Playwright UI smoke tests (all 30 games)
npx pnpm test:e2e -- e2e/games/quick-quiz.spec.ts   # single game
```

Prerequisites for E2E:

1. `npx playwright install chromium` (once)
2. Dev servers running (`npx pnpm dev`) or let Playwright start them via `playwright.config.ts`
3. Optional WebSocket integration tests: `npx wrangler dev --port 8787` in another terminal

Test layers:

- **Unit** — scoring, board logic, content filters (\`packages/shared\`)
- **Content validation** — all JSON question/word pools
- **Game integration** — all 31 games at min/max players via \`GameModule\` simulation
- **Settings matrix** — family/mature, difficulty, speed scoring, Trail Dash options
- **Room WebSocket** — join/start/max players (requires wrangler dev)
- **Playwright E2E** — host + player UI smoke per game

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

- Client: http://localhost:5173
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
