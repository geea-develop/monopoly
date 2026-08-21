"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { GameState, BOARD } from "@monopoly/shared";
import { SFX } from "@/lib/sounds";

interface WinScreenProps {
  game: GameState;
  myPlayerId: string | null;
  onPlayAgain: () => void;
}

export default function WinScreen({ game, myPlayerId, onPlayAgain }: WinScreenProps) {
  const winner = game.players.find((p) => p.id === game.winner);
  const isMe = winner?.id === myPlayerId;

  useEffect(() => {
    if (isMe) {
      SFX.win();
      // Fire confetti bursts
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#ffd700", "#ff6b00", "#00ff88"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#ffd700", "#ff6b00", "#00ff88"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      SFX.lose();
    }
  }, [isMe]);

  // Stats
  const winnerProperties = game.properties.filter((p) => p.ownerId === winner?.id);
  const sortedPlayers = [...game.players].sort((a, b) => b.balance - a.balance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-yellow-600/50 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl shadow-yellow-900/20">
        {/* Trophy */}
        <div className="text-6xl mb-4 animate-bounce">🏆</div>

        {/* Winner name */}
        <h2 className="text-3xl font-bold text-yellow-300 mb-1">
          {isMe ? "You Win!" : `${winner?.name} Wins!`}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Game finished after {game.turn} turns
        </p>

        {/* Winner stats */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">${winner?.balance.toLocaleString()}</div>
              <div className="text-xs text-gray-500 uppercase">Cash</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{winnerProperties.length}</div>
              <div className="text-xs text-gray-500 uppercase">Properties</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                ${(winner ? winner.balance + winnerProperties.reduce((sum, p) => sum + ((BOARD[p.tileIndex] as any)?.price || 0), 0) : 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 uppercase">Net Worth</div>
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-gray-800 rounded-lg p-3 mb-6">
          <div className="text-xs text-gray-500 uppercase mb-2">Final Standings</div>
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-gray-700/50 last:border-0">
              <span className="text-sm w-5">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
              <span className={`flex-1 text-left text-sm ${p.id === winner?.id ? "text-yellow-300 font-bold" : "text-gray-300"}`}>
                {p.name}
                {p.id === myPlayerId && " (you)"}
              </span>
              <span className="text-sm text-gray-400">${p.balance.toLocaleString()}</span>
              {p.status === "bankrupt" && <span className="text-xs text-red-500">💀</span>}
            </div>
          ))}
        </div>

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          🎲 Play Again
        </button>
      </div>
    </div>
  );
}
