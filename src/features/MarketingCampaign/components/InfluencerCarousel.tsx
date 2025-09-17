import * as React from "react";
import type { InfluencerItem  } from "../../../services/types/influencer-types";

type Props = {
  items: InfluencerItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

function usePerPage() {
  const [pp, setPp] = React.useState(3);
  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w < 640) setPp(1);
      else if (w < 1024) setPp(2);
      else setPp(3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return pp;
}

const InfluencerCarousel: React.FC<Props> = ({ items, selectedId, onSelect }) => {
  const perPage = usePerPage();
  const [page, setPage] = React.useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const start = page * perPage;
  const visible = items.slice(start, start + perPage);

  const prev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const next = () => setPage((p) => (p + 1) % totalPages);

  return (
    <div className="w-full">
      <div className="rounded-2xl p-4 bg-white/60 dark:bg-neutral-900/40 border border-neutral-300/50 dark:border-neutral-700/50">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={prev}
            className="h-9 w-9 rounded-full border border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/50"
            aria-label="Anterior"
          >
            ‹
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
            {visible.map((it) => {
              const active = selectedId === it.id;
              return (
                <div
                  key={it.id}
                  className={[
                    "rounded-xl p-3 transition border grid grid-cols-[96px,1fr] gap-3 items-center",
                    active
                      ? "bg-emerald-500/15 border-emerald-400/50 ring-1 ring-emerald-400/30"
                      : "bg-white/60 dark:bg-neutral-900/40 border-neutral-300/50 dark:border-neutral-700/50",
                  ].join(" ")}
                >
                  <img
                    src={it.profilePictureUrl}
                    alt={it.displayName}
                    className="w-24 h-24 object-cover rounded-lg ring-1 ring-emerald-400/20"
                    loading="lazy"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-emerald-300">{it.displayName}</h4>
                      {active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300/90 mt-0.5 line-clamp-2">{it.bio || it.notes || "—"}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-white/40 dark:bg-neutral-800/60 border border-neutral-300/40 dark:border-neutral-700/40">
                        {Intl.NumberFormat().format(it.followersCount)} segs
                      </span>
                      {it.tags?.slice(0, 3).map((n) => (
                        <span
                          key={n}
                          className="px-2 py-0.5 rounded-full bg-white/40 dark:bg-neutral-800/60 border border-neutral-300/40 dark:border-neutral-700/40"
                        >
                          {n}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => onSelect(it.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-sm"
                      >
                        Elegir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={["h-1.5 w-6 rounded-full", i === page ? "bg-emerald-400" : "bg-neutral-700"].join(" ")} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfluencerCarousel;
