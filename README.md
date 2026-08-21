# 🎩 Monopoly — Multiplayer Web Game

A real-time multiplayer Monopoly game built with TypeScript, Next.js, Express, and Socket.IO.

## Architecture

```
monopoly/
├── apps/
│   ├── client/         # Next.js frontend (GitHub Pages)
│   └── server/         # Express + Socket.IO backend (Render)
├── packages/
│   └── shared/         # Board data, types, Socket.IO event contracts
├── render.yaml         # Render deployment config
└── pnpm-workspace.yaml
```

## Development

```bash
pnpm install
pnpm dev          # Starts both client and server in parallel
```

- Client: http://localhost:3000
- Server: http://localhost:3001

## How to Play

1. Open the app and enter your name
2. Click **Create New Game** to get a game code
3. Share the code with friends (2–4 players)
4. Once everyone joins, the host clicks **Start Game**
5. Take turns rolling dice, buying properties, and paying rent
6. Game ends when all but one player go bankrupt, or after 100 turns

## Deployment

- **Frontend:** Deployed automatically to GitHub Pages on push to `main`
- **Backend:** Deployed to Render via `render.yaml` (free tier with 1GB disk for SQLite)

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Socket.IO Client
- **Backend:** Express, Socket.IO, better-sqlite3
- **Shared:** TypeScript types, board data, event contracts
- **Monorepo:** pnpm workspaces

## License

MIT
