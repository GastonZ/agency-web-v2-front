import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { clearBotSnapshot } from "../../AIconversational/voice/session/persistence";

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
  label = "Borrar ctx y refrescar",
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

  return (
    <button
      type="button"
      onClick={handleWipe}
      className={[
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium",
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400",
        className,
      ].join(" ")}
      title="Borrar snapshots (global/moderation) y draft, luego refrescar"
    >
      <Trash2 className="w-6 h-6" />
      <span>{label}</span>
    </button>
  );
};

export default WipeMemoryBtn;
