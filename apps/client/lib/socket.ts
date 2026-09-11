"use client";

import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents, Difficulty } from "@monopoly/shared";
import { LocalGameSocket } from "./local-game";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;
let localSocket: LocalGameSocket | null = null;
let offline = false;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

/**
 * Enter offline single-player mode: creates a local game (1 human + N bots)
 * that runs entirely in the browser with no network. Subsequent getSocket()
 * calls return the local adapter. Returns the created game/player ids.
 */
export function startOfflineGame(
  humanName: string,
  botCount: number,
  difficulty: Difficulty
): { gameId: string; playerId: string } {
  offline = true;
  // Tear down any real socket so no network activity continues.
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  localSocket = new LocalGameSocket();
  return localSocket.createOfflineGame(humanName, botCount, difficulty);
}

/** True if there is a persisted offline game to resume. */
export function hasOfflineSave(): boolean {
  return LocalGameSocket.loadSave() !== null;
}

/** Resume a persisted offline game; makes getSocket() return the local adapter. */
export function resumeOfflineGame(): void {
  offline = true;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (!localSocket) localSocket = new LocalGameSocket();
}

/** Leave offline mode and clear its saved game. */
export function exitOfflineGame(): void {
  offline = false;
  localSocket = null;
  LocalGameSocket.clearSave();
}

export function isOffline(): boolean {
  return offline;
}

export function getSocket(): AppSocket {
  if (offline) {
    if (!localSocket) localSocket = new LocalGameSocket();
    // The UI uses the socket structurally (on/off/once/emit/connected/
    // connect/disconnect); the local adapter implements that surface.
    return localSocket as unknown as AppSocket;
  }
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
  }
  return socket;
}

/**
 * Emit a socket event with a timeout. Rejects if no callback response within `ms`.
 */
export function emitWithTimeout<T>(
  event: string,
  data: unknown,
  ms = 5000
): Promise<T> {
  const s = getSocket();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Server not responding — please try again"));
    }, ms);

    (s as any).emit(event, data, (response: T) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}
