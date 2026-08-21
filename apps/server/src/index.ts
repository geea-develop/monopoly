import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  GameState,
  GamePhase,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@monopoly/shared";
import {
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
  LandingResult,
} from "./game.js";
import { initDb, saveGame, loadGame } from "./db.js";

// ─── Setup ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3001");
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

// In-memory game store
const games = new Map<string, GameState>();

// Track socket → player mapping
const socketPlayerMap = new Map<string, { gameId: string; playerId: string }>();

// ─── Rate limiting ──────────────────────────────────────────────────────────

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max actions per window

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(socketId);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(socketId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// ─── Input validation ───────────────────────────────────────────────────────

const MAX_NAME_LENGTH = 20;

function sanitizeName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (trimmed.length === 0) return null;
  // Allow letters, numbers, spaces, hyphens, underscores only
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) return null;
  return trimmed;
}

function isValidGameId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  // 8-character hex string (uuid v4 prefix)
  return /^[0-9a-f]{8}$/i.test(id);
}

// ─── REST endpoint (health) ─────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Socket.IO handlers ─────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // ── Create Game ───────────────────────────────────────────────────────────
  socket.on("game:create", ({ playerName }, callback) => {
    if (isRateLimited(socket.id)) {
      callback({ gameId: "" });
      return;
    }

    const name = sanitizeName(playerName);
    if (!name) {
      callback({ gameId: "" });
      return;
    }

    const game = createGame();
    const player = addPlayer(game, name)!;

    games.set(game.id, game);
    saveGame(game);

    socketPlayerMap.set(socket.id, { gameId: game.id, playerId: player.id });
    socket.join(game.id);

    callback({ gameId: game.id });
    socket.emit("game:state", game);
  });

  // ── Join Game ─────────────────────────────────────────────────────────────
  socket.on("game:join", ({ gameId, playerName }, callback) => {
    if (isRateLimited(socket.id)) {
      callback({ success: false, error: "Too many requests" });
      return;
    }

    if (!isValidGameId(gameId)) {
      callback({ success: false, error: "Invalid game ID" });
      return;
    }

    const name = sanitizeName(playerName);
    if (!name) {
      callback({ success: false, error: "Invalid name (letters, numbers, spaces, max 20 chars)" });
      return;
    }

    const game = games.get(gameId) || loadGame(gameId);
    if (!game) {
      callback({ success: false, error: "Game not found" });
      return;
    }

    if (game.phase !== GamePhase.Lobby) {
      callback({ success: false, error: "Game already in progress" });
      return;
    }

    const player = addPlayer(game, name);
    if (!player) {
      callback({ success: false, error: "Game is full (max 4 players)" });
      return;
    }

    games.set(game.id, game);
    saveGame(game);

    socketPlayerMap.set(socket.id, { gameId: game.id, playerId: player.id });
    socket.join(game.id);

    callback({ success: true });
    io.to(game.id).emit("game:player_joined", player);
    socket.emit("game:state", game);
  });

  // ── Start Game ────────────────────────────────────────────────────────────
  socket.on("game:start", (callback) => {
    const mapping = socketPlayerMap.get(socket.id);
    if (!mapping) { callback({ success: false, error: "Not in a game" }); return; }

    const game = games.get(mapping.gameId);
    if (!game) { callback({ success: false, error: "Game not found" }); return; }

    if (game.players[0].id !== mapping.playerId) {
      callback({ success: false, error: "Only the game creator can start" });
      return;
    }

    if (!startGame(game)) {
      callback({ success: false, error: "Need at least 2 players" });
      return;
    }

    saveGame(game);
    callback({ success: true });
    io.to(game.id).emit("game:started");
    io.to(game.id).emit("game:state", game);
  });

  // ── Roll Dice ─────────────────────────────────────────────────────────────
  socket.on("turn:roll", () => {
    if (isRateLimited(socket.id)) return;

    const ctx = getPlayerContext(socket.id);
    if (!ctx) return;
    const { game, player } = ctx;

    if (getCurrentPlayer(game).id !== player.id) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    if (player.inJail) {
      socket.emit("error", { message: "You are in jail. Pay the fee or try to roll doubles." });
      return;
    }

    const dice = rollDice();
    const moveResult = movePlayer(game, player, dice);

    io.to(game.id).emit("turn:rolled", {
      playerId: player.id,
      dice: moveResult.dice,
      newPosition: moveResult.newPosition,
      passedGo: moveResult.passedGo,
    });

    // Process landing
    const landing = processLanding(game, player);
    emitLandingResult(game, player, landing);

    saveGame(game);
    io.to(game.id).emit("game:state", game);
  });

  // ── Buy Property ──────────────────────────────────────────────────────────
  socket.on("turn:buy", () => {
    const ctx = getPlayerContext(socket.id);
    if (!ctx) return;
    const { game, player } = ctx;

    if (getCurrentPlayer(game).id !== player.id) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    if (buyProperty(game, player)) {
      io.to(game.id).emit("turn:bought", { playerId: player.id, tileIndex: player.position });
      saveGame(game);
      io.to(game.id).emit("game:state", game);
    }
  });

  // ── Skip Buy ──────────────────────────────────────────────────────────────
  socket.on("turn:skip", () => {
    // Nothing to do server-side, player just declines to buy
  });

  // ── End Turn ──────────────────────────────────────────────────────────────
  socket.on("turn:end", () => {
    const ctx = getPlayerContext(socket.id);
    if (!ctx) return;
    const { game, player } = ctx;

    if (getCurrentPlayer(game).id !== player.id) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const result = advanceTurn(game);
    saveGame(game);

    if (result.gameOver) {
      io.to(game.id).emit("game:ended", { winnerId: result.winnerId!, reason: result.reason! });
    } else {
      io.to(game.id).emit("turn:next", { currentPlayerIndex: game.currentPlayerIndex, turn: game.turn });
    }

    io.to(game.id).emit("game:state", game);
  });

  // ── Jail: Pay Fee ─────────────────────────────────────────────────────────
  socket.on("jail:pay", () => {
    const ctx = getPlayerContext(socket.id);
    if (!ctx) return;
    const { game, player } = ctx;

    if (getCurrentPlayer(game).id !== player.id) return;

    if (payJailFee(game, player)) {
      saveGame(game);
      io.to(game.id).emit("game:state", game);
    }
  });

  // ── Jail: Roll Doubles ────────────────────────────────────────────────────
  socket.on("jail:roll", () => {
    const ctx = getPlayerContext(socket.id);
    if (!ctx) return;
    const { game, player } = ctx;

    if (getCurrentPlayer(game).id !== player.id) return;

    const result = jailRoll(game, player);

    io.to(game.id).emit("turn:rolled", {
      playerId: player.id,
      dice: result.dice,
      newPosition: player.position,
      passedGo: false,
    });

    if (result.freed && player.status !== "bankrupt") {
      // Player is free — they can now take a normal turn (move)
      const moveResult = movePlayer(game, player, result.dice);
      io.to(game.id).emit("turn:rolled", {
        playerId: player.id,
        dice: result.dice,
        newPosition: moveResult.newPosition,
        passedGo: moveResult.passedGo,
      });
      const landing = processLanding(game, player);
      emitLandingResult(game, player, landing);
    }

    saveGame(game);
    io.to(game.id).emit("game:state", game);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const mapping = socketPlayerMap.get(socket.id);
    if (mapping) {
      const game = games.get(mapping.gameId);
      if (game) {
        const player = game.players.find((p) => p.id === mapping.playerId);
        if (player) {
          io.to(game.id).emit("game:player_disconnected", {
            playerId: player.id,
            playerName: player.name,
          });
        }
      }
      socketPlayerMap.delete(socket.id);
    }
    rateLimits.delete(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getPlayerContext(socketId: string) {
    const mapping = socketPlayerMap.get(socketId);
    if (!mapping) return null;

    const game = games.get(mapping.gameId);
    if (!game) return null;

    const player = game.players.find((p) => p.id === mapping.playerId);
    if (!player) return null;

    return { game, player };
  }

  function emitLandingResult(game: GameState, player: { id: string }, landing: LandingResult) {
    switch (landing.type) {
      case "buy_option":
        socket.emit("turn:buy_option", { tileIndex: landing.tileIndex!, price: landing.amount! });
        break;
      case "rent":
        io.to(game.id).emit("turn:rent_paid", {
          payerId: player.id,
          ownerId: landing.ownerId!,
          amount: landing.amount!,
          tileIndex: landing.tileIndex!,
        });
        if (landing.bankrupt) {
          io.to(game.id).emit("turn:bankrupt", { playerId: player.id });
        }
        break;
      case "tax":
        io.to(game.id).emit("turn:tax_paid", { playerId: player.id, amount: landing.amount! });
        if (landing.bankrupt) {
          io.to(game.id).emit("turn:bankrupt", { playerId: player.id });
        }
        break;
      case "jail":
        io.to(game.id).emit("turn:jail", { playerId: player.id });
        break;
      case "card":
        io.to(game.id).emit("turn:card", { playerId: player.id, cardText: landing.cardText! });
        break;
    }
  }
});

// ─── Start ──────────────────────────────────────────────────────────────────

initDb();
httpServer.listen(PORT, () => {
  console.log(`Monopoly server running on port ${PORT}`);
});
