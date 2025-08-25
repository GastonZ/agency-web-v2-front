import * as React from "react";
import { Label } from "../Primitives";

const TagEditor: React.FC<{
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}> = ({ label, items, onChange, placeholder = "Escribe y presiona Enter…" }) => {
  const [draft, setDraft] = React.useState("");

  const add = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && items.length) {
      remove(items.length - 1);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div
        className={[
          "mt-2 rounded-xl border border-neutral-300/70 dark:border-neutral-700/70",
          "bg-white/70 dark:bg-neutral-950/40 px-2 py-2",
        ].join(" ")}
      >
        <div className="flex flex-wrap gap-2">
          {items.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="inline-flex items-center gap-2 px-3 h-8 rounded-full text-sm border border-emerald-400/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
            >
              {t}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-emerald-700/80 dark:text-emerald-200 hover:opacity-80"
                aria-label={`Eliminar ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-[140px] bg-transparent outline-none text-sm px-2 py-1 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>
    </div>
  );
};

export default TagEditor;
