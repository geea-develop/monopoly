# Release Notes

## v0.5.0 — Polish & Immersion (Current)

**Commit:** (pending push)

### Highlights
- 🔊 **Sound effects** — synthesized via Web Audio API, no audio files needed
- 🏆 **Win screen** — confetti, stats, scoreboard, play again
- 🎬 **Movement animation** — tokens hop tile-by-tile across the board
- 🎯 **Current player indicator** — pulsing triangle on active tile
- 📖 **Documentation** — README rewrite, CHANGELOG, ADR-003

### Sound Effects
All sounds are generated in-browser using the Web Audio API:
- Dice roll (tumbling clicks)
- Buy property (cha-ching)
- Pay rent/tax (descending tone)
- Go to jail (door slam)
- Pass Go (ascending fanfare)
- Win (triumphant fanfare)
- Lose/bankrupt (sad trombone)
- Your turn (attention ping)
- Card drawn (flip sound)

### Win Screen
Full-screen overlay when game ends:
- Confetti burst (canvas-confetti) for the winner
- Sad trombone for other players
- Stats: cash, properties owned, net worth
- Final standings with medals (🥇🥈🥉)
- "Play Again" button resets everything

---

## v0.4.0 — UI Overhaul

**Commit:** `19caaa7`

### Highlights
- Complete board redesign with proportional layout
- Toast notification system for game events
- Enhanced player panel with property details
- Dice rolling animation

### Board
- 11×11 CSS grid with tiles on the border
- Color bands matching Monopoly property groups
- Hover tooltips showing price, rent, owner
- Abbreviated tile names for readability
- Player tokens: colored dots with glow and initials

### Toasts
Color-coded slide-in notifications:
- 💰 Money events (green)
- ⚠️ Danger events (red)
- ✅ Success events (blue)
- ℹ️ Info events (gray)

---

## v0.3.0 — Persistent Storage

**Commit:** `d6fe8a1`

### Highlights
- Games survive server restarts via Upstash Redis
- 2-hour TTL auto-cleanup
- Graceful fallback to in-memory if Redis unavailable

---

## v0.2.0 — UX & Security

**Commit:** `6889f44`

### Highlights
- Shareable invite links
- Session persistence (auto-rejoin on refresh)
- Leave game with confirmation
- Connection status indicator
- CSP headers, rate limiting, input validation

---

## v0.1.0 — Initial Release

**Commit:** `4c7107a`

### Highlights
- Full Monopoly game loop (roll, buy, rent, jail, cards, bankrupt, win)
- 2–4 player real-time multiplayer
- Deployed to GitHub Pages + Render
