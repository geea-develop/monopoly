/**
 * Monopoly AI opponent.
 *
 * Pure, deterministic decision functions used to drive computer players in the
 * offline single-player mode. They take the current game state plus a
 * difficulty and return a decision — no I/O, no randomness — so they can be
 * unit-tested directly and reused on client or server.
 *
 * The turn *orchestration* (roll -> move -> land -> buy/skip -> end) lives in
 * the caller (the client's local-game adapter, mirroring the server); this
 * module only answers the "what should the bot decide?" questions.
 */
import { GameState, Player, Tile, TileType, PropertyTile } from "./types.js";
import { BOARD, JAIL_FEE } from "./board.js";

export type Difficulty = "easy" | "medium" | "hard";

/** Cash the bot wants to keep in reserve after a purchase, by difficulty. */
const CASH_BUFFER: Record<Difficulty, number> = {
  easy: 150, // timid — keeps a large buffer, buys less
  medium: 80,
  hard: 20, // aggressive — spends down to almost nothing to grab property
};

/** How many other properties in a color group the bot already owns. */
function ownedInColorGroup(game: GameState, ownerId: string, color: string): number {
  const groupIndices = BOARD.filter(
    (t): t is PropertyTile => t.type === TileType.Property && t.color === color
  ).map((t) => t.index);
  return game.properties.filter(
    (p) => p.ownerId === ownerId && groupIndices.includes(p.tileIndex)
  ).length;
}

/**
 * Decide whether a bot should buy the property it landed on.
 *
 * Heuristic:
 *  - Never buy if it can't afford to keep its difficulty cash buffer.
 *  - Always favour buying property that advances a color group the bot already
 *    has a foothold in (monopolies win games).
 *  - Railroads/utilities are decent value — buy when affordable.
 *  - Harder bots buy more readily (smaller buffer + lower price/cash ratio bar).
 */
export function decideBuy(
  game: GameState,
  player: Player,
  tileIndex: number,
  price: number,
  difficulty: Difficulty
): boolean {
  if (price > player.balance) return false;

  const buffer = CASH_BUFFER[difficulty];
  const balanceAfter = player.balance - price;
  if (balanceAfter < buffer) return false;

  const tile: Tile = BOARD[tileIndex];

  // Strongly prefer completing / extending a color group.
  if (tile.type === TileType.Property) {
    const alreadyOwned = ownedInColorGroup(game, player.id, tile.color);
    if (alreadyOwned > 0) return true;
  }

  // Otherwise buy unless the price is a large fraction of remaining cash.
  // Easy bots are cautious (only cheap buys), hard bots take big swings.
  const priceRatioCap: Record<Difficulty, number> = {
    easy: 0.35,
    medium: 0.55,
    hard: 0.8,
  };
  return price / player.balance <= priceRatioCap[difficulty];
}

/**
 * Decide how a jailed bot escapes: "pay" the fee or "roll" for doubles.
 *
 * Paying frees the bot immediately to keep collecting rent / buying, but costs
 * money. Roll is free but wastes turns. Harder bots value tempo (pay when they
 * can comfortably afford it); easy bots hoard cash and prefer to roll.
 */
export function decideJail(
  game: GameState,
  player: Player,
  difficulty: Difficulty
): "pay" | "roll" {
  if (player.balance < JAIL_FEE) return "roll"; // can't pay

  // On the last mandatory jail turn the fee is paid automatically by the
  // engine, so there is no benefit to paying early here — roll for a chance at
  // free doubles.
  const payThreshold: Record<Difficulty, number> = {
    easy: 400, // only pay if very comfortable
    medium: 250,
    hard: 120, // pay readily to keep tempo
  };

  return player.balance >= payThreshold[difficulty] ? "pay" : "roll";
}

/** Difficulty-scaled think time (ms) for the adapter to pace bot moves in UI. */
export function botThinkDelay(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return 900;
    case "medium":
      return 700;
    case "hard":
      return 500;
  }
}
