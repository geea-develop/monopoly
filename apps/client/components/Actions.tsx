"use client";

import { GameState, GamePhase, BOARD } from "@monopoly/shared";
import { getSocket } from "@/lib/socket";

interface ActionsProps {
  game: GameState;
  myPlayerId: string | null;
  buyOption: { tileIndex: number; price: number } | null;
  onClearBuyOption: () => void;
  hasRolled: boolean;
  onRolled: () => void;
}

export default function Actions({ game, myPlayerId, buyOption, onClearBuyOption, hasRolled, onRolled }: ActionsProps) {
  const socket = getSocket();
  const currentPlayer = game.players[game.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = game.players.find((p) => p.id === myPlayerId);

  if (game.phase === GamePhase.Finished) {
    const winner = game.players.find((p) => p.id === game.winner);
    return (
      <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 text-center">
        <div className="text-3xl mb-2">🏆</div>
        <div className="font-bold text-yellow-300 text-lg">{winner?.name} wins!</div>
        <div className="text-sm text-gray-400 mt-1">Final balance: ${winner?.balance.toLocaleString()}</div>
      </div>
    );
  }

  if (!isMyTurn) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Current turn</div>
        <div className="font-bold text-white flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentPlayer?.color }} />
          {currentPlayer?.name}
        </div>
        {game.lastDice && (
          <div className="text-sm text-gray-400 mt-2">
            Last roll: {game.lastDice[0]} + {game.lastDice[1]} = {game.lastDice[0] + game.lastDice[1]}
          </div>
        )}
      </div>
    );
  }

  // In jail
  if (myPlayer?.inJail) {
    return (
      <div className="bg-gray-800 border border-red-700/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <span className="text-red-400 font-medium text-sm">You are in Jail!</span>
          <span className="text-gray-500 text-xs ml-auto">Turn {myPlayer.jailTurns}/3</span>
        </div>
        {!hasRolled ? (
          <div className="flex gap-2">
            <button
              onClick={() => socket.emit("jail:pay")}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-40 text-white text-sm py-2.5 px-3 rounded-lg font-medium transition-colors"
              disabled={myPlayer.balance < 50}
              title={myPlayer.balance < 50 ? "Not enough money" : "Pay $50 to get out"}
            >
              💰 Pay $50
            </button>
            <button
              onClick={() => {
                socket.emit("jail:roll");
                onRolled();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 px-3 rounded-lg font-medium transition-colors"
            >
              🎲 Roll Doubles
            </button>
          </div>
        ) : (
          <button
            onClick={() => socket.emit("turn:end")}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white text-sm py-2.5 px-3 rounded-lg font-medium transition-colors"
          >
            End Turn →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-green-700/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <span className="text-green-400 font-medium text-sm">Your turn!</span>
      </div>

      {/* Roll button */}
      {!hasRolled && (
        <button
          onClick={() => {
            socket.emit("turn:roll");
            onRolled();
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors shadow-lg shadow-green-900/30"
        >
          🎲 Roll Dice
        </button>
      )}

      {/* Dice result */}
      {hasRolled && game.lastDice && (
        <div className="text-center text-sm text-gray-400">
          Rolled: <span className="text-white font-bold">{game.lastDice[0]} + {game.lastDice[1]} = {game.lastDice[0] + game.lastDice[1]}</span>
        </div>
      )}

      {/* Buy option */}
      {buyOption && (
        <div className="border border-blue-600/50 bg-blue-950/50 rounded-lg p-3 space-y-2">
          <div className="text-sm text-blue-300 font-medium">
            Buy {BOARD[buyOption.tileIndex].name}?
          </div>
          <div className="text-xs text-gray-400">
            Price: <span className="text-green-400 font-bold">${buyOption.price}</span>
            {myPlayer && <span className="ml-2">(Balance: ${myPlayer.balance.toLocaleString()})</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { socket.emit("turn:buy"); onClearBuyOption(); }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
            >
              ✓ Buy
            </button>
            <button
              onClick={() => { socket.emit("turn:skip"); onClearBuyOption(); }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm py-2 px-3 rounded-lg font-medium transition-colors"
            >
              ✗ Skip
            </button>
          </div>
        </div>
      )}

      {/* End turn */}
      {hasRolled && !buyOption && (
        <button
          onClick={() => socket.emit("turn:end")}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          End Turn →
        </button>
      )}
    </div>
  );
}
