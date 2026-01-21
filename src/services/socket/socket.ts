import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

type InitOpts = {
  url?: string;
  token?: string;
  userId?: string; // <- client account id (owner)
};

function sameUserId(a?: unknown, b?: unknown) {
  return String(a ?? "") === String(b ?? "");
}

function currentUserId(s: Socket | null): string {
  try {
    const q = (s?.io?.opts as any)?.query as any;
    return q?.userId ? String(q.userId) : "";
  } catch {
    return "";
  }
}

export function initSocket(
  { url = import.meta.env.VITE_API_URL, token, userId }: InitOpts = {}
) {
  const nextUserId = (userId ?? "").trim();
  // Si ya está conectado, devolvemos el mismo
  if (socket) {
    const curUserId = currentUserId(socket);

    // If the socket is already connected but with a different userId, recreate it.
    if (socket.connected && nextUserId && !sameUserId(curUserId, nextUserId)) {
      disconnectSocket();
    } else if (!socket.connected) {
      // If it's not connected yet but the intended user differs, recreate to ensure handshake query.
      if (nextUserId && !sameUserId(curUserId, nextUserId)) {
        disconnectSocket();
      } else {
        return socket;
      }
    } else {
      // Connected and same user (or no user specified) => reuse.
      return socket;
    }
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
    query: nextUserId ? { userId: nextUserId } : undefined,
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
