import * as React from "react";
import { GlassCard, SectionTitle } from "../../ModerationCampaign/components/Primitives";

type Props = {
  paths: string[]; 
  baseUrl?: string;
  onRemoveClick?: (path: string) => void;
};

const PersistedImagesSection: React.FC<Props> = ({ paths, baseUrl, onRemoveClick }) => {

  if (!paths?.length) return null;

  return (
    <GlassCard>
      <SectionTitle title="Imágenes almacenadas" subtitle="Ya guardadas en la campaña" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {paths.map((p) => (
          <div key={p} className="group relative rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60">
            <img src={baseUrl + p} alt={p} className="w-full h-28 object-cover" />
            {!!onRemoveClick && (
              <button
                type="button"
                onClick={() => onRemoveClick(p)}
                className="absolute top-1 right-1 px-2 py-1 rounded-md text-xs bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                aria-label="Eliminar imagen"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default PersistedImagesSection;
