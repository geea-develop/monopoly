# ADR-003: Upstash Redis for Game Storage

**Date:** 2026-08-21  
**Status:** Accepted

## Context

Games were stored in-memory only (a `Map<string, GameState>`). This meant:
- All active games were lost on every server restart or deploy
- Players disconnecting temporarily couldn't rejoin if the server cycled
- No horizontal scaling possible (each instance has its own Map)

We needed a persistent store that:
1. Survives server restarts and Render deploys
2. Works on Render's free tier (no persistent disk available)
3. Has low latency for real-time game updates
4. Doesn't require managing a database server
5. Auto-expires stale games (no manual cleanup)

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **SQLite on disk** | Simple, zero-cost | Render free tier has no persistent disk; data lost on deploy |
| **PostgreSQL (Render/Supabase)** | Relational, free tiers available | Overkill for ephemeral game state; cold-start latency; connection pooling complexity |
| **Upstash Redis** | Serverless, HTTP-based, free tier, TTL built-in, fast | 10K commands/day limit on free plan; eventually consistent |
| **Redis Cloud (self-hosted)** | Full Redis features | Requires managing a server; cost |
| **Keep in-memory + accept loss** | Zero complexity | Poor UX (games lost on deploy) |

## Decision

Use **Upstash Redis** via the `@upstash/redis` HTTP client.

Architecture:
- In-memory `Map` as hot cache (zero-latency reads for active games)
- Upstash Redis as persistent backing store
- On `loadGame`: check Map first, fall back to Redis
- On `saveGame`: write to both Map and Redis
- TTL of 2 hours on all keys (auto-cleanup of abandoned games)

## Rationale

1. **HTTP-based** — no persistent TCP connection needed; works perfectly on serverless and Render's free tier where connections can drop
2. **Free tier** — 10K commands/day is plenty for a hobby project (each game action is 1 read + 1 write ≈ 2 commands; 5,000 actions/day)
3. **TTL** — games auto-expire after 2h with zero maintenance code
4. **Graceful degradation** — if Upstash env vars aren't set, server falls back to in-memory only (good for local dev without Redis)
5. **Latency** — Frankfurt region (eu-central-1) matches Render server location; p50 ~2ms for HTTP calls
6. **Simplicity** — `@upstash/redis` is a thin HTTP wrapper, no connection pool management

## Consequences

### Positive
- Games survive deploys and server restarts
- Players can rejoin after temporary disconnections
- No infrastructure to manage
- Local dev works without Redis (graceful fallback)

### Negative
- 10K commands/day limit — would need paid plan for high traffic
- Slight write latency (~5ms) vs pure in-memory — mitigated by hot cache
- Game state is JSON-serialized — large states (many properties/players) could hit size limits
- Single region — players far from Frankfurt get slower persistence (but gameplay is still real-time via Socket.IO)

### Risks
- If Upstash has an outage, hot cache still works but games won't persist across restarts
- If we exceed free tier limits, Redis calls will fail — hot cache still serves but no persistence

## Implementation Notes

- `apps/server/src/db.ts` — Redis client setup with graceful fallback
- All socket handlers in `index.ts` are `async` to support Redis I/O
- Key format: `game:{gameId}` with 7200s (2h) TTL
- `render.yaml` references `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (set in dashboard, sync: false)
