import React from "react";
import { buildInstagramAuthUrl } from "../../utils/instagram";

type Props = {
  clientId: string;
  redirectUri: string; // "http://localhost:5173/instagram/callback"
};

export default function InstagramConnectButton({ clientId, redirectUri }: Props) {
  const onClick = () => {
    const url = buildInstagramAuthUrl({ clientId, redirectUri, forceReauth: true });
    // opcional: guarda el `state` que devuelve buildInstagramAuthUrl si prefieres controlarlo desde fuera
    window.location.href = url;
  };

  return (
    <button
      onClick={onClick}
      className="rounded-xl px-5 h-11 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
    >
      Conectar Instagram
    </button>
  );
}