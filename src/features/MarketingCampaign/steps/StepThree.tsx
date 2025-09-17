import * as React from "react";
import { GlassCard, SectionTitle, Label, TextArea } from "../../ModerationCampaign/components/Primitives";
import InfluencerCarousel from "../components/InfluencerCarousel";
import { useMarketing } from "../../../context/MarketingContext";
import { fetchInfluencers } from "../../../services/influencer";
import type { InfluencerItem } from "../../../services/types/influencer-types";

export const InfluencerTypes = {
  OWN: "own_account",
  CATALOG: "catalog",
  VIRTUAL_AI: "virtual_ai",
} as const;
export type InfluencerType = typeof InfluencerTypes[keyof typeof InfluencerTypes];

const appearanceOptions = ["Realista", "Anime", "Low-poly"] as const;
const styleOptions = ["Profesional", "Amigable", "Irónico"] as const;
const personalityOptions = ["Serena", "Enérgica", "Extrovertida"] as const;
const languageAccentOptions = ["Español (AR)", "Español (MX)", "Inglés (US)"] as const;

const StepThree: React.FC = () => {
  const {
    data,
    setInfluencerType,
    setCatalogInfluencer
    // setVirtualAgent, // si lo definís más adelante en el context
  } = useMarketing();

  const [influencers, setInfluencers] = React.useState<InfluencerItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Virtual agent (por ahora local, si querés persistirlo sumamos setters)
  const [virtualAgent, setVirtualAgentLocal] = React.useState({
    description: "",
    referenceImage: null as File | null,
    appearance: appearanceOptions[0],
    style: styleOptions[0],
    personality: personalityOptions[0],
    languageAccent: languageAccentOptions[0],
  });
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const list = await fetchInfluencers();
        if (!alive) return;
        setInfluencers(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "No se pudieron cargar los influencers");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    if (virtualAgent.referenceImage) {
      const u = URL.createObjectURL(virtualAgent.referenceImage);
      setPreviewUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setPreviewUrl(null);
    }
  }, [virtualAgent.referenceImage]);

  const OptionCard: React.FC<{
    id: InfluencerType;
    title: string;
    subtitle: string;
  }> = ({ id, title, subtitle }) => {
    const active = data.influencerType === id;
    return (
      <button
        type="button"
        onClick={() => setInfluencerType(id)}
        className={[
          "w-full text-left rounded-2xl p-4 border transition",
          active
            ? "bg-emerald-500/15 border-emerald-400/50 ring-1 ring-emerald-400/30"
            : "bg-white/60 dark:bg-neutral-900/40 border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/40",
        ].join(" ")}
      >
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm opacity-80">{subtitle}</div>
      </button>
    );
  };

  const handleCatalogSelect = (id: string) => {
    const it = influencers.find((x) => x.id === id);
    setCatalogInfluencer(id, it?.notes || it?.bio || "");
  };

  return (
    <div className="space-y-4">
      {/* Selector de tipo */}
      <GlassCard>
        <SectionTitle title="Tipo de influencer" subtitle="Elegí una sola opción" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <OptionCard id={"own_account"} title="Propio" subtitle="Usarás un influencer/cuenta propia." />
          <OptionCard id={"catalog"} title="Catálogo" subtitle="Seleccioná desde un listado de influencers." />
          <OptionCard id={"virtual_ai"} title="Virtual IA" subtitle="Crearemos un agente con identidad propia." />
        </div>
      </GlassCard>

      {/* Mensaje para Propio */}
      {data.influencerType === "own_account" && (
        <GlassCard>
          <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-400/30">
            <p className="text-sm">Al finalizar vas a poder conectar tu cuenta/influencer propio.</p>
          </div>
        </GlassCard>
      )}

      {/* Catálogo */}
      {data.influencerType === "catalog" && (
        <GlassCard>
          <SectionTitle title="Catálogo" subtitle="Elegí un influencer sugerido" />
          {loading && <div className="text-sm opacity-80">Cargando…</div>}
          {error && <div className="text-sm text-red-400">{error}</div>}
          {!loading && !error && influencers.length > 0 && (
            <InfluencerCarousel
              items={influencers}
              selectedId={data.selectedInfluencerId || undefined}
              onSelect={handleCatalogSelect}
            />
          )}
          {!loading && !error && influencers.length === 0 && (
            <div className="text-sm opacity-80">No hay influencers disponibles.</div>
          )}
        </GlassCard>
      )}

      {/* Virtual IA (local) */}
      {data.influencerType === "virtual_ai" && (
        <GlassCard>
          <SectionTitle title="Configurar agente virtual" subtitle="Definí rasgos y referencia visual (opcional)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Descripción del agente</Label>
              <TextArea
                rows={4}
                placeholder="Ej: Presentadora carismática, tono amigable, foco en moda sostenible…"
                value={virtualAgent.description}
                onChange={(e) => setVirtualAgentLocal((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div>
              <Label>Foto de referencia (opcional)</Label>
              <label className="block mt-1">
                <div className="flex items-center justify-center h-28 rounded-2xl cursor-pointer bg-white/70 dark:bg-neutral-900/40 border-2 border-dashed border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/60 transition">
                  <span className="text-sm opacity-80">Subir imagen</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setVirtualAgentLocal((p) => ({ ...p, referenceImage: f }));
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              {previewUrl && (
                <div className="mt-3">
                  <img src={previewUrl} alt="preview" className="w-full h-40 object-cover rounded-xl ring-1 ring-emerald-400/20" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* selects rápidas */}
              {/* Apariencia */}
              <div>
                <Label>Apariencia</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.appearance}
                  onChange={(e) => setVirtualAgentLocal((p) => ({ ...p, appearance: e.target.value }))}
                >
                  {appearanceOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Estilo */}
              <div>
                <Label>Estilo</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.style}
                  onChange={(e) => setVirtualAgentLocal((p) => ({ ...p, style: e.target.value }))}
                >
                  {styleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Personalidad */}
              <div>
                <Label>Personalidad</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.personality}
                  onChange={(e) => setVirtualAgentLocal((p) => ({ ...p, personality: e.target.value }))}
                >
                  {personalityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {/* Idioma */}
              <div>
                <Label>Idioma y acento</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.languageAccent}
                  onChange={(e) => setVirtualAgentLocal((p) => ({ ...p, languageAccent: e.target.value }))}
                >
                  {languageAccentOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default StepThree;
