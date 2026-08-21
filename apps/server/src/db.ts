import { Redis } from "@upstash/redis";
import { GameState } from "@monopoly/shared";

const GAME_TTL = 60 * 60 * 2; // 2 hours — auto-expire stale games
const KEY_PREFIX = "game:";

let redis: Redis;

export function initDb(): void {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("⚠️  UPSTASH_REDIS_REST_URL or TOKEN not set — using in-memory fallback");
    return;
  }

  redis = new Redis({ url, token });
  console.log("✓ Connected to Upstash Redis");
}

export async function saveGame(game: GameState): Promise<void> {
  if (!redis) return;
  await redis.set(`${KEY_PREFIX}${game.id}`, JSON.stringify(game), { ex: GAME_TTL });
}

export async function loadGame(id: string): Promise<GameState | null> {
  if (!redis) return null;
  const data = await redis.get<string>(`${KEY_PREFIX}${id}`);
  if (!data) return null;
  // Upstash auto-parses JSON if stored as string, but let's be safe
  if (typeof data === "string") {
    return JSON.parse(data) as GameState;
  }
  return data as unknown as GameState;
}

export async function deleteGame(id: string): Promise<void> {
  if (!redis) return;
  await redis.del(`${KEY_PREFIX}${id}`);
}
