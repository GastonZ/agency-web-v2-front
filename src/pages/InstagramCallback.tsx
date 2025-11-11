import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { setModerationInstagramCode } from "../services/campaigns";
import { toast } from "react-toastify";

export default function InstagramCallback() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const code = sp.get("code");
  const campaignId = sp.get("state") || sp.get("id") || "";
  const error = sp.get("error");
  const errorDesc = sp.get("error_description");

  const [status, setStatus] = React.useState<"idle" | "working" | "error">("idle");
  const [errMsg, setErrMsg] = React.useState<string>("");

  React.useEffect(() => {
    if (error) {
      setStatus("error");
      setErrMsg(errorDesc || "Error de autorización en Instagram.");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrMsg("No se recibió el código de autorización (code).");
      return;
    }
    if (!campaignId) {
      setStatus("error");
      setErrMsg("Falta el ID de la campaña (campaignId o id en la URL).");
      return;
    }

    let aborted = false;
    (async () => {
      try {
        setStatus("working");
        await setModerationInstagramCode(campaignId, code);
        if (aborted) return;

        toast.success("Instagram conectado a la campaña.");
        navigate(`/my_moderation_campaign/${campaignId}/statistics`, { replace: true });
      } catch (e: any) {
        if (aborted) return;
        setStatus("error");
        setErrMsg(e?.message || "No se pudo asociar Instagram a la campaña.");
      }
    })();

    return () => { aborted = true; };
  }, [code, campaignId, error, errorDesc, navigate]);

  if (status !== "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm opacity-80">
            {status === "working" ? "Conectando Instagram…" : "Preparando…"}
          </p>
        </div>
      </div>
    );
  }

  // Modo error
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full rounded-xl border p-5 bg-white/80 dark:bg-neutral-900/70">
        <h1 className="text-lg font-semibold mb-2">Error al conectar Instagram</h1>
        <p className="text-sm opacity-80 mb-4">{errMsg}</p>
        <div className="flex gap-2">
          <button
            className="rounded-lg px-4 py-2 text-sm bg-neutral-200 dark:bg-neutral-800"
            onClick={() => window.history.back()}
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
