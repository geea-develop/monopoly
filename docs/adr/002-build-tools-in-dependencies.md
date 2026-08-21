# ADR-002: Build Tools in Production Dependencies

**Date:** 2026-08-21  
**Status:** Accepted

## Context

The server is built from source on Render (our production host). The build step runs `tsc` which requires `typescript` and `@types/*` packages. Render sets `NODE_ENV=production` during the build phase, causing `npm ci` to skip `devDependencies` (equivalent to `--omit=dev`).

Options considered:
1. Move `typescript` and `@types/*` to `dependencies`
2. Set `NPM_CONFIG_PRODUCTION=false` env var on Render
3. Override `NODE_ENV` in the build command (`NODE_ENV=development npm ci`)
4. Use `npm ci --include=dev` in the build command
5. Build in CI and deploy compiled artifacts
6. Commit `dist/` to git

## Decision

**Option 1** — move `typescript`, `@types/express`, `@types/cors`, and `@types/uuid` to `dependencies`.

## Rationale

- These packages are **build requirements**, not optional dev conveniences. If production build requires them, they belong in `dependencies`.
- Options 2–4 are workarounds that install *all* devDependencies (including tools like `tsx` that are only needed locally).
- Option 5 (CI-built artifacts) adds pipeline complexity that isn't justified for this project.
- Option 6 (commit `dist/`) pollutes git history with build artifacts and risks drift.
- The semantic distinction: `devDependencies` is for tools only needed in local development (e.g., `tsx` for watch mode). Build tools needed in any environment that compiles the code belong in `dependencies`.

## Consequences

- `typescript` and `@types/*` are listed in `dependencies` for the server package.
- `npm ci --omit=dev` is **not** used during build on Render (standard `npm ci` installs everything in `dependencies`).
- Only `tsx` remains in `devDependencies` (local dev watch mode only).
- Slightly larger production install (~2MB), but no runtime impact.
