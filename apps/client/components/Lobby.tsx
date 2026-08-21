"use client";

import { GameState } from "@monopoly/shared";
import { getSocket } from "@/lib/socket";

interface LobbyProps {
  game: GameState;
  myPlayerId: string | null;
}

export default function Lobby({ game, myPlayerId }: LobbyProps) {
  const socket = getSocket();
  const isCreator = game.players[0]?.id === myPlayerId;

  const handleStart = () => {
    socket.emit("game:start", (response) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <h2 className="text-2xl font-bold">Game Lobby</h2>

      <div className="bg-gray-800 border border-gray-700 rounded p-4">
        <div className="text-sm text-gray-400 mb-2">Share this code to invite players:</div>
        <div className="text-3xl font-mono font-bold text-yellow-400 tracking-wider">
          {game.id}
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(game.id)}
          className="text-xs text-gray-400 hover:text-white mt-2 underline"
        >
          Copy to clipboard
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase">Players ({game.players.length}/4)</h3>
        {game.players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded p-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.name}</span>
            {p.id === myPlayerId && <span className="text-gray-400 text-xs ml-auto">(you)</span>}
          </div>
        ))}
      </div>

      {isCreator && (
        <button
          onClick={handleStart}
          disabled={game.players.length < 2}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded text-lg"
        >
          {game.players.length < 2 ? "Waiting for players..." : "Start Game"}
        </button>
      )}

      {!isCreator && (
        <div className="text-gray-400 text-sm">
          Waiting for the host to start the game...
        </div>
      )}
    </div>
  );
}
