import * as React from "react";
import { MoreHorizontal, BarChart3, Pencil, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";


type Props = {
  onViewStats: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  className?: string;
};

export default function ActionsButton({ onViewStats, onEdit, className = "", onDelete }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const { t } = useTranslation('translations');

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={` ${className}`}>
      <button
        className="rounded-md px-2 py-1 ring-1 ring-emerald-400/30 hover:bg-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Acciones"
      >
        <MoreHorizontal />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-lg bg-white/95 dark:bg-neutral-900/95 
             shadow-xl ring-1 ring-emerald-400/20 backdrop-blur-xl 
             z-50 isolate"
        >
          <button
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-500/10 cursor-pointer"
            onClick={() => { setOpen(false); onViewStats(); }}
          >
            <BarChart3 className="h-4 w-4 opacity-80" />
            {t("view_statistics")}
          </button>
          <button
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-500/10 cursor-pointer"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            <Pencil className="h-4 w-4 opacity-80" />
            {t("edit")}
          </button>
          {onDelete && (
            <button
              role="menuitem"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-500/10 cursor-pointer"
              onClick={() => { setOpen(false); onDelete(); }}
            >
              <Trash className="h-4 w-4 opacity-80" />
              {t("delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
