import React from "react";
import { buildInstagramAuthUrl } from "../../utils/instagram";
import { useTranslation } from "react-i18next";

type Props = {
  clientId: string;
  redirectUri: string;
  campaignId?: string;
};

export default function InstagramConnectButton({ clientId, redirectUri, campaignId }: Props) {

  const onClick = () => {
    const url = buildInstagramAuthUrl({ clientId, redirectUri, forceReauth: true, state: campaignId });
    window.location.href = url;
  }; 

  const { t } = useTranslation('translations');

  return (
    <button
      onClick={onClick}
      className="rounded-xl px-5 h-11 mt-4 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
    >
      {t("connect_instagram")}
    </button>
  );
}