// src/features/MarketingCampaign/components/ContactSourcesSection.tsx
import * as React from "react";
import { GlassCard, SectionTitle, Label, Chip } from "../../ModerationCampaign/components/Primitives";
import type { Channel } from "../../../services/types/marketing-types";

type Props = {
  files: File[];
  onFilesChange: (files: File[]) => void;

  platforms: Channel[];                          // ["instagram","facebook","whatsapp","email","x"]
  onPlatformsChange: (next: Channel[]) => void;
};

const ACCEPT = [
  ".csv",".xls",".xlsx",".vcf",".json",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/vcard","text/x-vcard",
  "application/json",
].join(",");

const PLATFORM_OPTIONS: Channel[] = ["instagram","facebook","whatsapp","email","x"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}

const ContactSourcesSection: React.FC<Props> = ({ files, onFilesChange, platforms, onPlatformsChange }) => {
  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    onFilesChange([...(files || []), ...arr]);
    e.currentTarget.value = "";
  };

  const removeFile = (idx: number) => {
    const next = [...files];
    next.splice(idx, 1);
    onFilesChange(next);
  };

  const togglePlatform = (p: Channel) => {
    const set = new Set(platforms || []);
    set.has(p) ? set.delete(p) : set.add(p);
    onPlatformsChange(Array.from(set) as Channel[]);
  };

  return (
    <GlassCard>
      <SectionTitle title="Fuentes de contacto" subtitle="Subí tus contactos y elegí redes para descubrir nuevos" />

      {/* Uploader */}
      <div className="mb-4">
        <Label>Archivos de contactos</Label>
        <label className="block mt-1">
          <div className="flex items-center justify-center h-28 rounded-2xl cursor-pointer bg-white/70 dark:bg-neutral-900/40 border-2 border-dashed border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/60 transition">
            <span className="text-sm opacity-80">Arrastrá o hacé click para subir (.csv, .xls, .xlsx, .vcf, .json)</span>
          </div>
          <input type="file" multiple accept={ACCEPT} className="hidden" onChange={onSelectFiles} />
        </label>

        {files.length > 0 && (
          <ul className="mt-3 divide-y divide-neutral-200/40 dark:divide-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="truncate">
                  <span className="font-medium">{f.name}</span>
                  <span className="opacity-60 ml-2">{formatSize(f.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="px-2 py-1 rounded-md text-xs bg-black/60 text-white hover:bg-black/70"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Plataformas */}
      <div>
        <Label>Redes a explorar (scraping)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {PLATFORM_OPTIONS.map((p) => {
            const active = platforms?.includes(p);
            return (
              <Chip key={p} active={active} onClick={() => togglePlatform(p)} ariaLabel={`Elegir ${p}`}>
                {p}
              </Chip>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};

export default ContactSourcesSection;
