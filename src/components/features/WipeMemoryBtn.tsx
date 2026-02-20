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
  draftKey?: string;
  label?: string;
  className?: string;
  confirm?: boolean;
};

const WipeMemoryBtn: React.FC<Props> = ({
  userId,
  namespaces = ["global", "moderation"],
  draftKey = "campaign:moderation:draft",
  label = "Borrar memoria y refrescar",
  className = "",
  confirm = false,
}) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const runWipe = React.useCallback(() => {
    if (!userId || typeof userId !== "string") {
      toast?.error?.("Falta userId para limpiar snapshots.");
      return;
    }

    const removed: string[] = [];

    try {
      for (const ns of namespaces) {
        clearBotSnapshot(ns, userId);
        removed.push(`agency:realtime:snapshot:${ns}:${userId}`);
      }
    } catch (e) {
      console.warn("[WipeMemoryBtn] error clearing bot snapshots:", e);
    }

    try {
      localStorage.removeItem(draftKey);
      removed.push(draftKey);
    } catch (e) {
      console.warn("[WipeMemoryBtn] error removing draftKey:", e);
    }

    try {
      console.groupCollapsed("[WipeMemoryBtn] removed keys");
      removed.forEach((k) => console.log("x", k));
      console.groupEnd();
    } catch {}

    toast?.info?.("Contexto borrado. Recargando...");
    setTimeout(() => window.location.reload(), 600);
  }, [userId, namespaces, draftKey]);

  const handleWipe = React.useCallback(() => {
    if (confirm) {
      setConfirmOpen(true);
      return;
    }
    runWipe();
  }, [confirm, runWipe]);

  const { t } = useTranslation("translations");

  return (
    <>
      <button
        type="button"
        onClick={handleWipe}
        className={[
          "flex gap-2 justify-center items-center dark:bg-emerald-700 bg-emerald-300 p-2 rounded-lg w-[220px] hover:scale-105 transition cursor-pointer hover:bg-emerald-400",
          className,
        ].join(" ")}
        title="Borrar snapshots (global/moderation) y draft, luego refrescar"
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-sm font-semibold">{label || t("wipe_memory_refresh")}</span>
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 ring-1 ring-emerald-400/30 shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-neutral-200/70 dark:border-neutral-800/70">
              <div className="text-sm font-semibold">{t("common.confirm", { defaultValue: "Confirmar" })}</div>
            </div>
            <div className="px-4 py-4 text-sm whitespace-pre-wrap">
              {`Esto borrara:\n\n- agency:realtime:snapshot:{${namespaces.join(", ")}}:${userId}\n- ${draftKey}\n\n¿Continuar?`}
            </div>
            <div className="px-4 py-3 border-t border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs bg-neutral-200/80 dark:bg-neutral-800/80 hover:bg-neutral-300 dark:hover:bg-neutral-700"
              >
                {t("cancel", { defaultValue: "Cancelar" })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  runWipe();
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white hover:bg-red-500"
              >
                {t("delete", { defaultValue: "Eliminar" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WipeMemoryBtn;
