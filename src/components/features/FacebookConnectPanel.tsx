import * as React from "react";
import { useTranslation } from "react-i18next";

type FacebookConnectPanelProps = {
  clientId?: string;
  redirectUri?: string;
  scope?: string[];
  state?: string;
  openInNewTab?: boolean;
  className?: string;
};

const DEFAULT_CLIENT_ID = import.meta.env.VITE_FB_APP_ID ?? "";

// Si querés, podés definir VITE_FB_REDIRECT_URI en .env,
// si no, usamos /facebook/callback en el dominio actual.
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
  className = "",
}: FacebookConnectPanelProps) {
  const [building, setBuilding] = React.useState(false);
  const { t } = useTranslation("translations");

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
    <div className={["mt-4", className].join(" ")}>
      <div className="space-y-2">
        <h3 className="text-[15px] font-semibold leading-tight">
          {t("link_facebook_page", "Vincular página de Facebook")}
        </h3>
        <p className="text-sm opacity-80">
          {t(
            "redirect_to_facebook",
            "Te vamos a redirigir a Facebook para que autorices el acceso."
          )}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
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
          className="rounded-xl px-5 h-11 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
        >
          {building
            ? t("opening_facebook_auth", "Abriendo autorización…")
            : t("connect_facebook", "Conectar Facebook")}
        </button>
      </div>
    </div>
  );
}
