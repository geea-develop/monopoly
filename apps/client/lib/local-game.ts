"use client";

/**
 * Offline single-player adapter for Monopoly.
 *
 * Implements just enough of the Socket.IO client surface (`on`/`off`/`once`/
 * `emit`/`connected`/`connect`/`disconnect`) that the existing UI can talk to
 * it unchanged. Instead of a network, it runs the shared game engine + AI
 * opponents entirely in the browser — ZERO network calls — and persists the
 * game to localStorage so it survives reloads (playable as an installed PWA
 * with no internet).
 *
 * It mirrors the server's orchestration in apps/server/src/index.ts, including
 * the `autoEndTurn` delays and the landing-result event mapping, and it
 * auto-plays the computer players' turns via the shared AI.
 */
import {
  GameState,
  GamePhase,
  Player,
  PlayerStatus,
  TileType,
  ServerToClientEvents,
  BOARD,
  createGame,
  addPlayer,
  startGame,
  rollDice,
  movePlayer,
  processLanding,
  buyProperty,
  advanceTurn,
  getCurrentPlayer,
  payJailFee,
  jailRoll,
  decideBuy,
  decideJail,
  botThinkDelay,
  Difficulty,
} from "@monopoly/shared";

const STORAGE_KEY = "monopoly_offline_game";
const BOT_NAMES = ["Ada Bot", "Turing Bot", "Lovelace Bot"];

type Handler = (...args: any[]) => void;

interface OfflineSave {
  game: GameState;
  humanId: string;
  botIds: string[];
  difficulty: Difficulty;
}

function getTilePrice(tileIndex: number): number | null {
  const t = BOARD[tileIndex];
  if (t.type === TileType.Property || t.type === TileType.Railroad || t.type === TileType.Utility) {
    return t.price;
  }
  return null;
}

export class LocalGameSocket {
  connected = true;
  id = "offline";

  private handlers = new Map<string, Set<Handler>>();
  private game: GameState | null = null;
  private humanId = "";
  private botIds: string[] = [];
  private difficulty: Difficulty = "medium";
  private timers = new Set<ReturnType<typeof setTimeout>>();

  // ── Socket.IO-compatible surface ──────────────────────────────────────────

  on(event: string, handler: Handler): this {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    // The UI expects a "connect" event to flip status to connected.
    if (event === "connect") this.schedule(() => handler(), 0);
    return this;
  }

