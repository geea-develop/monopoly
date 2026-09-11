import { v4 as uuid } from "uuid";
import {
  GameState,
  GamePhase,
  Player,
  PlayerStatus,
  OwnedProperty,
  LogEntry,
  TileType,
  Tile,
  PropertyTile,
  RailroadTile,
  UtilityTile,
  CardAction,
  GameCard,
  BOARD,
  GO_SALARY,
  STARTING_BALANCE,
  MAX_TURNS,
  JAIL_POSITION,
  JAIL_FEE,
  MAX_JAIL_TURNS,
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  ColorGroup,
} from "@monopoly/shared";

const PLAYER_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];

export function createGame(): GameState {
  return {
    id: uuid().slice(0, 8),
    phase: GamePhase.Lobby,
    players: [],
    currentPlayerIndex: 0,
    turn: 1,
    maxTurns: MAX_TURNS,
    properties: [],
    lastDice: null,
    winner: null,
    log: [],
  };
}

export function addPlayer(game: GameState, name: string): Player | null {
  if (game.players.length >= 4) return null;
  if (game.phase !== GamePhase.Lobby) return null;

  const player: Player = {
    id: uuid(),
    name,
    balance: STARTING_BALANCE,
    position: 0,
    status: PlayerStatus.Active,
    properties: [],
    inJail: false,
    jailTurns: 0,
    color: PLAYER_COLORS[game.players.length],
  };

  game.players.push(player);
  addLog(game, player.id, `${name} joined the game`);
  return player;
}

export function startGame(game: GameState): boolean {
  if (game.players.length < 2) return false;
  if (game.phase !== GamePhase.Lobby) return false;
  game.phase = GamePhase.Playing;
  addLog(game, "", "Game started!");
  return true;
}

