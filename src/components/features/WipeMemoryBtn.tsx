import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { clearBotSnapshot } from "../../AIconversational/voice/session/persistence";
import { useTranslation } from "react-i18next";

/**
 * Borra selectivamente:
 * - agency:realtime:snapshot:{namespace}:{userId}  (por cada namespace)
 * - campaign:moderation:draft                      (clave de draft por defecto)
 *
 * No toca otras claves (ej: tokens).
 */
type Props = {
  userId: string;
  namespaces?: Array<"global" | "moderation" | string>;
  draftKey?: string;         // por si querés usar otra clave de draft en el futuro
  label?: string;
  className?: string;
  confirm?: boolean;         // pedir confirmación antes de borrar
};

const WipeMemoryBtn: React.FC<Props> = ({
  userId,
  namespaces = ["global", "moderation"],
  draftKey = "campaign:moderation:draft",
  label = "Borrar memoria y refrescar",
  className = "",
  confirm = false,
}) => {
  const handleWipe = React.useCallback(() => {
    if (!userId || typeof userId !== "string") {
      toast?.error?.("Falta userId para limpiar snapshots.");
      return;
    }

    if (confirm) {
      const ok = window.confirm(
        `Esto borrará:\n\n- agency:realtime:snapshot:{${namespaces.join(", ")}}:${userId}\n- ${draftKey}\n\n¿Continuar?`
      );
      if (!ok) return;
    }

    const removed: string[] = [];

    // 1) Snapshots por namespace
    try {
      for (const ns of namespaces) {
        clearBotSnapshot(ns, userId);
        removed.push(`agency:realtime:snapshot:${ns}:${userId}`);
      }
    } catch (e) {
      console.warn("[WipeMemoryBtn] error clearing bot snapshots:", e);
    }

    // 2) Draft de campaña (clave fija por ahora)
    try {
      localStorage.removeItem(draftKey);
      removed.push(draftKey);
    } catch (e) {
      console.warn("[WipeMemoryBtn] error removing draftKey:", e);
    }

    // Logs útiles
    try {
      console.groupCollapsed("[WipeMemoryBtn] removed keys");
      removed.forEach(k => console.log("×", k));
      console.groupEnd();
    } catch {}

    // Feedback + refresh
    toast?.info?.("Contexto borrado. Recargando…");
    setTimeout(() => window.location.reload(), 600);
  }, [userId, namespaces, draftKey, confirm]);

  const { t } = useTranslation('translations');

  return (
    <button
      type="button"
      onClick={handleWipe}
      className={["flex gap-2 justify-center items-center dark:bg-emerald-700 bg-emerald-300 p-2 rounded-lg w-[220px] hover:scale-105 transition cursor-pointer hover:bg-emerald-400",
        className,
      ].join(" ")}
      title="Borrar snapshots (global/moderation) y draft, luego refrescar"
    >
      <Trash2 className="w-4 h-4" />
      <span className="text-sm font-semibold">{t("wipe_memory_refresh")}</span>
    </button>
  );
};

export default WipeMemoryBtn;
