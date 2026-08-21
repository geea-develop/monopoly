"use client";

import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@monopoly/shared";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
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
