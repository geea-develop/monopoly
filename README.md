# 🎩 Monopoly — Multiplayer Web Game

A real-time multiplayer Monopoly game built with TypeScript. Roll dice, buy properties, collect rent, and bankrupt your friends — all from the browser.

**[Play Now →](https://geea-develop.github.io/monopoly/)**

## Features

- 🎲 Full Monopoly game loop — dice, properties, rent, tax, Chance/Community Chest, jail
- 👥 2–4 players, real-time via WebSocket
- 🔗 Shareable invite links (`?game=xxx`)
- 💾 Persistent games — refresh the page and auto-rejoin (Redis-backed)
- 🎬 Animated board — step-by-step token movement, dice roll animation
- 🔊 Synthesized sound effects — dice, buy, rent, jail, win/lose fanfare
- 🏆 Win screen with confetti, stats, and final standings
- 🔔 Toast notifications for game events
- 📱 Responsive layout (desktop-first, playable on tablet)

## Architecture

```
monopoly/
├── apps/
│   ├── client/         # Next.js 16 static export → GitHub Pages
│   └── server/         # Express + Socket.IO → Render
├── packages/
│   └── shared/         # Board data, types, socket event contracts
├── docs/
│   └── adr/            # Architecture Decision Records
├── render.yaml         # Render deployment config
└── package.json        # npm workspaces root
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Socket.IO Client |
| Backend | Express, Socket.IO, Node.js 20 |
| Database | Upstash Redis (HTTP, serverless) |
| Shared | TypeScript types, 40-tile board definition, event contracts |
| Monorepo | npm workspaces |
| Deploy | GitHub Pages (frontend), Render (backend) |

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+
- An Upstash Redis instance (optional — falls back to in-memory if not configured)

### Setup

```bash
git clone git@github.com:geea-develop/monopoly.git
cd monopoly
npm install
```

### Environment Variables

Create `apps/server/.env`:

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

> Without these, the server uses an in-memory Map (games lost on restart).

### Run

```bash
npm run dev          # Starts both client and server
```

Or separately:

```bash
npm run dev:server   # http://localhost:3001 (hot reload)
npm run dev:client   # http://localhost:3000 (Next.js HMR)
```

### End-to-end tests

Install the Playwright browser once, then run the lobby and multiplayer flows:

```bash
npm run test:e2e:install
npm run test:e2e
```

The suite uses isolated ports 3010/3011 so it can run while another local game is using 3000/3001. Use `npm run test:e2e:ui` when iterating interactively.

The E2E suite currently covers connected startup, lobby creation and joining,
invite-code errors, session rejoin after reload, browser connectivity recovery,
turn synchronization, and property purchase synchronization. Test servers use
`MONOPOLY_TEST_DICE` to make purchase scenarios deterministic without affecting
production runs.

### Quality and security

- `npm audit` currently reports zero vulnerabilities.
- CI builds all workspaces and runs the Playwright suite on every push and pull request.
- The production client deploys to GitHub Pages and the Socket.IO server deploys to Render.

### Build

```bash
npm run build:shared   # Compile shared types
npm run build:server   # Compile server
npm run build:client   # Next.js static export
```

## How to Play

1. Open the app and enter your name
2. Click **Create New Game** to get a game code
3. Share the code or invite link with friends (2–4 players)
4. Once everyone joins, the host clicks **Start Game**
5. Take turns rolling dice, buying properties, and paying rent
6. Game ends when all but one player go bankrupt, or after 100 turns (richest player wins)

## Deployment

| Service | Platform | Trigger |
|---------|----------|---------|
| Frontend | GitHub Pages | Auto-deploy on push to `main` |
| Backend | Render | Auto-deploy on push to `main` |
| Database | Upstash Redis | Always-on (Frankfurt, eu-central-1) |

Backend config is in `render.yaml`. Environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are set in the Render dashboard.

## ADRs

- [001 — Deployment Split](docs/adr/001-deployment-split.md)
- [002 — Build Tools in Dependencies](docs/adr/002-build-tools-in-dependencies.md)
- [003 — Upstash Redis for Game Storage](docs/adr/003-upstash-redis.md)

## License

MIT
