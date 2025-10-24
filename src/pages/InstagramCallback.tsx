// src/pages/InstagramCallback.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { readQueryParam } from "../utils/instagram";

export default function InstagramCallback() {
  const navigate = useNavigate();
  const [msg, setMsg] = React.useState("Procesando autorización…");

  React.useEffect(() => {
    const code = readQueryParam("code");
    const campaignId = readQueryParam("campaignId");

    if (!campaignId) {
      setMsg("Falta campaignId en el callback.");
      return;
    }

    console.log("[IG Callback] code:", code);

    navigate(`/my_marketing_campaign/${campaignId}/statistics`, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-sm opacity-80">{msg}</div>
    </div>
  );
}
