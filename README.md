# Party Games

Jackbox-style party games: one big screen (host/TV) + phones as controllers.

## Stack

- **Cloudflare Workers + Durable Objects** (via `partyserver` + `wrangler`)
- **React + Vite + Tailwind** (client, served from the same Worker)
- **TypeScript monorepo** (`shared`, `server`, `client`)

## Games (16)

Fibbage, Quiplash, Quick Quiz, Would You Rather, Caption This, Draw & Guess, Bracket Battle, Role Sort, Timeline, Impostor, Curve Fever, Word Rush, Fibbage Reverse, Team Charades, Hot Seat, Last on the Dike.

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
