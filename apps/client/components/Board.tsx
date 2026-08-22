"use client";

import { GameState, BOARD, TileType, ColorGroup, PropertyTile, RailroadTile, UtilityTile, TaxTile } from "@monopoly/shared";
import { useState, useEffect, useRef } from "react";

const COLOR_HEX: Record<ColorGroup, string> = {
  [ColorGroup.Brown]: "#92400e",
  [ColorGroup.LightBlue]: "#7dd3fc",
  [ColorGroup.Pink]: "#f472b6",
  [ColorGroup.Orange]: "#f97316",
  [ColorGroup.Red]: "#dc2626",
  [ColorGroup.Yellow]: "#facc15",
  [ColorGroup.Green]: "#16a34a",
  [ColorGroup.DarkBlue]: "#1e40af",
};

const TILE_ICONS: Partial<Record<TileType, string>> = {
  [TileType.Go]: "→",
  [TileType.Chance]: "?",
  [TileType.CommunityChest]: "🃏",
  [TileType.Jail]: "🔒",
  [TileType.FreeParking]: "🅿️",
  [TileType.GoToJail]: "👮",
  [TileType.Tax]: "💰",
  [TileType.Railroad]: "🚂",
  [TileType.Utility]: "💡",
};

interface BoardProps {
  game: GameState;
  myPlayerId: string | null;
  diceRolling?: boolean;
}

