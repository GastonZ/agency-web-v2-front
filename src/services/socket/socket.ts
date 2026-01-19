import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

type InitOpts = {
  url?: string;
  token?: string;
  userId?: string; // <- client account id (owner)
};

export function initSocket(
  { url = import.meta.env.VITE_API_URL, token, userId }: InitOpts = {}
) {
  // Si ya está conectado, devolvemos el mismo
  if (socket?.connected) return socket;

  // Si existe pero estaba desconectado, evitamos duplicados
  if (socket && !socket.connected) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch { }
    socket = null;
  }

  socket = io(url, {
    path: "/socket.io",

    transports: ["polling"], 
    upgrade: false,   

    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    timeout: 10_000,

    auth: token ? { token } : undefined,
    query: userId ? { userId } : undefined,
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