  once(event: string, handler: Handler): this {
    const wrapper: Handler = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  off(event: string, handler?: Handler): this {
    if (!handler) this.handlers.delete(event);
    else this.handlers.get(event)?.delete(handler);
    return this;
  }

  connect(): this {
    this.connected = true;
    this.emitLocal("connect");
    return this;
  }

  disconnect(): this {
    this.connected = false;
    this.clearTimers();
    return this;
  }

  /** Client → "server" events. Some carry a callback as the last argument. */
  emit(event: string, ...args: any[]): this {
    const maybeCb = args[args.length - 1];
    const cb = typeof maybeCb === "function" ? (maybeCb as Handler) : undefined;
    const data = args[0];

    switch (event) {
      case "game:create":
        this.handleCreate(data, cb);
        break;
      case "game:join":
        cb?.({ success: false, error: "Offline game" });
        break;
      case "game:rejoin":
        this.handleRejoin(data, cb);
        break;
      case "game:start":
        this.handleStart(cb);
        break;
      case "turn:roll":
        this.handleRoll();
        break;
      case "turn:buy":
        this.handleBuy();
        break;
      case "turn:skip":
        this.handleSkip();
        break;
      case "turn:end":
        this.handleEnd();
        break;
      case "jail:pay":
        this.handleJailPay();
        break;
      case "jail:roll":
        this.handleJailRoll();
        break;
    }
    return this;
  }

  // ── Emit helpers (server → client) ────────────────────────────────────────

  private emitLocal(event: keyof ServerToClientEvents | "connect" | "disconnect", ...args: any[]): void {
    const set = this.handlers.get(event as string);
    if (!set) return;
    for (const h of [...set]) h(...args);
  }

  private schedule(fn: () => void, ms: number): void {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  private syncState(): void {
    if (this.game) {
      this.persist();
      this.emitLocal("game:state", this.game);
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private persist(): void {
    if (typeof window === "undefined" || !this.game) return;
    try {
      const save: OfflineSave = {
        game: this.game,
        humanId: this.humanId,
        botIds: this.botIds,
        difficulty: this.difficulty,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      /* quota / private mode — game still works for this session */
    }
  }

  static loadSave(): OfflineSave | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as OfflineSave) : null;
    } catch {
      return null;
    }
  }

  static clearSave(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Create a solo game: 1 human + `botCount` (1-3) AI opponents. */
  createOfflineGame(humanName: string, botCount: number, difficulty: Difficulty): { gameId: string; playerId: string } {
    const count = Math.max(1, Math.min(3, botCount));
    const game = createGame();
    const human = addPlayer(game, humanName)!;
    const botIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const bot = addPlayer(game, BOT_NAMES[i])!;
      botIds.push(bot.id);
    }
    this.game = game;
    this.humanId = human.id;
    this.botIds = botIds;
    this.difficulty = difficulty;
    this.persist();
    return { gameId: game.id, playerId: human.id };
  }

  private handleCreate(_data: { playerName: string }, cb?: Handler): void {
    // The offline game is created via createOfflineGame() before the UI mounts;
    // just report identity and push the initial state.
    if (!this.game) {
      cb?.({ gameId: "", playerId: "" });
      return;
    }
    cb?.({ gameId: this.game.id, playerId: this.humanId });
    this.schedule(() => this.emitLocal("game:state", this.game!), 0);
  }

  private handleRejoin(data: { gameId: string; playerId: string }, cb?: Handler): void {
    const save = LocalGameSocket.loadSave();
    if (!save || save.game.id !== data.gameId) {
      cb?.({ success: false, error: "Game not found" });
      return;
    }
    this.game = save.game;
    this.humanId = save.humanId;
    this.botIds = save.botIds;
    this.difficulty = save.difficulty;
    cb?.({ success: true });
    this.schedule(() => {
      this.emitLocal("game:state", this.game!);
      this.maybeRunBotTurn();
    }, 0);
  }

  private handleStart(cb?: Handler): void {
    if (!this.game) {
      cb?.({ success: false, error: "No game" });
      return;
    }
    if (!startGame(this.game)) {
      cb?.({ success: false, error: "Need at least 2 players" });
      return;
    }
    cb?.({ success: true });
    this.emitLocal("game:started");
    this.syncState();
    this.maybeRunBotTurn();
  }

  // ── Turn handling (mirrors server index.ts) ───────────────────────────────

  private isCurrent(playerId: string): boolean {
    return !!this.game && getCurrentPlayer(this.game).id === playerId;
  }

  private handleRoll(): void {
    const game = this.game;
    if (!game) return;
    const player = getCurrentPlayer(game);
    if (player.inJail) return;

    const dice = rollDice();
    const moveResult = movePlayer(game, player, dice);
    this.emitLocal("turn:rolled", {
      playerId: player.id,
      dice: moveResult.dice,
      newPosition: moveResult.newPosition,
      passedGo: moveResult.passedGo,
    });

    const landing = processLanding(game, player);
    this.emitLandingResult(player, landing);
    this.syncState();

    if (landing.type !== "buy_option") {
      this.autoEndTurn(player.id, 2000);
    }
  }

  private handleBuy(): void {
    const game = this.game;
    if (!game) return;
    const player = getCurrentPlayer(game);
    if (buyProperty(game, player)) {
      this.emitLocal("turn:bought", { playerId: player.id, tileIndex: player.position });
      this.syncState();
      this.autoEndTurn(player.id, 2000);
    }
  }

  private handleSkip(): void {
    const game = this.game;
    if (!game) return;
    this.autoEndTurn(getCurrentPlayer(game).id, 1500);
  }

  private handleEnd(): void {
    if (!this.game) return;
    this.advanceAndEmit();
  }

  private handleJailPay(): void {
    const game = this.game;
    if (!game) return;
    const player = getCurrentPlayer(game);
    if (payJailFee(game, player)) {
      this.syncState();
      this.autoEndTurn(player.id, 2000);
    }
  }

  private handleJailRoll(): void {
    const game = this.game;
    if (!game) return;
    const player = getCurrentPlayer(game);
    const result = jailRoll(game, player);

    this.emitLocal("turn:rolled", {
      playerId: player.id,
      dice: result.dice,
      newPosition: player.position,
      passedGo: false,
    });

    if (result.freed && player.status !== PlayerStatus.Bankrupt) {
      const moveResult = movePlayer(game, player, result.dice);
      this.emitLocal("turn:rolled", {
        playerId: player.id,
        dice: result.dice,
        newPosition: moveResult.newPosition,
        passedGo: moveResult.passedGo,
      });
      const landing = processLanding(game, player);
      this.emitLandingResult(player, landing);
      this.syncState();
      if (landing.type !== "buy_option") {
        this.autoEndTurn(player.id, 2000);
      }
    } else {
      this.syncState();
      this.autoEndTurn(player.id, 2000);
    }
  }

  private advanceAndEmit(): void {
    const game = this.game!;
    const result = advanceTurn(game);
    if (result.gameOver) {
      this.emitLocal("game:ended", { winnerId: result.winnerId!, reason: result.reason! });
    } else {
      this.emitLocal("turn:next", { currentPlayerIndex: game.currentPlayerIndex, turn: game.turn });
    }
    this.syncState();
    if (!result.gameOver) this.maybeRunBotTurn();
  }

  private autoEndTurn(playerId: string, delayMs: number): void {
    this.schedule(() => {
      const game = this.game;
      if (!game || game.phase !== GamePhase.Playing) return;
      if (getCurrentPlayer(game).id !== playerId) return;
      this.advanceAndEmit();
    }, delayMs);
  }

  private emitLandingResult(player: Player, landing: ReturnType<typeof processLanding>): void {
    switch (landing.type) {
      case "buy_option":
        this.emitLocal("turn:buy_option", { tileIndex: landing.tileIndex!, price: landing.amount! });
        break;
      case "rent":
        this.emitLocal("turn:rent_paid", {
          payerId: player.id,
          ownerId: landing.ownerId!,
          amount: landing.amount!,
          tileIndex: landing.tileIndex!,
        });
        if (landing.bankrupt) this.emitLocal("turn:bankrupt", { playerId: player.id });
        break;
      case "tax":
        this.emitLocal("turn:tax_paid", { playerId: player.id, amount: landing.amount! });
        if (landing.bankrupt) this.emitLocal("turn:bankrupt", { playerId: player.id });
        break;
      case "jail":
        this.emitLocal("turn:jail", { playerId: player.id });
        break;
      case "card":
        this.emitLocal("turn:card", { playerId: player.id, cardText: landing.cardText! });
        break;
    }
  }

  // ── Bot auto-play ─────────────────────────────────────────────────────────

  private maybeRunBotTurn(): void {
    const game = this.game;
    if (!game || game.phase !== GamePhase.Playing) return;
    const current = getCurrentPlayer(game);
    if (!this.botIds.includes(current.id)) return; // human's turn — wait for UI

    const delay = botThinkDelay(this.difficulty);

    if (current.inJail) {
      this.schedule(() => {
        const decision = decideJail(game, current, this.difficulty);
        if (decision === "pay") this.handleJailPay();
        else this.handleJailRoll();
      }, delay);
      return;
    }

    // Roll, then decide buy/skip after the roll resolves.
    this.schedule(() => {
      this.handleRoll();
      this.schedule(() => this.botDecideBuy(current.id), delay);
    }, delay);
  }

  private botDecideBuy(botId: string): void {
    const game = this.game;
    if (!game || game.phase !== GamePhase.Playing) return;
    if (!this.isCurrent(botId)) return; // turn already auto-ended (no buy option)

    const player = getCurrentPlayer(game);
    const tileIndex = player.position;
    const alreadyOwned = game.properties.some((p) => p.tileIndex === tileIndex);
    if (alreadyOwned) return;

    const price = getTilePrice(tileIndex);
    if (price == null) return;

    if (decideBuy(game, player, tileIndex, price, this.difficulty)) {
      this.handleBuy();
    } else {
      this.handleSkip();
    }
  }
}
