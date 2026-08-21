// ─── Enums ──────────────────────────────────────────────────────────────────

export enum TileType {
  Go = "go",
  Property = "property",
  Railroad = "railroad",
  Utility = "utility",
  Tax = "tax",
  Chance = "chance",
  CommunityChest = "community_chest",
  Jail = "jail",
  FreeParking = "free_parking",
  GoToJail = "go_to_jail",
}

export enum ColorGroup {
  Brown = "brown",
  LightBlue = "lightblue",
  Pink = "pink",
  Orange = "orange",
  Red = "red",
  Yellow = "yellow",
  Green = "green",
  DarkBlue = "darkblue",
}

export enum GamePhase {
  Lobby = "lobby",
  Playing = "playing",
  Finished = "finished",
}

export enum PlayerStatus {
  Active = "active",
  Bankrupt = "bankrupt",
}

// ─── Tile Types ─────────────────────────────────────────────────────────────

export interface BaseTile {
  index: number;
  name: string;
  type: TileType;
}

export interface PropertyTile extends BaseTile {
  type: TileType.Property;
  color: ColorGroup;
  price: number;
  rent: number[]; // [base, 1house, 2house, 3house, 4house, hotel]
}

export interface RailroadTile extends BaseTile {
  type: TileType.Railroad;
  price: number;
}

export interface UtilityTile extends BaseTile {
  type: TileType.Utility;
  price: number;
}

export interface TaxTile extends BaseTile {
  type: TileType.Tax;
  price: number;
}

export interface SimpleTile extends BaseTile {
  type: TileType.Go | TileType.Chance | TileType.CommunityChest | TileType.Jail | TileType.FreeParking | TileType.GoToJail;
}

export type Tile = PropertyTile | RailroadTile | UtilityTile | TaxTile | SimpleTile;

// ─── Game State ─────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  balance: number;
  position: number;
  status: PlayerStatus;
  properties: number[]; // tile indices owned
  inJail: boolean;
  jailTurns: number;
  color: string; // display color for UI
}

export interface OwnedProperty {
  tileIndex: number;
  ownerId: string;
  houses: number; // 0-5, 5 = hotel (unused in v1)
}

export interface GameState {
  id: string; // UUID slug
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  turn: number;
  maxTurns: number;
  properties: OwnedProperty[];
  lastDice: [number, number] | null;
  winner: string | null; // player id
  log: LogEntry[];
}

export interface LogEntry {
  turn: number;
  playerId: string;
  message: string;
  timestamp: number;
}

// ─── Chance / Community Chest Cards ─────────────────────────────────────────

export enum CardAction {
  CollectMoney = "collect_money",
  PayMoney = "pay_money",
  MoveTo = "move_to",
  MoveSteps = "move_steps",
  GoToJail = "go_to_jail",
  GetOutOfJail = "get_out_of_jail",
  CollectFromAll = "collect_from_all",
  PayToAll = "pay_to_all",
}

export interface GameCard {
  text: string;
  action: CardAction;
  value?: number; // dollar amount or tile index or step count
}
