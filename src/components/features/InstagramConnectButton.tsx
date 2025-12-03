import React from "react";
import { buildInstagramAuthUrl } from "../../utils/instagram";
import { useTranslation } from "react-i18next";

type Props = {
  clientId: string;
  redirectUri: string;
  campaignId?: string;
  variant?: "connect" | "reconnect";
  className?: string;
};

export default function InstagramConnectButton({
  clientId,
  redirectUri,
  campaignId,
  variant = "connect",
  className = "",
}: Props) {

  const onClick = () => {
    const url = buildInstagramAuthUrl({
      clientId,
      redirectUri,
      forceReauth: true,    // for reconnection we WANT reauth
      state: campaignId,
    });
    window.location.href = url;
  };

  const { t } = useTranslation("translations");

  const isReconnect = variant === "reconnect";

  return (
    <button
      onClick={onClick}
      className={[
        "transition ",
        isReconnect
          ? "ring-1 text-xs p-2 rounded-lg ring-neutral-400/40 bg-neutral-500/5 hover:bg-neutral-500/10"
          : "ring-1 px-5 h-11 rounded-xl  ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20",
        className,
      ].join(" ")}
    >
      {isReconnect ? t("reconnect_instagram", "Re-vincular Instagram") : t("connect_instagram")}
    </button>
  );
}
