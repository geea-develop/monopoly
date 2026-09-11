import assert from "node:assert/strict";
import test from "node:test";
import {
  GamePhase,
  PlayerStatus,
  TileType,
  BOARD,
  STARTING_BALANCE,
  createGame,
  addPlayer,
  startGame,
  rollDice,
  movePlayer,
  processLanding,
  buyProperty,
  advanceTurn,
  getCurrentPlayer,
  decideBuy,
  decideJail,
} from "@monopoly/shared";

// ── Engine (relocated to @monopoly/shared) ──────────────────────────────────

test("createGame + addPlayer + startGame set up a 2-player game", () => {
  const game = createGame();
  assert.equal(game.phase, GamePhase.Lobby);
  assert.equal(startGame(game), false, "cannot start with 0 players");

  const a = addPlayer(game, "Human");
  const b = addPlayer(game, "Bot");
  assert.ok(a && b);
  assert.equal(a!.balance, STARTING_BALANCE);
  assert.equal(startGame(game), true);
  assert.equal(game.phase, GamePhase.Playing);
});

test("addPlayer caps at 4 players and only in lobby", () => {
  const game = createGame();
  addPlayer(game, "P1");
  addPlayer(game, "P2");
  addPlayer(game, "P3");
  addPlayer(game, "P4");
  assert.equal(game.players.length, 4);
  assert.equal(addPlayer(game, "P5"), null, "5th player rejected");
  startGame(game);
  assert.equal(addPlayer(game, "Late"), null, "cannot join after start");
});

test("movePlayer wraps the board and awards GO salary on passing", () => {
  const game = createGame();
  const p = addPlayer(game, "P1")!;
  addPlayer(game, "P2");
  startGame(game);

  p.position = 38;
  const before = p.balance;
  const result = movePlayer(game, p, [3, 3]); // 38 -> (44 % 40) = 4, passed Go
  assert.equal(result.newPosition, 4);
  assert.equal(result.passedGo, true);
  assert.equal(p.balance, before + 200);
});

test("buyProperty transfers a property and deducts balance", () => {
  const game = createGame();
  const p = addPlayer(game, "P1")!;
  addPlayer(game, "P2");
  startGame(game);

  // Find the first buyable property tile and land on it.
  const propIndex = BOARD.findIndex((t) => t.type === TileType.Property);
  p.position = propIndex;
  const price = (BOARD[propIndex] as any).price;
  const before = p.balance;

  const landing = processLanding(game, p);
  assert.equal(landing.type, "buy_option");
  assert.equal(buyProperty(game, p), true);
  assert.equal(p.balance, before - price);
  assert.ok(game.properties.some((op) => op.tileIndex === propIndex && op.ownerId === p.id));
});

test("advanceTurn ends the game when only one active player remains", () => {
  const game = createGame();
  const a = addPlayer(game, "Winner")!;
  const b = addPlayer(game, "Loser")!;
  startGame(game);
  b.status = PlayerStatus.Bankrupt;

  const result = advanceTurn(game);
  assert.equal(result.gameOver, true);
  assert.equal(result.winnerId, a.id);
  assert.equal(game.phase, GamePhase.Finished);
});

test("rollDice honours MONOPOLY_TEST_DICE for determinism", () => {
  process.env.MONOPOLY_TEST_DICE = "2,5";
  assert.deepEqual(rollDice(), [2, 5]);
  delete process.env.MONOPOLY_TEST_DICE;
});

// ── AI decisions ─────────────────────────────────────────────────────────────

test("decideBuy respects the difficulty cash buffer", () => {
  const game = createGame();
  const p = addPlayer(game, "Bot")!;
  addPlayer(game, "Human");
  startGame(game);

  const propIndex = BOARD.findIndex((t) => t.type === TileType.Property);
  const price = (BOARD[propIndex] as any).price;

  // Broke bot never buys.
  p.balance = price; // buying would leave 0, below every buffer
  assert.equal(decideBuy(game, p, propIndex, price, "easy"), false);

  // Rich bot buys.
  p.balance = 1500;
  assert.equal(decideBuy(game, p, propIndex, price, "hard"), true);
});

test("decideBuy favours completing a color group", () => {
  const game = createGame();
  const bot = addPlayer(game, "Bot")!;
  addPlayer(game, "Human");
  startGame(game);
  bot.balance = 300;

  // Two property tiles of the same color group.
  const props = BOARD.filter((t) => t.type === TileType.Property) as any[];
  const color = props[0].color;
  const sameColor = props.filter((t) => t.color === color);
  assert.ok(sameColor.length >= 2, "test needs a color with 2+ tiles");

  // Bot already owns one of the group.
  game.properties.push({ tileIndex: sameColor[0].index, ownerId: bot.id, houses: 0 });
  const target = sameColor[1];
  // Even a cautious easy bot should extend a group it has a foothold in.
  assert.equal(decideBuy(game, bot, target.index, target.price, "easy"), true);
});

test("decideJail: pay when flush, roll when short", () => {
  const game = createGame();
  const bot = addPlayer(game, "Bot")!;
  addPlayer(game, "Human");
  startGame(game);
  bot.inJail = true;

  bot.balance = 40; // below the $50 fee
  assert.equal(decideJail(game, bot, "hard"), "roll");

  bot.balance = 500; // very comfortable
  assert.equal(decideJail(game, bot, "easy"), "pay");
});

// ── Offline orchestration (engine + AI, no network) ─────────────────────────

test("a full AI-driven game reaches a terminal state deterministically", () => {
  // Deterministic dice so the loop is reproducible: doubles-free 3+2 = 5.
  process.env.MONOPOLY_TEST_DICE = "3,2";
  try {
    const game = createGame();
    const bots = [addPlayer(game, "Bot A")!, addPlayer(game, "Bot B")!];
    startGame(game);
    const difficulty = "hard" as const;

    let guard = 0;
    while (game.phase === GamePhase.Playing && guard++ < 2000) {
      const player = getCurrentPlayer(game);

      if (player.inJail) {
        // With fixed non-doubles dice, roll it out; engine frees after max turns.
        jailTurn(game, player, difficulty);
        advanceTurn(game);
        continue;
      }

      const move = movePlayer(game, player, rollDice());
      void move;
      const landing = processLanding(game, player);
      if (landing.type === "buy_option") {
        if (decideBuy(game, player, landing.tileIndex!, landing.amount!, difficulty)) {
          buyProperty(game, player);
        }
      }
      advanceTurn(game);
    }

    assert.equal(game.phase, GamePhase.Finished, "game should finish");
    assert.ok(game.winner, "there should be a winner");
    // maxTurns is the natural terminator when nobody goes bankrupt.
    assert.ok(game.turn >= 1);
    void bots;
  } finally {
    delete process.env.MONOPOLY_TEST_DICE;
  }
});

// Minimal jail resolution used by the loop above.
function jailTurn(game: any, player: any, _difficulty: any) {
  // Mirror engine jailRoll indirectly: just increment and free after 3.
  player.jailTurns++;
  if (player.jailTurns >= 3) {
    player.inJail = false;
    player.jailTurns = 0;
    player.balance -= 50;
    if (player.balance <= 0) player.status = PlayerStatus.Bankrupt;
  }
}
