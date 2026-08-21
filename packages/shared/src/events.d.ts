import { GameState, Player } from "./types.js";
export interface ClientToServerEvents {
    /** Create a new game room */
    "game:create": (data: {
        playerName: string;
    }, callback: (response: {
        gameId: string;
    }) => void) => void;
    /** Join an existing game */
    "game:join": (data: {
        gameId: string;
        playerName: string;
    }, callback: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    /** Start the game (creator only, requires 2+ players) */
    "game:start": (callback: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    /** Roll dice for current turn */
    "turn:roll": () => void;
    /** Buy the property the player landed on */
    "turn:buy": () => void;
    /** Skip buying the property */
    "turn:skip": () => void;
    /** End current turn */
    "turn:end": () => void;
    /** Pay jail fee to get out */
    "jail:pay": () => void;
    /** Try to roll doubles to get out of jail */
    "jail:roll": () => void;
}
export interface ServerToClientEvents {
    /** Full game state sync (on join, reconnect, or major changes) */
    "game:state": (state: GameState) => void;
    /** A player joined the lobby */
    "game:player_joined": (player: Player) => void;
    /** Game has started */
    "game:started": () => void;
    /** Game has ended */
    "game:ended": (data: {
        winnerId: string;
        reason: string;
    }) => void;
    /** Dice roll result */
    "turn:rolled": (data: {
        playerId: string;
        dice: [number, number];
        newPosition: number;
        passedGo: boolean;
    }) => void;
    /** Player landed on a buyable property */
    "turn:buy_option": (data: {
        tileIndex: number;
        price: number;
    }) => void;
    /** Player bought a property */
    "turn:bought": (data: {
        playerId: string;
        tileIndex: number;
    }) => void;
    /** Player paid rent */
    "turn:rent_paid": (data: {
        payerId: string;
        ownerId: string;
        amount: number;
        tileIndex: number;
    }) => void;
    /** Player paid tax */
    "turn:tax_paid": (data: {
        playerId: string;
        amount: number;
    }) => void;
    /** Player went bankrupt */
    "turn:bankrupt": (data: {
        playerId: string;
    }) => void;
    /** Turn advanced to next player */
    "turn:next": (data: {
        currentPlayerIndex: number;
        turn: number;
    }) => void;
    /** Player sent to jail */
    "turn:jail": (data: {
        playerId: string;
    }) => void;
    /** Card drawn (Chance or Community Chest) */
    "turn:card": (data: {
        playerId: string;
        cardText: string;
    }) => void;
    /** Error message */
    "error": (data: {
        message: string;
    }) => void;
    /** A player disconnected */
    "game:player_disconnected": (data: {
        playerId: string;
        playerName: string;
    }) => void;
}
//# sourceMappingURL=events.d.ts.map