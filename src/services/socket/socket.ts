import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

type InitOpts = {
  url?: string;
  token?: string;
};

export function initSocket({ url = import.meta.env.VITE_API_URL, token }: InitOpts = {}) {
  if (socket?.connected) return socket;

  socket = io(url, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    timeout: 10_000,
    auth: token ? { token } : undefined,
  });

  return socket;
}

export function getSocket(): Socket {
  if (!socket) throw new Error("Socket no inicializado. Llamá a initSocket() primero.");
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
