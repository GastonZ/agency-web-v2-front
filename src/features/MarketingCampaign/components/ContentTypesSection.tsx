// src/features/MarketingCampaign/components/ContentTypesSection.tsx
import * as React from "react";
import { GlassCard, SectionTitle } from "../../ModerationCampaign/components/Primitives";

export const ContentTypes = {
  IMAGENES: "imagenes",
  VIDEOS: "videos",
  PODCASTS: "podcasts",
  CARRUSELES: "carruseles",
} as const;
export type ContentType = typeof ContentTypes[keyof typeof ContentTypes];

const OPTIONS: { key: ContentType; label: string }[] = [
  { key: ContentTypes.IMAGENES, label: "Imágenes" },
  { key: ContentTypes.VIDEOS, label: "Videos" },
  { key: ContentTypes.PODCASTS, label: "Podcasts" },
  { key: ContentTypes.CARRUSELES, label: "Carruseles" },
];

type Props = {
  value: ContentType[];
  onChange: (next: ContentType[]) => void;
};

const ContentTypesSection: React.FC<Props> = ({ value, onChange }) => {
  const toggle = (k: ContentType) => {
    const set = new Set(value);
    set.has(k) ? set.delete(k) : set.add(k);
    onChange(Array.from(set) as ContentType[]);
  };

  return (
    <GlassCard>
      <SectionTitle title="Tipos de contenido" subtitle="Elegí los formatos a producir" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OPTIONS.map((o) => {
          const active = value.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => toggle(o.key)}
              className={[
                "h-16 rounded-2xl w-full text-left px-4 transition border",
                active
                  ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                  : "bg-white/60 dark:bg-neutral-900/40 border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/40",
              ].join(" ")}
            >
              <div className="text-base font-medium">{o.label}</div>
              <div className="text-xs opacity-70">{active ? "Seleccionado" : "Click para seleccionar"}</div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default ContentTypesSection;
