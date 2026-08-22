"use client";

import { GameState } from "@monopoly/shared";
import { useEffect, useRef } from "react";

interface GameLogProps {
  game: GameState;
}

export default function GameLog({ game }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [game.log.length]);

  return (
    <div className="h-40 overflow-y-auto rounded border border-gray-700 bg-gray-900 p-2 text-xs sm:h-48">
      <h3 className="text-sm font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-gray-900">Game Log</h3>
      {game.log.slice(-30).map((entry, i) => (
        <div key={i} className="text-gray-300 py-0.5 border-b border-gray-800">
          <span className="text-gray-500 mr-1">[T{entry.turn}]</span>
          {entry.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
