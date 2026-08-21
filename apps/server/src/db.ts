import { GameState } from "@monopoly/shared";

const MAX_GAMES = 5;

interface CacheEntry {
  state: GameState;
  lastAccessed: number;
}

const cache = new Map<string, CacheEntry>();

function evictOldest(): void {
  if (cache.size <= MAX_GAMES) return;

  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of cache) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    cache.delete(oldestKey);
    console.log(`Evicted oldest game: ${oldestKey}`);
  }
}

export function initDb(): void {
  // No-op for in-memory store
}

export function saveGame(game: GameState): void {
  cache.set(game.id, { state: game, lastAccessed: Date.now() });
  evictOldest();
}

export function loadGame(id: string): GameState | null {
  const entry = cache.get(id);
  if (!entry) return null;
  entry.lastAccessed = Date.now();
  return entry.state;
}

export function deleteGame(id: string): void {
  cache.delete(id);
}
