import * as React from "react";
import { useTranslation } from "react-i18next";

type FacebookConnectPanelProps = {
  clientId?: string;
  redirectUri?: string;
  scope?: string[];
  state?: string;
  openInNewTab?: boolean;
  variant?: "connect" | "reconnect";
  className?: string;
};

const DEFAULT_CLIENT_ID = import.meta.env.VITE_FB_APP_ID ?? "";

const DEFAULT_REDIRECT =
  (import.meta as any).env.VITE_FB_REDIRECT_URI ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/facebook/callback`
    : "");

const DEFAULT_SCOPE = [
  "pages_read_engagement",
  "pages_manage_engagement",
  "pages_manage_posts",
  "pages_show_list",
  "pages_read_user_content",
  "pages_messaging",
];

export default function FacebookConnectPanel({
  clientId = DEFAULT_CLIENT_ID,
  redirectUri = DEFAULT_REDIRECT,
  scope = DEFAULT_SCOPE,
  state = "random_state_string",
  openInNewTab = false,
  variant = "connect",
  className = "",
}: FacebookConnectPanelProps) {
  const [building, setBuilding] = React.useState(false);
  const { t } = useTranslation("translations");

  const isReconnect = variant === "reconnect";

  const authUrl = React.useMemo(() => {
    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope.join(","),
      state,
    });

    return `https://www.facebook.com/v20.0/dialog/oauth?${q.toString()}`;
  }, [clientId, redirectUri, scope, state]);

  return (
    <div className={["mt-2", className].join(" ")}>

      <button
        type="button"
        onClick={() => {
          setBuilding(true);
          if (openInNewTab) {
            window.open(authUrl, "_blank", "noopener,noreferrer");
          } else {
            window.location.href = authUrl;
          }
        }}
        className={[
          "transition",
          isReconnect
          ? "ring-1 text-xs p-2 rounded-lg ring-neutral-400/40 bg-neutral-500/5 hover:bg-neutral-500/10"
          : "ring-1 px-5 h-11 rounded-xl  ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20",
        ].join(" ")}
      >
        {building
          ? t("opening_facebook_auth", "Abriendo autorización…")
          : isReconnect
          ? t("reconnect_facebook", "Re-vincular Facebook")
          : t("connect_facebook", "Conectar Facebook")}
      </button>
    </div>
  );
}