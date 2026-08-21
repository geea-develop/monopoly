# ADR-001: Deployment Split — GitHub Pages (Frontend) + Render (Backend)

**Date:** 2026-08-21  
**Status:** Accepted

## Context

We needed to decide where to host the frontend (Next.js static export) and backend (Express + Socket.IO) for the multiplayer Monopoly game.

Options considered:
1. Both on Render
2. Frontend on GitHub Pages, backend on Render

## Decision

Frontend on **GitHub Pages**, backend on **Render** (free tier with persistent disk).

## Rationale

- **GitHub Pages** is free with no bandwidth limits, served via CDN, and has no cold-start penalty. Render's free web services sleep after 15 minutes of inactivity (~30s cold start), but this only affects the backend — static sites on Render don't sleep, but offer no advantage over Pages.
- **Consistency** with existing games in the org (five-dots, dots-and-boxes, sudoku) which all use GitHub Pages.
- **The backend requires Render** because it needs a persistent process (Socket.IO WebSocket connections) and disk storage (JSON game state). GitHub Pages can only serve static files.
- Putting the frontend on Render would consolidate into one dashboard but provides no practical benefit.

## Consequences

- Frontend deploys via GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`.
- Backend deploys via Render Blueprint (`render.yaml`) connected to the same repo.
- The client must know the backend URL at build time (`NEXT_PUBLIC_SERVER_URL`).
- CORS on the backend must allow `https://geea-develop.github.io`.
