// src/features/MarketingCampaign/components/ContactSourcesSection.tsx
import * as React from "react";
import { GlassCard, SectionTitle, Label, Chip } from "../../ModerationCampaign/components/Primitives";
import type { Channel } from "../../../services/types/marketing-types";

type Props = {
  files: File[];
  onFilesChange: (files: File[]) => void;

  platforms: Channel[];                          // ["instagram","facebook","whatsapp","email","x"]
  onPlatformsChange: (next: Channel[]) => void;

  connectedAccounts: string[];
  onAddAccount: (acc: string) => void;
  onRemoveAccount: (acc: string) => void;

  minFollowers: number;
  onMinFollowersChange: (n: number) => void;
};

const ACCEPT = [
  ".csv", ".xls", ".xlsx", ".vcf", ".json",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/vcard", "text/x-vcard",
  "application/json",
].join(",");

const PLATFORM_OPTIONS: Channel[] = ["instagram", "facebook", "whatsapp", "email", "x"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ContactSourcesSection: React.FC<Props> = ({ files, onFilesChange, platforms, onPlatformsChange, onAddAccount, connectedAccounts, minFollowers, onMinFollowersChange, onRemoveAccount }) => {


  const [accInput, setAccInput] = React.useState("");


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

  const addAcc = () => {
    const v = accInput.trim();
    if (!v) return;
    onAddAccount(v);
    setAccInput("");
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

      <div className="mt-6">
        <Label>Cuentas conectadas</Label>
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
            placeholder="@mi_empresa_instagram"
            value={accInput}
            onChange={(e) => setAccInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAcc(); } }}
          />
          <button
            type="button"
            onClick={addAcc}
            className="h-11 px-3 rounded-xl bg-emerald-600 text-white"
          >
            Añadir
          </button>
        </div>

        {connectedAccounts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {connectedAccounts.map((acc) => (
              <Chip key={acc} active className="select-none" onClick={() => onRemoveAccount(acc)} ariaLabel={`Quitar ${acc}`}>
                {acc} ✕
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* Filtro: seguidores mínimos */}
      <div className="mt-6">
        <Label>Seguidores mínimos</Label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="number"
            min={0}
            step={100}
            value={minFollowers}
            onChange={(e) => onMinFollowersChange(Number(e.target.value))}
            className="w-44 h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
            placeholder="1000"
          />
          <span className="text-sm opacity-70">Usaremos este mínimo al buscar nuevos contactos.</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default ContactSourcesSection;
