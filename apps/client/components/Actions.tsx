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
      <div className="bg-yellow-900/50 border border-yellow-600 rounded p-4 text-center">
        <div className="text-2xl mb-2">🏆</div>
        <div className="font-bold text-yellow-300">{winner?.name} wins!</div>
        <div className="text-sm text-gray-400 mt-1">Final balance: ${winner?.balance.toLocaleString()}</div>
      </div>
    );
  }

  if (!isMyTurn) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center text-gray-400">
        Waiting for <span className="font-bold text-white">{currentPlayer?.name}</span> to play...
      </div>
    );
  }

  // In jail
  if (myPlayer?.inJail) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded p-4 space-y-2">
        <div className="text-sm text-red-400 font-medium">🔒 You are in Jail!</div>
        <div className="flex gap-2">
          <button
            onClick={() => socket.emit("jail:pay")}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-2 px-3 rounded disabled:opacity-50"
            disabled={myPlayer.balance < 50}
          >
            Pay $50
          </button>
          <button
            onClick={() => {
              socket.emit("jail:roll");
              onRolled();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded"
          >
            Roll Doubles
          </button>
        </div>
        {hasRolled && (
          <button
            onClick={() => socket.emit("turn:end")}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white text-sm py-2 px-3 rounded"
          >
            End Turn
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-4 space-y-2">
      <div className="text-sm text-green-400 font-medium">🎯 Your turn!</div>

      {!hasRolled && (
        <button
          onClick={() => {
            socket.emit("turn:roll");
            onRolled();
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
        >
          🎲 Roll Dice
        </button>
      )}

      {buyOption && (
        <div className="border border-blue-600 bg-blue-900/30 rounded p-2">
          <div className="text-sm mb-2">
            Buy <span className="font-bold">{BOARD[buyOption.tileIndex].name}</span> for ${buyOption.price}?
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { socket.emit("turn:buy"); onClearBuyOption(); }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 px-3 rounded"
            >
              Buy
            </button>
            <button
              onClick={() => { socket.emit("turn:skip"); onClearBuyOption(); }}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm py-1.5 px-3 rounded"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {hasRolled && !buyOption && (
        <button
          onClick={() => socket.emit("turn:end")}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded"
        >
          End Turn
        </button>
      )}
    </div>
  );
}
