"use client";

import { GameState, BOARD, TileType, PropertyTile, ColorGroup } from "@monopoly/shared";
import { useState } from "react";

const COLOR_DOT: Record<ColorGroup, string> = {
  [ColorGroup.Brown]: "#92400e",
  [ColorGroup.LightBlue]: "#7dd3fc",
  [ColorGroup.Pink]: "#f472b6",
  [ColorGroup.Orange]: "#f97316",
  [ColorGroup.Red]: "#dc2626",
  [ColorGroup.Yellow]: "#facc15",
  [ColorGroup.Green]: "#16a34a",
  [ColorGroup.DarkBlue]: "#1e40af",
};

interface PlayerPanelProps {
  game: GameState;
  myPlayerId: string | null;
}

export default function PlayerPanel({ game, myPlayerId }: PlayerPanelProps) {
  const currentPlayer = game.players[game.currentPlayerIndex];
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-2">
      <h3 className="col-span-2 text-sm font-bold uppercase text-gray-400">Players</h3>
      {game.players.map((player) => {
        const isCurrent = currentPlayer?.id === player.id;
        const isMe = player.id === myPlayerId;
        const isExpanded = expandedPlayer === player.id;

        // Get owned property details
        const ownedProperties = game.properties
          .filter((p) => p.ownerId === player.id)
          .map((p) => ({ ...p, tile: BOARD[p.tileIndex] }));

        return (
          <div
            key={player.id}
            className={`retro-card rounded border transition-colors ${
              isCurrent ? "border-yellow-400 bg-gray-800" : "border-gray-700 bg-gray-900"
            } ${player.status === "bankrupt" ? "opacity-40" : ""}`}
          >
            {/* Player header */}
            <div
              className="p-2 cursor-pointer"
              onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-white flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                />
                <span className="font-medium text-sm">
                  {player.name}
                  {isMe && <span className="text-gray-400 ml-1">(you)</span>}
                </span>
                {isCurrent && <span className="text-yellow-400 text-xs ml-auto">▶</span>}
              </div>
              <div className="mt-1 text-xs text-gray-400 flex justify-between">
                <span className="text-green-400 font-medium">${player.balance.toLocaleString()}</span>
                <span>{ownedProperties.length} properties {ownedProperties.length > 0 ? (isExpanded ? "▴" : "▾") : ""}</span>
              </div>
              {player.inJail && (
                <div className="text-xs text-red-400 mt-0.5">🔒 In Jail ({player.jailTurns}/3)</div>
              )}
              {player.status === "bankrupt" && (
                <div className="text-xs text-red-500 mt-0.5">💀 Bankrupt</div>
              )}
            </div>

            {/* Expanded property list */}
            {isExpanded && ownedProperties.length > 0 && (
              <div className="border-t border-gray-700 px-2 py-1.5 space-y-1">
                {ownedProperties.map(({ tile, tileIndex }) => {
                  const isProperty = tile.type === TileType.Property;
                  const color = isProperty ? (tile as PropertyTile).color : null;
                  const rent = isProperty
                    ? (tile as PropertyTile).rent[game.properties.find((p) => p.tileIndex === tileIndex)?.houses ?? 0]
                    : null;

                  return (
                    <div key={tileIndex} className="flex items-center gap-1.5 text-xs">
                      {color ? (
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLOR_DOT[color] }} />
                      ) : (
                        <span className="text-[10px] w-2.5 text-center flex-shrink-0">
                          {tile.type === TileType.Railroad ? "🚂" : "💡"}
                        </span>
                      )}
                      <span className="text-gray-300 truncate flex-1">{tile.name}</span>
                      {rent !== null && (
                        <span className="text-yellow-400 flex-shrink-0">${rent}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
