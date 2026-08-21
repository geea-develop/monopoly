"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GameState, GamePhase, BOARD } from "@monopoly/shared";
import { getSocket, emitWithTimeout, ConnectionStatus } from "@/lib/socket";
import Board from "@/components/Board";
import PlayerPanel from "@/components/PlayerPanel";
import GameLog from "@/components/GameLog";
import Actions from "@/components/Actions";
import Lobby from "@/components/Lobby";
import ToastContainer, { showToast } from "@/components/Toast";

type Screen = "home" | "lobby" | "game";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [game, setGame] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [buyOption, setBuyOption] = useState<{ tileIndex: number; price: number } | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [hasInvite, setHasInvite] = useState(false);
  const gameRef = useRef<GameState | null>(null);
  gameRef.current = game;

  // Read game code from URL and restore session on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get("game");
    if (gameParam) {
      setGameCode(gameParam);
      setHasInvite(true);
    }

    // Restore playerId from sessionStorage immediately (before socket events)
    const stored = sessionStorage.getItem("monopoly_session");
    if (stored) {
      try {
        const { playerId } = JSON.parse(stored);
        if (playerId) setMyPlayerId(playerId);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => setConnectionStatus("disconnected"));

    socket.on("game:state", (state) => {
      setGame(state);
      // Stop dice animation after state update (with small delay so animation feels complete)
      setTimeout(() => setDiceRolling(false), 1000);
      if (state.phase === GamePhase.Lobby) {
        setScreen("lobby");
      } else if (state.phase === GamePhase.Playing || state.phase === GamePhase.Finished) {
        setScreen("game");
      }
    });

    socket.on("game:player_joined", (player) => {
      setGame((prev) => {
        if (!prev) return prev;
        if (prev.players.some((p) => p.id === player.id)) return prev;
        return { ...prev, players: [...prev.players, player] };
      });
    });

    socket.on("game:started", () => {
      setScreen("game");
      setHasRolled(false);
    });

    socket.on("turn:buy_option", (data) => {
      // Delay showing buy option until dice animation finishes
      setTimeout(() => setBuyOption(data), 1200);
    });

    socket.on("turn:next", () => {
      setHasRolled(false);
      setDiceRolling(false);
      setBuyOption(null);
    });

    socket.on("error", (data) => {
      setError(data.message);
      setTimeout(() => setError(""), 3000);
    });

    // ── Toast notifications for game events ──
    socket.on("turn:rent_paid", (data) => {
      const payer = gameRef.current?.players.find((p) => p.id === data.payerId);
      const owner = gameRef.current?.players.find((p) => p.id === data.ownerId);
      showToast(`${payer?.name ?? "?"} paid $${data.amount} rent to ${owner?.name ?? "?"}`, "money");
    });

    socket.on("turn:bought", (data) => {
      const buyer = gameRef.current?.players.find((p) => p.id === data.playerId);
      const tileName = BOARD[data.tileIndex]?.name ?? "property";
      showToast(`${buyer?.name ?? "?"} bought ${tileName}`, "success");
    });

    socket.on("turn:tax_paid", (data) => {
      const player = gameRef.current?.players.find((p) => p.id === data.playerId);
      showToast(`${player?.name ?? "?"} paid $${data.amount} tax`, "danger");
    });

    socket.on("turn:jail", (data) => {
      const player = gameRef.current?.players.find((p) => p.id === data.playerId);
      showToast(`${player?.name ?? "?"} was sent to Jail! 🔒`, "danger");
    });

    socket.on("turn:card", (data) => {
      showToast(`🃏 ${data.cardText}`, "info", 4000);
    });

    socket.on("turn:bankrupt", (data) => {
      const player = gameRef.current?.players.find((p) => p.id === data.playerId);
      showToast(`💀 ${player?.name ?? "?"} went bankrupt!`, "danger", 5000);
    });

    socket.on("turn:rolled", (data) => {
      const player = gameRef.current?.players.find((p) => p.id === data.playerId);
      if (data.passedGo) {
        showToast(`${player?.name ?? "?"} passed Go — collected $200`, "money");
      }
    });

    if (socket.connected) {
      setConnectionStatus("connected");
    }

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("game:state");
      socket.off("game:player_joined");
      socket.off("game:started");
      socket.off("turn:buy_option");
      socket.off("turn:next");
      socket.off("error");
      socket.off("turn:rent_paid");
      socket.off("turn:bought");
      socket.off("turn:tax_paid");
      socket.off("turn:jail");
      socket.off("turn:card");
      socket.off("turn:bankrupt");
      socket.off("turn:rolled");
    };
  }, []);

  // Auto-rejoin from sessionStorage on connect
  useEffect(() => {
    const socket = getSocket();

    const attemptRejoin = () => {
      const stored = sessionStorage.getItem("monopoly_session");
      if (!stored) return;

      try {
        const { gameId, playerId } = JSON.parse(stored);
        if (!gameId || !playerId) return;

        socket.emit("game:rejoin", { gameId, playerId }, (response) => {
          if (response.success) {
            setMyPlayerId(playerId);
            const url = new URL(window.location.href);
            url.searchParams.set("game", gameId);
            window.history.replaceState({}, "", url.toString());
          } else {
            // Session is stale, clear it
            sessionStorage.removeItem("monopoly_session");
          }
        });
      } catch {
        sessionStorage.removeItem("monopoly_session");
      }
    };

    if (socket.connected) {
      attemptRejoin();
    } else {
      socket.once("connect", attemptRejoin);
    }

    return () => {
      socket.off("connect", attemptRejoin);
    };
  }, []);

  const handleCreate = useCallback(async () => {
    if (!playerName.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await emitWithTimeout<{ gameId: string; playerId: string }>(
        "game:create",
        { playerName: playerName.trim() }
      );
      if (response.gameId && response.playerId) {
        setMyPlayerId(response.playerId);
        sessionStorage.setItem("monopoly_session", JSON.stringify({ gameId: response.gameId, playerId: response.playerId }));
        const url = new URL(window.location.href);
        url.searchParams.set("game", response.gameId);
        window.history.replaceState({}, "", url.toString());
      } else {
        setError("Failed to create game — invalid name or server error");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create game");
    } finally {
      setIsLoading(false);
    }
  }, [playerName]);

  const handleJoin = useCallback(async () => {
    if (!playerName.trim() || !gameCode.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await emitWithTimeout<{ success?: boolean; playerId?: string; error?: string }>(
        "game:join",
        { gameId: gameCode.trim(), playerName: playerName.trim() }
      );
      if (response && response.success && response.playerId) {
        setMyPlayerId(response.playerId);
        sessionStorage.setItem("monopoly_session", JSON.stringify({ gameId: gameCode.trim(), playerId: response.playerId }));
      } else if (response && !response.success) {
        setError(response.error || "Failed to join");
      }
    } catch (err: any) {
      setError(err.message || "Failed to join game");
    } finally {
      setIsLoading(false);
    }
  }, [playerName, gameCode]);

  const handleLeaveGame = useCallback(() => {
    sessionStorage.removeItem("monopoly_session");
    setGame(null);
    setMyPlayerId(null);
    setScreen("home");
    setShowLeaveConfirm(false);
    setBuyOption(null);
    setHasRolled(false);
    setGameCode("");
    setHasInvite(false);
    // Remove ?game from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("game");
    window.history.replaceState({}, "", url.toString());
    // Disconnect and reconnect to leave the socket room
    const socket = getSocket();
    socket.disconnect();
    socket.connect();
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("monopoly_session");
    setPlayerName("");
    setMyPlayerId(null);
    setGame(null);
    setScreen("home");
    setGameCode("");
    setHasInvite(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("game");
    window.history.replaceState({}, "", url.toString());
  }, []);

  // ─── Leave Confirmation Dialog ──────────────────────────────────────────────
  const LeaveConfirmDialog = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm w-full space-y-4">
        <h3 className="text-lg font-bold text-white">Leave Game?</h3>
        <p className="text-gray-400 text-sm">
          Are you sure you want to leave? You won&apos;t be able to rejoin this game.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLeaveConfirm(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleLeaveGame}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Home Screen ────────────────────────────────────────────────────────────
  if (screen === "home") {
    const isDisconnected = connectionStatus !== "connected";
    const buttonsDisabled = isDisconnected || isLoading;

    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6">
          <h1 className="text-4xl font-bold text-center">🎩 Monopoly</h1>
          <p className="text-center text-gray-400">Multiplayer board game — up to 4 players</p>

          {/* Connection status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className={
              connectionStatus === "connected"
                ? "text-green-400"
                : connectionStatus === "connecting"
                ? "text-yellow-400"
                : "text-red-400"
            }>
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting to server…"
                : "Disconnected — retrying…"}
            </span>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 rounded p-2 text-sm text-red-300 text-center">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            maxLength={20}
          />

          {/* Invite link flow: Join is primary */}
          {hasInvite ? (
            <>
              <button
                onClick={handleJoin}
                disabled={!playerName.trim() || !gameCode.trim() || buttonsDisabled}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded text-lg"
              >
                {isLoading ? "Joining…" : `Join Game ${gameCode}`}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-900 px-2 text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!playerName.trim() || buttonsDisabled}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-300 font-medium py-2 px-6 rounded text-sm"
              >
                Create New Game Instead
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCreate}
                disabled={!playerName.trim() || buttonsDisabled}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded text-lg"
              >
                {isLoading ? "Creating…" : "Create New Game"}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-900 px-2 text-gray-500">or join existing</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Game code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 font-mono"
                  maxLength={8}
                />
                <button
                  onClick={handleJoin}
                  disabled={!playerName.trim() || !gameCode.trim() || buttonsDisabled}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded"
                >
                  {isLoading ? "…" : "Join"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  if (!game) return null;

  // ─── Lobby Screen ───────────────────────────────────────────────────────────
  if (screen === "lobby") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        {showLeaveConfirm && <LeaveConfirmDialog />}
        <div className="space-y-4">
          <Lobby game={game} myPlayerId={myPlayerId} />
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full text-gray-500 hover:text-red-400 text-sm underline"
          >
            Leave Game
          </button>
        </div>
      </main>
    );
  }

  // ─── Game Screen ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen p-2 lg:p-4">
      {showLeaveConfirm && <LeaveConfirmDialog />}
      <ToastContainer />

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-600 rounded px-4 py-2 text-sm text-red-300 z-50">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 max-w-[1200px] mx-auto">
        {/* Board */}
        <div className="flex-1">
          <Board game={game} myPlayerId={myPlayerId} diceRolling={diceRolling} />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4">
          <Actions
            game={game}
            myPlayerId={myPlayerId}
            buyOption={buyOption}
            onClearBuyOption={() => setBuyOption(null)}
            hasRolled={hasRolled}
            onRolled={() => { setHasRolled(true); setDiceRolling(true); }}
          />
          <PlayerPanel game={game} myPlayerId={myPlayerId} />
          <GameLog game={game} />
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full text-gray-500 hover:text-red-400 text-xs underline"
          >
            Leave Game
          </button>
        </div>
      </div>
    </main>
  );
}
