// src/features/MarketingCampaign/components/BaseImagesSection.tsx
import * as React from "react";
import { GlassCard, SectionTitle } from "../../ModerationCampaign/components/Primitives";

type Preview = { file: File; url: string };

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

const BaseImagesSection: React.FC<Props> = ({ files, onChange }) => {
  const [previews, setPreviews] = React.useState<Preview[]>([]);

  React.useEffect(() => {
    // crear previews a partir de files externos
    const newPreviews = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((prev) => {
      // limpiar urls viejas
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return newPreviews;
    });
    // cleanup al desmontar
    return () => newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/"));
    onChange([...(files || []), ...arr]);
    e.currentTarget.value = ""; // reset input
  };

  const remove = (idx: number) => {
    const next = [...files];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <GlassCard>
      <SectionTitle title="Imágenes base" subtitle="Subí imágenes para futuras piezas" />
      <label className="block">
        <div
          className={[
            "flex items-center justify-center h-28 rounded-2xl cursor-pointer",
            "bg-white/70 dark:bg-neutral-900/40 border-2 border-dashed",
            "border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/60 transition",
          ].join(" ")}
        >
          <div className="text-sm opacity-80">Arrastrá o hacé click para subir imágenes</div>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onSelectFiles}
        />
      </label>

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60">
              <img src={p.url} alt={p.file.name} className="w-full h-28 object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 px-2 py-1 rounded-md text-xs bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                aria-label="Eliminar imagen"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default BaseImagesSection;