export default function Board({ game, myPlayerId, diceRolling }: BoardProps) {
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [landedTile, setLandedTile] = useState<number | null>(null);
  const [animatingPlayer, setAnimatingPlayer] = useState<string | null>(null);
  const [animPosition, setAnimPosition] = useState<number | null>(null);
  const prevPositions = useRef<Record<string, number>>({});
  const animating = useRef(false);

  // Track position changes and animate step by step
  useEffect(() => {
    for (const player of game.players) {
      const prev = prevPositions.current[player.id];
      if (prev !== undefined && prev !== player.position && !animating.current) {
        animating.current = true;
        // Calculate steps from prev to new position (wrapping around 40)
        const steps: number[] = [];
        let pos = prev;
        while (pos !== player.position) {
          pos = (pos + 1) % 40;
          steps.push(pos);
        }

        setAnimatingPlayer(player.id);

        // Animate through each tile
        const STEP_DELAY = 120; // ms per tile
        steps.forEach((stepPos, i) => {
          setTimeout(() => {
            setAnimPosition(stepPos);
            setLandedTile(stepPos);
          }, i * STEP_DELAY);
        });

        // Clean up after animation completes
        setTimeout(() => {
          setAnimatingPlayer(null);
          setAnimPosition(null);
          setLandedTile(null);
          animating.current = false;
        }, steps.length * STEP_DELAY + 300);
      }
      prevPositions.current[player.id] = player.position;
    }
  }, [game.players]);

  const currentPlayer = game.players[game.currentPlayerIndex];
  const currentTile = currentPlayer?.position ?? -1;
  const currentColor = currentPlayer?.color;

  // Board layout: 11x11 grid, tiles around the border
  // Bottom row: indices 0-10 (right to left)
  // Left col: indices 11-19 (bottom to top)
  // Top row: indices 20-30 (left to right)
  // Right col: indices 31-39 (top to bottom)

  return (
    <div className="w-full max-w-[660px] mx-auto select-none">
      {/* Top row: 20 (left corner) to 30 (right corner) */}
      <div className="grid grid-cols-11">
        {BOARD.slice(20, 31).map((tile) => (
          <TileCell
            key={tile.index}
            tile={tile}
            game={game}
            side="top"
            isHovered={hoveredTile === tile.index}
            onHover={setHoveredTile}
            isLanded={landedTile === tile.index}
            animatingPlayer={animatingPlayer}
            animPosition={animPosition}
            isCurrentPlayerTile={currentTile === tile.index}
            currentPlayerColor={currentColor}
          />
        ))}
      </div>

      {/* Middle: left col + center + right col */}
      <div className="grid grid-cols-11">
        {/* Left column (19 down to 11) */}
        <div className="col-span-1">
          {BOARD.slice(11, 20).reverse().map((tile) => (
            <TileCell
              key={tile.index}
              tile={tile}
              game={game}
              side="left"
              isHovered={hoveredTile === tile.index}
              onHover={setHoveredTile}
              isLanded={landedTile === tile.index}
              animatingPlayer={animatingPlayer}
              animPosition={animPosition}
              isCurrentPlayerTile={currentTile === tile.index}
              currentPlayerColor={currentColor}
            />
          ))}
        </div>

        {/* Center */}
        <div className="board-center relative col-span-9 flex min-h-[104px] flex-col items-center justify-center border border-emerald-700/60 p-2 sm:min-h-[360px] sm:p-4">
          <h2 className="mb-1 text-lg font-bold tracking-wide text-emerald-300 sm:mb-4 sm:text-3xl">MONOPOLY</h2>

          {/* Dice display */}
          {(game.lastDice || diceRolling) && (
            <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
              {diceRolling ? (
                <>
                  <Die value={null} rolling />
                  <Die value={null} rolling />
                </>
              ) : (
                <>
                  <Die value={game.lastDice![0]} />
                  <Die value={game.lastDice![1]} />
                </>
              )}
            </div>
          )}

          {/* Turn info */}
          <div className="text-xs text-gray-400 sm:text-sm">
            Turn {game.turn} / {game.maxTurns}
          </div>

          {/* Current player indicator */}
          <div className="mt-2 text-xs sm:mt-3 sm:text-sm">
            <span className="text-gray-500">Playing: </span>
            <span className="font-bold" style={{ color: game.players[game.currentPlayerIndex]?.color }}>
              {game.players[game.currentPlayerIndex]?.name}
            </span>
          </div>

          {/* Hover tooltip */}
          {hoveredTile !== null && (
            <TileTooltip tileIndex={hoveredTile} game={game} />
          )}
        </div>

        {/* Right column (31 down to 39) */}
        <div className="col-span-1">
          {BOARD.slice(31, 40).map((tile) => (
            <TileCell
              key={tile.index}
              tile={tile}
              game={game}
              side="right"
              isHovered={hoveredTile === tile.index}
              onHover={setHoveredTile}
              isLanded={landedTile === tile.index}
              animatingPlayer={animatingPlayer}
              animPosition={animPosition}
              isCurrentPlayerTile={currentTile === tile.index}
              currentPlayerColor={currentColor}
            />
          ))}
        </div>
      </div>

      {/* Bottom row: 10 (left corner) to 0 (right corner) — rendered left to right */}
      <div className="grid grid-cols-11">
        {BOARD.slice(0, 11).reverse().map((tile) => (
          <TileCell
            key={tile.index}
            tile={tile}
            game={game}
            side="bottom"
            isHovered={hoveredTile === tile.index}
            onHover={setHoveredTile}
            isLanded={landedTile === tile.index}
            animatingPlayer={animatingPlayer}
            animPosition={animPosition}
            isCurrentPlayerTile={currentTile === tile.index}
            currentPlayerColor={currentColor}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Dice Component ─────────────────────────────────────────────────────────

function Die({ value, rolling }: { value: number | null; rolling?: boolean }) {
  return (
    <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-900 font-bold text-xl shadow-md ${rolling ? "animate-dice-roll" : "animate-dice-settle"}`}>
      {rolling ? "?" : value}
    </div>
  );
}

// ─── Tile Tooltip ───────────────────────────────────────────────────────────

function TileTooltip({ tileIndex, game }: { tileIndex: number; game: GameState }) {
  const tile = BOARD[tileIndex];
  const owned = game.properties.find((p) => p.tileIndex === tileIndex);
  const owner = owned ? game.players.find((p) => p.id === owned.ownerId) : null;

  return (
    <div className="absolute bottom-2 left-1/2 z-10 w-[calc(100vw-32px)] max-w-[260px] -translate-x-1/2 rounded-lg border border-gray-600 bg-gray-900 p-3 text-sm shadow-lg sm:bottom-4 sm:min-w-[200px]">
      <div className="font-bold text-white mb-1">{tile.name}</div>

      {tile.type === TileType.Property && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_HEX[(tile as PropertyTile).color] }} />
            <span className="text-gray-400 text-xs">{(tile as PropertyTile).color}</span>
          </div>
          <div className="text-gray-300">Price: <span className="text-green-400">${(tile as PropertyTile).price}</span></div>
          <div className="text-gray-300">Rent: <span className="text-yellow-400">${(tile as PropertyTile).rent[owned?.houses ?? 0]}</span></div>
        </div>
      )}

      {tile.type === TileType.Railroad && (
        <div className="text-gray-300">Price: <span className="text-green-400">${(tile as RailroadTile).price}</span></div>
      )}

      {tile.type === TileType.Utility && (
        <div className="text-gray-300">Price: <span className="text-green-400">${(tile as UtilityTile).price}</span></div>
      )}

      {tile.type === TileType.Tax && (
        <div className="text-gray-300">Tax: <span className="text-red-400">${(tile as TaxTile).price}</span></div>
      )}

      {owner && (
        <div className="mt-1 pt-1 border-t border-gray-700 text-xs">
          Owned by <span className="font-bold" style={{ color: owner.color }}>{owner.name}</span>
        </div>
      )}
    </div>
  );
}

// ─── Tile Cell ──────────────────────────────────────────────────────────────

interface TileCellProps {
  tile: (typeof BOARD)[number];
  game: GameState;
  side: "top" | "bottom" | "left" | "right";
  isHovered: boolean;
  onHover: (index: number | null) => void;
  isLanded?: boolean;
  animatingPlayer?: string | null;
  animPosition?: number | null;
  isCurrentPlayerTile?: boolean;
  currentPlayerColor?: string;
}

function TileCell({ tile, game, side, isHovered, onHover, isLanded, animatingPlayer, animPosition, isCurrentPlayerTile, currentPlayerColor }: TileCellProps) {
  // During animation, show the animating player at animPosition instead of their real position
  const playersHere = game.players.filter((p) => {
    if (p.status !== "active") return false;
    if (p.id === animatingPlayer) {
      // Show at anim position during animation
      return animPosition === tile.index;
    }
    return p.position === tile.index;
  });
  const owned = game.properties.find((p) => p.tileIndex === tile.index);
  const owner = owned ? game.players.find((p) => p.id === owned.ownerId) : null;

  const isCorner = [0, 10, 20, 30].includes(tile.index);
  const isProperty = tile.type === TileType.Property;
  const colorHex = isProperty ? COLOR_HEX[(tile as PropertyTile).color] : undefined;

  // Abbreviate tile names for display
  const displayName = getShortName(tile.name, isCorner);

  return (
    <div
      className={`
        relative border border-gray-700/50 flex flex-col
        ${isCorner ? "aspect-square" : side === "top" || side === "bottom" ? "aspect-[3/4]" : "aspect-[4/3]"}
        ${isHovered ? "ring-2 ring-yellow-400 z-20" : ""}
        ${isLanded ? "ring-2 ring-white/70 z-10" : ""}
        bg-gray-850 hover:bg-gray-750 transition-colors cursor-pointer
      `}
      style={{ backgroundColor: isHovered ? "#1f2937" : isLanded ? "#2d4a2d" : "#111827" }}
      onMouseEnter={() => onHover(tile.index)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Color band for properties */}
      {colorHex && (
        <div
          className={`absolute ${
            side === "bottom" ? "top-0 left-0 right-0 h-[6px]" :
            side === "top" ? "bottom-0 left-0 right-0 h-[6px]" :
            side === "left" ? "top-0 bottom-0 right-0 w-[6px]" :
            "top-0 bottom-0 left-0 w-[6px]"
          }`}
          style={{ backgroundColor: colorHex }}
        />
      )}

      {/* Owner border indicator */}
      {owner && (
        <div
          className="absolute inset-0 border-2 rounded-sm pointer-events-none opacity-60"
          style={{ borderColor: owner.color }}
        />
      )}

      {/* Tile content */}
      <div className="flex-1 flex flex-col items-center justify-center p-0.5 overflow-hidden">
        {/* Icon or name */}
        {TILE_ICONS[tile.type] && !isProperty ? (
          <span className="text-[10px] leading-none">{TILE_ICONS[tile.type]}</span>
        ) : null}
        <span className="mt-0.5 line-clamp-2 text-center text-[7px] font-medium leading-[0.9] text-gray-200 sm:text-[7px]">
          {displayName}
        </span>
        {/* Price for buyable tiles */}
        {(tile.type === TileType.Property || tile.type === TileType.Railroad || tile.type === TileType.Utility) && !owned && (
          <span className="mt-0.5 text-[7px] text-green-500 sm:text-[6px]">${(tile as PropertyTile | RailroadTile | UtilityTile).price}</span>
        )}
      </div>

      {/* Current player position indicator */}
      {isCurrentPlayerTile && !isLanded && (
        <div className="absolute top-0 right-0 animate-pulse">
          <div
            className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px]"
            style={{ borderTopColor: currentPlayerColor || "#fff" }}
          />
        </div>
      )}

      {/* Players on tile */}
      {playersHere.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-wrap gap-0.5 justify-center items-center">
            {playersHere.map((p) => (
              <div
                key={p.id}
                className={`h-3 w-3 rounded-full border border-white shadow-lg sm:h-4 sm:w-4 sm:border-2 ${isLanded ? "animate-player-land" : ""}`}
                style={{
                  backgroundColor: p.color,
                  boxShadow: `0 0 6px ${p.color}, 0 0 2px rgba(255,255,255,0.8)`,
                }}
                title={p.name}
              >
                <span className="flex h-full w-full items-center justify-center text-[6px] font-bold text-white drop-shadow sm:text-[8px]">
                  {p.name[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getShortName(name: string, isCorner: boolean): string {
  if (isCorner) return name.split("/")[0].trim();

  const compactNames: Record<string, string> = {
    "Kentucky Avenue": "Ky. Ave",
    "Indiana Avenue": "Ind. Ave",
    "Illinois Avenue": "Ill. Ave",
    "Atlantic Avenue": "Atl. Ave",
    "Ventnor Avenue": "Vent. Ave",
    "Marvin Gardens": "Marvin Gdns",
    "Pacific Avenue": "Pac. Ave",
    "North Carolina Avenue": "N. Carolina",
    "Pennsylvania Avenue": "Penn. Ave",
    "Park Place": "Park Pl",
    "Connecticut Avenue": "Conn. Ave",
    "Vermont Avenue": "Vt. Ave",
    "Virginia Avenue": "Va. Ave",
    "States Avenue": "States Ave",
    "St. James Place": "St. James",
    "Tennessee Avenue": "Tenn. Ave",
    "New York Avenue": "N.Y. Ave",
    "Mediterranean Avenue": "Med. Ave",
    "Oriental Avenue": "Oriental Ave",
    "Baltic Avenue": "Baltic Ave",
    "Reading Railroad": "Reading RR",
    "Pennsylvania Railroad": "Penn. RR",
    "B&O Railroad": "B&O RR",
    "Short Line Railroad": "Short Line RR",
  };
  if (compactNames[name]) return compactNames[name];

  // Abbreviate common words
  return name
    .replace("Avenue", "Ave")
    .replace("Place", "Pl")
    .replace("Railroad", "RR")
    .replace("Community Chest", "Chest")
    .replace("Electric Company", "Electric")
    .replace("Water Works", "Water")
    .replace("Mediterranean", "Medit.")
    .replace("Connecticut", "Conn.")
    .replace("Pennsylvania", "Penn.")
    .replace("North Carolina", "N. Carolina")
    .replace("Free Parking", "Free\nParking")
    .replace("Go To Jail", "Go To\nJail");
}
