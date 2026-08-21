"use client";

import { useEffect, useState, useCallback } from "react";
import { GameState, GamePhase } from "@monopoly/shared";
import { getSocket } from "@/lib/socket";
import Board from "@/components/Board";
import PlayerPanel from "@/components/PlayerPanel";
import GameLog from "@/components/GameLog";
import Actions from "@/components/Actions";
import Lobby from "@/components/Lobby";

type Screen = "home" | "lobby" | "game";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [game, setGame] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [buyOption, setBuyOption] = useState<{ tileIndex: number; price: number } | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = getSocket();

    socket.on("game:state", (state) => {
      setGame(state);
      if (state.phase === GamePhase.Lobby) {
        setScreen("lobby");
      } else if (state.phase === GamePhase.Playing || state.phase === GamePhase.Finished) {
        setScreen("game");
      }
    });

    socket.on("game:started", () => {
      setScreen("game");
      setHasRolled(false);
    });

    socket.on("turn:buy_option", (data) => {
      setBuyOption(data);
    });

    socket.on("turn:next", () => {
      setHasRolled(false);
      setBuyOption(null);
    });

    socket.on("error", (data) => {
      setError(data.message);
      setTimeout(() => setError(""), 3000);
    });

    return () => {
      socket.off("game:state");
      socket.off("game:started");
      socket.off("turn:buy_option");
      socket.off("turn:next");
      socket.off("error");
    };
  }, []);

  const handleCreate = useCallback(() => {
    if (!playerName.trim()) return;
    const socket = getSocket();
    socket.emit("game:create", { playerName: playerName.trim() }, (response) => {
      // myPlayerId will be set from game:state event
      setGame((prev) => {
        if (prev) setMyPlayerId(prev.players[prev.players.length - 1]?.id ?? null);
        return prev;
      });
    });
  }, [playerName]);

  const handleJoin = useCallback(() => {
    if (!playerName.trim() || !gameCode.trim()) return;
    const socket = getSocket();
    socket.emit("game:join", { gameId: gameCode.trim(), playerName: playerName.trim() }, (response) => {
      if (!response.success) {
        setError(response.error || "Failed to join");
      }
    });
  }, [playerName, gameCode]);

  // Derive myPlayerId from game state once we have it
  useEffect(() => {
    if (game && !myPlayerId) {
      // The last player that joined is us
      const lastPlayer = game.players[game.players.length - 1];
      if (lastPlayer) setMyPlayerId(lastPlayer.id);
    }
  }, [game, myPlayerId]);

  // ─── Home Screen ────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6">
          <h1 className="text-4xl font-bold text-center">🎩 Monopoly</h1>
          <p className="text-center text-gray-400">Multiplayer board game — up to 4 players</p>

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

          <button
            onClick={handleCreate}
            disabled={!playerName.trim()}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded text-lg"
          >
            Create New Game
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
              disabled={!playerName.trim() || !gameCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded"
            >
              Join
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!game) return null;

  // ─── Lobby Screen ───────────────────────────────────────────────────────────
  if (screen === "lobby") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Lobby game={game} myPlayerId={myPlayerId} />
      </main>
    );
  }

  // ─── Game Screen ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen p-2 lg:p-4">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-600 rounded px-4 py-2 text-sm text-red-300 z-50">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 max-w-[1200px] mx-auto">
        {/* Board */}
        <div className="flex-1">
          <Board game={game} myPlayerId={myPlayerId} />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4">
          <Actions
            game={game}
            myPlayerId={myPlayerId}
            buyOption={buyOption}
            onClearBuyOption={() => setBuyOption(null)}
            hasRolled={hasRolled}
            onRolled={() => setHasRolled(true)}
          />
          <PlayerPanel game={game} myPlayerId={myPlayerId} />
          <GameLog game={game} />
        </div>
      </div>
    </main>
  );
}