export function rollDice(): [number, number] {
  const forced = process.env.MONOPOLY_TEST_DICE?.split(",").map(Number);
  if (forced?.length === 2 && forced.every((value) => Number.isInteger(value) && value >= 1 && value <= 6)) {
    return [forced[0], forced[1]];
  }
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function getCurrentPlayer(game: GameState): Player {
  return game.players[game.currentPlayerIndex];
}

export function getActivePlayers(game: GameState): Player[] {
  return game.players.filter((p) => p.status === PlayerStatus.Active);
}

export interface MoveResult {
  dice: [number, number];
  newPosition: number;
  passedGo: boolean;
  tile: Tile;
}

export function movePlayer(game: GameState, player: Player, dice: [number, number]): MoveResult {
  const total = dice[0] + dice[1];
  const oldPosition = player.position;
  const newPosition = (oldPosition + total) % 40;
  const passedGo = newPosition < oldPosition;

  player.position = newPosition;
  game.lastDice = dice;

  if (passedGo) {
    player.balance += GO_SALARY;
    addLog(game, player.id, `${player.name} passed Go and collected $${GO_SALARY}`);
  }

  return { dice, newPosition, passedGo, tile: BOARD[newPosition] };
}

export interface LandingResult {
  type: "buy_option" | "rent" | "tax" | "jail" | "card" | "nothing";
  amount?: number;
  ownerId?: string;
  tileIndex?: number;
  cardText?: string;
  bankrupt?: boolean;
}

export function processLanding(game: GameState, player: Player): LandingResult {
  const tile = BOARD[player.position];

  switch (tile.type) {
    case TileType.Property:
    case TileType.Railroad:
    case TileType.Utility: {
      const owned = game.properties.find((p) => p.tileIndex === tile.index);
      if (!owned) {
        // Can buy
        if (player.balance >= tile.price) {
          return { type: "buy_option", amount: tile.price, tileIndex: tile.index };
        }
        return { type: "nothing" };
      }
      if (owned.ownerId === player.id) {
        return { type: "nothing" };
      }
      // Pay rent
      const rent = calculateRent(game, tile, owned);
      const bankrupt = player.balance < rent;
      payRent(game, player, owned.ownerId, rent);
      return { type: "rent", amount: rent, ownerId: owned.ownerId, tileIndex: tile.index, bankrupt };
    }

    case TileType.Tax: {
      const amount = tile.price;
      const bankrupt = player.balance < amount;
      player.balance -= Math.min(amount, player.balance);
      addLog(game, player.id, `${player.name} paid $${amount} tax`);
      if (bankrupt) {
        bankruptPlayer(game, player);
      }
      return { type: "tax", amount, bankrupt };
    }

    case TileType.GoToJail: {
      sendToJail(game, player);
      return { type: "jail" };
    }

    case TileType.Chance:
    case TileType.CommunityChest: {
      const cards = tile.type === TileType.Chance ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
      const card = cards[Math.floor(Math.random() * cards.length)];
      processCard(game, player, card);
      return { type: "card", cardText: card.text };
    }

    default:
      return { type: "nothing" };
  }
}

function calculateRent(game: GameState, tile: Tile, owned: OwnedProperty): number {
  if (tile.type === TileType.Property) {
    const propTile = tile as PropertyTile;
    // Check if owner has full color group
    const colorTiles = BOARD.filter(
      (t) => t.type === TileType.Property && (t as PropertyTile).color === propTile.color
    );
    const ownerOwnsAll = colorTiles.every((ct) =>
      game.properties.some((p) => p.tileIndex === ct.index && p.ownerId === owned.ownerId)
    );
    const baseRent = propTile.rent[owned.houses];
    return ownerOwnsAll && owned.houses === 0 ? baseRent * 2 : baseRent;
  }

  if (tile.type === TileType.Railroad) {
    const railroadsOwned = game.properties.filter(
      (p) => p.ownerId === owned.ownerId && BOARD[p.tileIndex].type === TileType.Railroad
    ).length;
    return 25 * Math.pow(2, railroadsOwned - 1);
  }

  if (tile.type === TileType.Utility) {
    const utilitiesOwned = game.properties.filter(
      (p) => p.ownerId === owned.ownerId && BOARD[p.tileIndex].type === TileType.Utility
    ).length;
    const diceTotal = game.lastDice ? game.lastDice[0] + game.lastDice[1] : 7;
    return utilitiesOwned === 2 ? diceTotal * 10 : diceTotal * 4;
  }

  return 0;
}

function payRent(game: GameState, player: Player, ownerId: string, amount: number): void {
  const owner = game.players.find((p) => p.id === ownerId);
  const actualPayment = Math.min(amount, player.balance);
  player.balance -= actualPayment;
  if (owner) {
    owner.balance += actualPayment;
  }
  addLog(game, player.id, `${player.name} paid $${actualPayment} rent to ${owner?.name ?? "unknown"}`);
  if (player.balance <= 0) {
    bankruptPlayer(game, player);
  }
}

export function buyProperty(game: GameState, player: Player): boolean {
  const tile = BOARD[player.position];
  if (tile.type !== TileType.Property && tile.type !== TileType.Railroad && tile.type !== TileType.Utility) {
    return false;
  }
  if (player.balance < tile.price) return false;
  if (game.properties.some((p) => p.tileIndex === tile.index)) return false;

  player.balance -= tile.price;
  player.properties.push(tile.index);
  game.properties.push({ tileIndex: tile.index, ownerId: player.id, houses: 0 });
  addLog(game, player.id, `${player.name} bought ${tile.name} for $${tile.price}`);
  return true;
}

export function sendToJail(game: GameState, player: Player): void {
  player.position = JAIL_POSITION;
  player.inJail = true;
  player.jailTurns = 0;
  addLog(game, player.id, `${player.name} was sent to Jail!`);
}

export function payJailFee(game: GameState, player: Player): boolean {
  if (!player.inJail) return false;
  if (player.balance < JAIL_FEE) return false;
  player.balance -= JAIL_FEE;
  player.inJail = false;
  player.jailTurns = 0;
  addLog(game, player.id, `${player.name} paid $${JAIL_FEE} to get out of Jail`);
  return true;
}

export function jailRoll(game: GameState, player: Player): { freed: boolean; dice: [number, number] } {
  const dice = rollDice();
  player.jailTurns++;
  game.lastDice = dice;

  if (dice[0] === dice[1]) {
    player.inJail = false;
    player.jailTurns = 0;
    addLog(game, player.id, `${player.name} rolled doubles and escaped Jail!`);
    return { freed: true, dice };
  }

  if (player.jailTurns >= MAX_JAIL_TURNS) {
    player.balance -= JAIL_FEE;
    player.inJail = false;
    player.jailTurns = 0;
    addLog(game, player.id, `${player.name} spent 3 turns in Jail and paid $${JAIL_FEE}`);
    if (player.balance <= 0) {
      bankruptPlayer(game, player);
    }
    return { freed: true, dice };
  }

  addLog(game, player.id, `${player.name} failed to roll doubles in Jail (turn ${player.jailTurns}/${MAX_JAIL_TURNS})`);
  return { freed: false, dice };
}

function processCard(game: GameState, player: Player, card: GameCard): void {
  addLog(game, player.id, `${player.name} drew: "${card.text}"`);

  switch (card.action) {
    case CardAction.CollectMoney:
      player.balance += card.value!;
      break;
    case CardAction.PayMoney:
      player.balance -= Math.min(card.value!, player.balance);
      if (player.balance <= 0) bankruptPlayer(game, player);
      break;
    case CardAction.MoveTo: {
      const target = card.value!;
      if (target < player.position) {
        player.balance += GO_SALARY; // passed Go
      }
      player.position = target;
      break;
    }
    case CardAction.MoveSteps: {
      const newPos = (player.position + card.value! + 40) % 40;
      player.position = newPos;
      break;
    }
    case CardAction.GoToJail:
      sendToJail(game, player);
      break;
    case CardAction.CollectFromAll: {
      const others = game.players.filter((p) => p.id !== player.id && p.status === PlayerStatus.Active);
      for (const other of others) {
        const payment = Math.min(card.value!, other.balance);
        other.balance -= payment;
        player.balance += payment;
      }
      break;
    }
    case CardAction.PayToAll: {
      const others = game.players.filter((p) => p.id !== player.id && p.status === PlayerStatus.Active);
      for (const other of others) {
        const payment = Math.min(card.value!, player.balance);
        player.balance -= payment;
        other.balance += payment;
        if (player.balance <= 0) {
          bankruptPlayer(game, player);
          break;
        }
      }
      break;
    }
    case CardAction.GetOutOfJail:
      // Simplified: just free the player if in jail
      if (player.inJail) {
        player.inJail = false;
        player.jailTurns = 0;
      }
      break;
  }
}

export function bankruptPlayer(game: GameState, player: Player): void {
  player.status = PlayerStatus.Bankrupt;
  // Remove their properties
  game.properties = game.properties.filter((p) => p.ownerId !== player.id);
  player.properties = [];
  addLog(game, player.id, `${player.name} went bankrupt!`);
}

export function advanceTurn(game: GameState): { gameOver: boolean; winnerId?: string; reason?: string } {
  // Check win condition: only one active player left
  const activePlayers = getActivePlayers(game);
  if (activePlayers.length === 1) {
    game.phase = GamePhase.Finished;
    game.winner = activePlayers[0].id;
    addLog(game, activePlayers[0].id, `${activePlayers[0].name} wins! All other players are bankrupt.`);
    return { gameOver: true, winnerId: activePlayers[0].id, reason: "Last player standing" };
  }

  // Move to next active player
  do {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  } while (game.players[game.currentPlayerIndex].status === PlayerStatus.Bankrupt);

  // If we looped back to the first player of this round, increment turn
  if (game.currentPlayerIndex === 0 || game.players.slice(0, game.currentPlayerIndex).every((p) => p.status === PlayerStatus.Bankrupt)) {
    game.turn++;
  }

  // Check max turns
  if (game.turn > game.maxTurns) {
    game.phase = GamePhase.Finished;
    const richest = activePlayers.reduce((a, b) => (a.balance > b.balance ? a : b));
    game.winner = richest.id;
    addLog(game, richest.id, `Max turns reached! ${richest.name} wins with $${richest.balance}!`);
    return { gameOver: true, winnerId: richest.id, reason: "Max turns reached — richest player wins" };
  }

  return { gameOver: false };
}

function addLog(game: GameState, playerId: string, message: string): void {
  game.log.push({
    turn: game.turn,
    playerId,
    message,
    timestamp: Date.now(),
  });
  // Keep last 100 entries
  if (game.log.length > 100) {
    game.log = game.log.slice(-100);
  }
}
