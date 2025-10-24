import * as React from "react";
import { buildInstagramOAuthUrl } from "../../utils/instagram";

export default function InstagramConnectButton({ campaignId }: { campaignId: string }) {
  const handleConnect = () => {
    const url = buildInstagramOAuthUrl(campaignId);
    window.location.assign(url);
  };

  return (
    <button
      className="rounded-xl px-5 h-11 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
      onClick={handleConnect}
    >
      Conectar Instagram
    </button>
  );
}
