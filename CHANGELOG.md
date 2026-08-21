# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

- Sound effects (synthesized via Web Audio API)
- Win screen with confetti, stats, and final standings
- Player movement step-by-step animation
- Larger, glowing player tokens with initials

## [0.4.0] — 2026-08-21

### Added
- Board redesign: proportional 11×11 grid, color bands, hover tooltips (price/rent/owner)
- Dice rolling animation with spin and bounce settle
- Toast notification system for all game events (rent, buy, tax, jail, cards, bankrupt, pass Go)
- Enhanced PlayerPanel with expandable property lists per player
- Polished Actions component with clearer states and transitions
- Current player tile indicator (pulsing triangle)
- Player tokens: 4× larger with colored glow and player initials

### Fixed
- Stale closure bug in toast event listeners (gameRef pattern)
- CSP allowing localhost connections in dev mode
- `unsafe-eval` only in dev mode for HMR

## [0.3.0] — 2026-08-21

### Added
- Upstash Redis for persistent game storage (2h TTL, HTTP-based)
- In-memory Map as hot cache with Redis fallback
- All server handlers made async for Redis I/O
- Graceful fallback if Redis env vars not set

### Changed
- Replaced in-memory-only storage with Redis-backed persistence
- Games survive server restarts and deploys

## [0.2.0] — 2026-08-21

### Added
- Leave Game with confirmation dialog (Lobby and Game screens)
- Shareable invite links (`?game=xxx` in URL)
- Invite link flow: "Join Game" as primary when link has game code
- Session persistence via sessionStorage (auto-rejoin on refresh)
- Connection status indicator (green/yellow/red dot)
- Buttons disabled while disconnected
- 5-second emit timeout for all socket calls
- Build version footer with commit hash and "Report Bug" link

### Security
- Content Security Policy (CSP) headers
- Rate limiting (10 events/sec per socket)
- Input validation (name length, game ID format)

## [0.1.0] — 2026-08-21

### Added
- Initial game scaffold: monorepo with npm workspaces
- Full 40-tile Monopoly board with properties, railroads, utilities, tax, cards
- Complete game logic: roll, move, buy, rent, jail, Chance/Community Chest, bankruptcy, win
- Real-time multiplayer via Socket.IO (2–4 players)
- Lobby with game code, player list, start button
- Game screen with board, actions panel, player panel, game log
- Deployed to GitHub Pages (frontend) + Render (backend)

### Infrastructure
- ADR-001: Deployment split (Pages + Render)
- ADR-002: Build tools in dependencies
- GitHub Actions for auto-deploy on push
- Render.yaml for backend deployment
