import * as React from "react";

type InstagramConnectPanelProps = {
  clientId?: string;
  redirectUri?: string;
  scope?: string[];
  state?: string;
  openInNewTab?: boolean;
  className?: string;
};

const DEFAULT_CLIENT_ID = "462644713203542";
const DEFAULT_REDIRECT =
  import.meta.env.VITE_API_URL + "/api/instagram/auth/callback";

const DEFAULT_SCOPE = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
];

export default function InstagramConnectPanel({
  clientId = DEFAULT_CLIENT_ID,
  redirectUri = DEFAULT_REDIRECT,
  scope = DEFAULT_SCOPE,
  state = "random_state_string",
  openInNewTab = false,
  className = "",
}: InstagramConnectPanelProps) {
  const [building, setBuilding] = React.useState(false);

  const authUrl = React.useMemo(() => {
    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope.join(","),
      state,
    });
    return `https://www.instagram.com/oauth/authorize?${q.toString()}`;
  }, [clientId, redirectUri, scope, state]);

  return (
    <div
      className={[
        "mt-4",
        className,
      ].join(" ")}
    >
      <div className="space-y-2">
        <h3 className="text-[15px] font-semibold leading-tight">
          Vincular cuenta de Instagram
        </h3>
        <p className="text-sm opacity-80">
          Te redirigiremos a Instagram para autorizar el acceso. Luego volveras a la app.
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setBuilding(true);
            if (openInNewTab) window.open(authUrl, "_blank", "noopener,noreferrer");
            else window.location.href = authUrl;
          }}
          className="rounded-xl px-5 h-11 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
        >
          {building ? "Abriendo autorización…" : "Conectar Instagram"}
        </button>
      </div>

    </div>
  );
}
