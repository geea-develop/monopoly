import fs from "fs";
import path from "path";
import { GameState } from "@monopoly/shared";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const GAMES_FILE = path.join(DATA_DIR, "games.json");

interface GamesStore {
  [gameId: string]: { state: GameState; createdAt: number; updatedAt: number };
}

let store: GamesStore = {};

export function initDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(GAMES_FILE)) {
    try {
      store = JSON.parse(fs.readFileSync(GAMES_FILE, "utf-8"));
    } catch {
      store = {};
    }
  }
}

function persist(): void {
  fs.writeFileSync(GAMES_FILE, JSON.stringify(store, null, 2));
}

export function saveGame(game: GameState): void {
  const now = Date.now();
  if (store[game.id]) {
    store[game.id].state = game;
    store[game.id].updatedAt = now;
  } else {
    store[game.id] = { state: game, createdAt: now, updatedAt: now };
  }
  persist();
}

export function loadGame(id: string): GameState | null {
  const entry = store[id];
  return entry ? entry.state : null;
}

export function deleteGame(id: string): void {
  delete store[id];
  persist();
}
