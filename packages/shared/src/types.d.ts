export declare enum TileType {
    Go = "go",
    Property = "property",
    Railroad = "railroad",
    Utility = "utility",
    Tax = "tax",
    Chance = "chance",
    CommunityChest = "community_chest",
    Jail = "jail",
    FreeParking = "free_parking",
    GoToJail = "go_to_jail"
}
export declare enum ColorGroup {
    Brown = "brown",
    LightBlue = "lightblue",
    Pink = "pink",
    Orange = "orange",
    Red = "red",
    Yellow = "yellow",
    Green = "green",
    DarkBlue = "darkblue"
}
export declare enum GamePhase {
    Lobby = "lobby",
    Playing = "playing",
    Finished = "finished"
}
export declare enum PlayerStatus {
    Active = "active",
    Bankrupt = "bankrupt"
}
export interface BaseTile {
    index: number;
    name: string;
    type: TileType;
}
export interface PropertyTile extends BaseTile {
    type: TileType.Property;
    color: ColorGroup;
    price: number;
    rent: number[];
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
export interface Player {
    id: string;
    name: string;
    balance: number;
    position: number;
    status: PlayerStatus;
    properties: number[];
    inJail: boolean;
    jailTurns: number;
    color: string;
}
export interface OwnedProperty {
    tileIndex: number;
    ownerId: string;
    houses: number;
}
export interface GameState {
    id: string;
    phase: GamePhase;
    players: Player[];
    currentPlayerIndex: number;
    turn: number;
    maxTurns: number;
    properties: OwnedProperty[];
    lastDice: [number, number] | null;
    winner: string | null;
    log: LogEntry[];
}
export interface LogEntry {
    turn: number;
    playerId: string;
    message: string;
    timestamp: number;
}
export declare enum CardAction {
    CollectMoney = "collect_money",
    PayMoney = "pay_money",
    MoveTo = "move_to",
    MoveSteps = "move_steps",
    GoToJail = "go_to_jail",
    GetOutOfJail = "get_out_of_jail",
    CollectFromAll = "collect_from_all",
    PayToAll = "pay_to_all"
}
export interface GameCard {
    text: string;
    action: CardAction;
    value?: number;
}
//# sourceMappingURL=types.d.ts.map