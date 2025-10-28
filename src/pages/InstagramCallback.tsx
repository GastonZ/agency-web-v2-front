import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function InstagramCallback() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const code = sp.get("code");
  const state = sp.get("state");
  const error = sp.get("error");
  const errorDesc = sp.get("error_description");

  React.useEffect(() => {
    if (error) return; // mostrará abajo

    // Aquí normalmente llamarías a TU backend para intercambiar el code por tokens:
    // await api.post("/instagram/exchange", { code, redirectUri });

    // Por ahora, solo demo:
    console.log("CODE:", code, "STATE:", state);

    // Cuando termines, redirige a stats de campaña (ejemplo):
    // navigate(`/my_marketing_campaign/${campaignId}/statistics`, { replace: true });
  }, [code, state, error, navigate]);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-3">Instagram callback</h1>

      {error ? (
        <div className="text-red-600">
          <div>Error: {error}</div>
          <div>{errorDesc}</div>
        </div>
      ) : (
        <pre className="text-sm bg-neutral-900/60 p-3 rounded">
          {`code: ${code ?? "—"}
state: ${state ?? "—"}`}
        </pre>
      )}
    </div>
  );
}