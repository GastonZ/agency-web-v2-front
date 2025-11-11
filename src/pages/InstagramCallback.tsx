import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { setModerationInstagramCode } from "../services/campaigns";
import { toast } from "react-toastify";

export default function InstagramCallback() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const code = sp.get("code");
  const campaignId = sp.get("state");

  const [status, setStatus] = React.useState<"idle" | "working">("idle");

  React.useEffect(() => {
    let aborted = false;

    (async () => {
      try {
        setStatus("working");
        const res = await setModerationInstagramCode(campaignId!, code!);
        if (aborted) return;

        console.log('setting ig data to campaign',res);
        
        toast.success("Instagram conectado a la campaña.");
        navigate(`/my_moderation_campaign/${campaignId}/statistics`, { replace: true });
      } catch (e) {
        if (aborted) return;
        console.error(e);
        toast.error("No se pudo asociar Instagram a la campaña.");
      }
    })();

    return () => {
      aborted = true;
    };
  }, [code, campaignId, navigate]);

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
