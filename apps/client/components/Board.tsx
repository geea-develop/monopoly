"use client";

import { GameState, BOARD, TileType, ColorGroup, PropertyTile } from "@monopoly/shared";

const COLOR_MAP: Record<ColorGroup, string> = {
  [ColorGroup.Brown]: "bg-amber-800",
  [ColorGroup.LightBlue]: "bg-sky-300",
  [ColorGroup.Pink]: "bg-pink-400",
  [ColorGroup.Orange]: "bg-orange-500",
  [ColorGroup.Red]: "bg-red-600",
  [ColorGroup.Yellow]: "bg-yellow-400",
  [ColorGroup.Green]: "bg-green-600",
  [ColorGroup.DarkBlue]: "bg-blue-800",
};

interface BoardProps {
  game: GameState;
  myPlayerId: string | null;
}

export default function Board({ game, myPlayerId }: BoardProps) {
  // Layout: 11 tiles per side. Top: 20-30, Right: 30-40(col), Bottom: 0-10(reversed), Left: 10-20(col reversed)
  const topRow = BOARD.slice(20, 31);
  const rightCol = BOARD.slice(31, 40);
  const bottomRow = BOARD.slice(0, 11).reverse();
  const leftCol = BOARD.slice(11, 20).reverse();

  return (
    <div className="w-full max-w-[700px] mx-auto">
      {/* Top row */}
      <div className="grid grid-cols-11 gap-px">
        {topRow.map((tile) => (
          <TileCell key={tile.index} tile={tile} game={game} />
        ))}
      </div>

      {/* Middle section: left col + center + right col */}
      <div className="grid grid-cols-11 gap-px">
        {/* Left column */}
        <div className="col-span-1 flex flex-col gap-px">
          {leftCol.map((tile) => (
            <TileCell key={tile.index} tile={tile} game={game} />
          ))}
        </div>

        {/* Center area */}
        <div className="col-span-9 flex items-center justify-center bg-gray-800 min-h-[300px] p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">MONOPOLY</h2>
            {game.lastDice && (
              <div className="text-lg mb-2">
                🎲 {game.lastDice[0]} + {game.lastDice[1]} = {game.lastDice[0] + game.lastDice[1]}
              </div>
            )}
            <div className="text-sm text-gray-400">
              Turn {game.turn} / {game.maxTurns}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-1 flex flex-col gap-px">
          {rightCol.map((tile) => (
            <TileCell key={tile.index} tile={tile} game={game} />
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-11 gap-px">
        {bottomRow.map((tile) => (
          <TileCell key={tile.index} tile={tile} game={game} />
        ))}
      </div>
    </div>
  );
}

function TileCell({ tile, game }: { tile: (typeof BOARD)[number]; game: GameState }) {
  const playersHere = game.players.filter((p) => p.position === tile.index && p.status === "active");
  const owned = game.properties.find((p) => p.tileIndex === tile.index);
  const owner = owned ? game.players.find((p) => p.id === owned.ownerId) : null;

  const colorClass =
    tile.type === TileType.Property
      ? COLOR_MAP[(tile as PropertyTile).color]
      : "bg-gray-700";

  return (
    <div
      className={`relative border border-gray-600 p-0.5 min-h-[50px] min-w-[50px] text-[8px] leading-tight flex flex-col justify-between ${colorClass} ${colorClass.includes("yellow") || colorClass.includes("sky") ? "text-gray-900" : "text-white"}`}
      title={tile.name}
    >
      <div className="truncate font-medium">{tile.name.length > 10 ? tile.name.slice(0, 9) + "…" : tile.name}</div>

      {/* Owner indicator */}
      {owner && (
        <div
          className="w-2 h-2 rounded-full border border-white absolute top-0.5 right-0.5"
          style={{ backgroundColor: owner.color }}
          title={`Owned by ${owner.name}`}
        />
      )}

      {/* Players on tile */}
      {playersHere.length > 0 && (
        <div className="flex gap-px mt-auto">
          {playersHere.map((p) => (
            <div
              key={p.id}
              className="w-3 h-3 rounded-full border border-white text-[6px] flex items-center justify-center"
              style={{ backgroundColor: p.color }}
              title={p.name}
            >
              {p.name[0]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
