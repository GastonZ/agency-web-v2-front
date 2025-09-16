// src/hooks/useUserQrChannel.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { initSocket, getSocket } from "../services/socket/socket";

export type QrPayload = { data: string; [k: string]: any };

type UseUserQrChannelOpts = {
  userId: string;
  socketUrl?: string;
  token?: string;
  autoStart?: boolean; // NEW (default true)
};

export function useUserQrChannel({
  userId,
  socketUrl = "http://localhost:9000",
  token,
  autoStart = true,
}: UseUserQrChannelOpts) {
  const [connected, setConnected] = useState(false);
  const [qr, setQr] = useState<QrPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribedOnce = useRef(false);
  const listenersAttached = useRef(false);

  const resetQr = useCallback(() => setQr(null), []);

  // shared handlers (stable)
  const onConnect = useCallback(() => {
    setConnected(true);
    setError(null);
    // subscribe once per mount
    const socket = getSocket();
    if (socket && !subscribedOnce.current && userId) {
      socket.emit("subscribe-user", { event: "subscribe-user", userId });
      subscribedOnce.current = true;
    }
  }, [userId]);

  const onDisconnect = useCallback(() => setConnected(false), []);
  const onConnectError = useCallback((err: any) => {
    setError(err?.message ?? "Fallo de conexión");
    setConnected(false);
  }, []);

  const onQrGenerated = useCallback((payload: any) => {
    // Be tolerant with shapes; store string in .data
    const maybe =
      (typeof payload === "string" ? payload : null) ??
      payload?.data ??
      payload?.qr ??
      payload?.qrcode ??
      payload?.code ??
      payload?.value ??
      null;

    if (typeof maybe === "string") {
      setQr({ data: maybe, ...((typeof payload === "object" && payload) || {}) });
    } else {
      setQr({ data: "", ...((typeof payload === "object" && payload) || {}) });
    }
  }, []);

  const attachListeners = useCallback((socket: any) => {
    if (listenersAttached.current || !socket) return;
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("qr-generated", onQrGenerated);
    listenersAttached.current = true;
  }, [onConnect, onDisconnect, onConnectError, onQrGenerated]);

  const detachListeners = useCallback((socket: any) => {
    if (!listenersAttached.current || !socket) return;
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("connect_error", onConnectError);
    socket.off("qr-generated", onQrGenerated);
    listenersAttached.current = false;
  }, [onConnect, onDisconnect, onConnectError, onQrGenerated]);

  // NEW: start on demand
  const startSocket = useCallback(async () => {
    if (!userId) throw new Error("userId requerido para conectar el socket");
    const socket = initSocket({ url: socketUrl, token }); // creates (or returns) the singleton
    attachListeners(socket);

    if (socket.connected) {
      onConnect(); // ensure subscribe-user fired if needed
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const ok = () => { socket.off("connect", ok); resolve(); };
      const ko = (err: any) => { socket.off("connect_error", ko); reject(err); };
      socket.once("connect", ok);
      socket.once("connect_error", ko);
      socket.connect();
    });
  }, [userId, socketUrl, token, attachListeners, onConnect]);

  // optional auto start (backwards compatible)
  useEffect(() => {
    if (!autoStart) return;
    let mounted = true;

    (async () => {
      try {
        await startSocket();
      } catch (e) {
        // ignore; error state is set by onConnectError
      }
    })();

    return () => {
      const socket = getSocket();
      detachListeners(socket);
      subscribedOnce.current = false;
    };
  }, [autoStart, startSocket, detachListeners]);

  const disconnect = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.disconnect();
  }, []);

  return { connected, qr, error, resetQr, startSocket, disconnect, getSocket };
}
