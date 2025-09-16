import * as React from "react";

export type CatalogInfluencer = {
  id: string;
  name: string;
  avatar: string;       // URL
  niches: string[];
  followers: string;    // ej: "120k"
  description: string;
};

type Props = {
  items: CatalogInfluencer[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

const InfluencerCarousel: React.FC<Props> = ({ items, selectedId, onSelect }) => {
  const [idx, setIdx] = React.useState(0);
  const next = () => setIdx((v) => (v + 1) % items.length);
  const prev = () => setIdx((v) => (v - 1 + items.length) % items.length);

  const current = items[idx];

  return (
    <div className="w-full">
      <div className="rounded-2xl p-4 bg-white/60 dark:bg-neutral-900/40 border border-neutral-300/50 dark:border-neutral-700/50">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prev}
            className="h-9 w-9 rounded-full border border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/50"
            aria-label="Anterior"
          >
            ‹
          </button>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[120px,1fr] gap-4 items-center">
            <img
              src={current.avatar}
              alt={current.name}
              className="w-full sm:w-[120px] h-[120px] object-cover rounded-xl ring-1 ring-emerald-400/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-emerald-300">{current.name}</h4>
                {selectedId === current.id && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40">
                    Seleccionado
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-300/90 mt-1">{current.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-white/40 dark:bg-neutral-800/60 border border-neutral-300/40 dark:border-neutral-700/40">
                  {current.followers} seguidores
                </span>
                {current.niches.map((n) => (
                  <span
                    key={n}
                    className="px-2 py-0.5 rounded-full bg-white/40 dark:bg-neutral-800/60 border border-neutral-300/40 dark:border-neutral-700/40"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={next}
            className="h-9 w-9 rounded-full border border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/50"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => onSelect(current.id)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white"
          >
            Seleccionar
          </button>
        </div>

        <div className="mt-3 flex justify-center gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 w-6 rounded-full",
                i === idx ? "bg-emerald-400" : "bg-neutral-700",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfluencerCarousel;
