"use client";

import { GameState, BOARD } from "@monopoly/shared";

interface PlayerPanelProps {
  game: GameState;
  myPlayerId: string | null;
}

export default function PlayerPanel({ game, myPlayerId }: PlayerPanelProps) {
  const currentPlayer = game.players[game.currentPlayerIndex];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-400 uppercase">Players</h3>
      {game.players.map((player) => {
        const isCurrent = currentPlayer?.id === player.id;
        const isMe = player.id === myPlayerId;
        return (
          <div
            key={player.id}
            className={`p-2 rounded border ${
              isCurrent ? "border-yellow-400 bg-gray-800" : "border-gray-700 bg-gray-900"
            } ${player.status === "bankrupt" ? "opacity-40" : ""}`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-white"
                style={{ backgroundColor: player.color }}
              />
              <span className="font-medium text-sm">
                {player.name}
                {isMe && <span className="text-gray-400 ml-1">(you)</span>}
              </span>
              {isCurrent && <span className="text-yellow-400 text-xs ml-auto">▶ Turn</span>}
            </div>
            <div className="mt-1 text-xs text-gray-400 flex justify-between">
              <span>${player.balance.toLocaleString()}</span>
              <span>{player.properties.length} properties</span>
            </div>
            {player.inJail && (
              <div className="text-xs text-red-400 mt-0.5">🔒 In Jail ({player.jailTurns}/3)</div>
            )}
            {player.status === "bankrupt" && (
              <div className="text-xs text-red-500 mt-0.5">💀 Bankrupt</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
