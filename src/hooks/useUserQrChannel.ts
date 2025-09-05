import { useEffect, useRef, useState, useCallback } from "react";
import { initSocket, getSocket } from "../services/socket/socket";

export type QrPayload = { data: string; [k: string]: any };

type UseUserQrChannelOpts = {
  userId: string;
  socketUrl?: string;
  token?: string; // opcional
};

// ⚠️ Sugerencia: por defecto apuntar al WS real (9000).
// Si preferís, pasalo por prop desde el padre.
export function useUserQrChannel({
  userId,
  socketUrl = "http://localhost:9000",
  token,
}: UseUserQrChannelOpts) {
  const [connected, setConnected] = useState(false);
  const [qr, setQr] = useState<QrPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscribedOnce = useRef(false);

  const resetQr = useCallback(() => setQr(null), []);

  useEffect(() => {
    if (!userId) return;

    const socket = initSocket({ url: socketUrl, token });

    const doSubscribe = () => {
      if (!subscribedOnce.current) {
        socket.emit("subscribe-user", { event: "subscribe-user", userId });
        subscribedOnce.current = true;
      }
    };

    const onConnect = () => {
      setConnected(true);
      setError(null);
      doSubscribe();
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: any) => {
      setError(err?.message ?? "Fallo de conexión");
      setConnected(false);
    };

    const onQrGenerated = (payload: any) => {
      // Log de depuración, para ver exactamente qué llega
      // (lo pediste para confirmar si viene en el evento)
      console.debug("[socket] qr-generated payload:", payload);

      // Tolerante a distintas claves
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
        // si no pudimos extraer string, igual guardamos el payload crudo
        setQr({ data: "", ...((typeof payload === "object" && payload) || {}) });
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("qr-generated", onQrGenerated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("qr-generated", onQrGenerated);
      subscribedOnce.current = false;
    };
  }, [userId, socketUrl, token]);

  return { connected, qr, error, resetQr, getSocket };
}
