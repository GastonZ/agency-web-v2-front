import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, TextArea } from "../../ModerationCampaign/components/Primitives"
import InfluencerCarousel, { type CatalogInfluencer } from "../components/InfluencerCarousel";

export const InfluencerTypes = {
  OWN: "own",
  CATALOG: "catalog",
  VIRTUAL_AI: "virtual_ai",
} as const;
export type InfluencerType = typeof InfluencerTypes[keyof typeof InfluencerTypes];

export type VirtualAgentConfig = {
  description: string;
  referenceImage?: File | null;
  appearance?: string;
  style?: string;
  personality?: string;
  languageAccent?: string;
};

type Props = {
  initialType?: InfluencerType;
  initialCatalogId?: string | null;
  initialVirtual?: Partial<VirtualAgentConfig>;
  onChange?: (state: {
    influencerType: InfluencerType;
    catalogId: string | null;
    virtualAgent: VirtualAgentConfig | null;
  }) => void;
};

const dummyCatalog: CatalogInfluencer[] = [
  {
    id: "inf_1",
    name: "Luna Vega",
    avatar: "https://i1.sndcdn.com/artworks-a97bKtSqgVNU2sM9-0enDuQ-t1080x1080.jpg",
    niches: ["lifestyle", "fitness"],
    followers: "120k",
    description: "Creadora lifestyle con foco en hábitos saludables y rutinas.",
  },
  {
    id: "inf_2",
    name: "Tomás Ferro",
    avatar: "https://i1.sndcdn.com/artworks-a97bKtSqgVNU2sM9-0enDuQ-t1080x1080.jpg",
    niches: ["tech", "gaming"],
    followers: "95k",
    description: "Tech/gaming reviews con estilo cercano y educativo.",
  },
  {
    id: "inf_3",
    name: "Nadia Sol",
    avatar: "https://i1.sndcdn.com/artworks-a97bKtSqgVNU2sM9-0enDuQ-t1080x1080.jpg",
    niches: ["moda", "beauty"],
    followers: "210k",
    description: "Moda y beauty; tutoriales rápidos y tendencias.",
  },
];

const appearanceOptions = ["Realista", "Anime", "Low-poly"] as const;
const styleOptions = ["Profesional", "Amigable", "Irónico"] as const;
const personalityOptions = ["Serena", "Enérgica", "Extrovertida"] as const;
const languageAccentOptions = ["Español (AR)", "Español (MX)", "Inglés (US)"] as const;

const StepThree: React.FC<Props> = ({
  initialType = InfluencerTypes.OWN,
  initialCatalogId = null,
  initialVirtual,
  onChange,
}) => {
  const [influencerType, setInfluencerType] = React.useState<InfluencerType>(initialType);
  const [catalogId, setCatalogId] = React.useState<string | null>(initialCatalogId);
  const [virtualAgent, setVirtualAgent] = React.useState<VirtualAgentConfig>({
    description: initialVirtual?.description || "",
    referenceImage: null,
    appearance: initialVirtual?.appearance || appearanceOptions[0],
    style: initialVirtual?.style || styleOptions[0],
    personality: initialVirtual?.personality || personalityOptions[0],
    languageAccent: initialVirtual?.languageAccent || languageAccentOptions[0],
  });
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    onChange?.({
      influencerType,
      catalogId: influencerType === InfluencerTypes.CATALOG ? catalogId : null,
      virtualAgent:
        influencerType === InfluencerTypes.VIRTUAL_AI
          ? virtualAgent
          : null,
    });
  }, [influencerType, catalogId, virtualAgent, onChange]);

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
    const active = influencerType === id;
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

  return (
    <div className="space-y-4">
      {/* Selector de tipo */}
      <GlassCard>
        <SectionTitle title="Tipo de influencer" subtitle="Elegí una sola opción" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <OptionCard
            id={InfluencerTypes.OWN}
            title="Propio"
            subtitle="Usarás un influencer/cuenta propia."
          />
          <OptionCard
            id={InfluencerTypes.CATALOG}
            title="Catálogo"
            subtitle="Seleccioná desde un listado de influencers."
          />
          <OptionCard
            id={InfluencerTypes.VIRTUAL_AI}
            title="Virtual IA"
            subtitle="Crearemos un agente con identidad propia."
          />
        </div>
      </GlassCard>

      {/* Mensaje para “Propio” */}
      {influencerType === InfluencerTypes.OWN && (
        <GlassCard>
          <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-400/30">
            <p className="text-sm">
              Al finalizar la creación vas a poder configurar y conectar tu cuenta/influencer propio.
            </p>
          </div>
        </GlassCard>
      )}

      {/* Catálogo con carrusel */}
      {influencerType === InfluencerTypes.CATALOG && (
        <GlassCard>
          <SectionTitle title="Catálogo" subtitle="Elegí un influencer sugerido (demo)" />
          <InfluencerCarousel
            items={dummyCatalog}
            selectedId={catalogId || undefined}
            onSelect={(id) => setCatalogId(id)}
          />
        </GlassCard>
      )}

      {/* Virtual IA: configuración del agente */}
      {influencerType === InfluencerTypes.VIRTUAL_AI && (
        <GlassCard>
          <SectionTitle title="Configurar agente virtual" subtitle="Definí rasgos y referencia visual (opcional)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Descripción del agente</Label>
              <TextArea
                rows={4}
                placeholder="Ej: Presentadora carismática, tono amigable, foco en moda sostenible…"
                value={virtualAgent.description}
                onChange={(e) => setVirtualAgent((p) => ({ ...p, description: e.target.value }))}
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
                    const f = e.target.files?.[0];
                    setVirtualAgent((p) => ({ ...p, referenceImage: f || null }));
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
              <div>
                <Label>Apariencia</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.appearance}
                  onChange={(e) => setVirtualAgent((p) => ({ ...p, appearance: e.target.value }))}
                >
                  {appearanceOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Estilo</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.style}
                  onChange={(e) => setVirtualAgent((p) => ({ ...p, style: e.target.value }))}
                >
                  {styleOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Personalidad</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.personality}
                  onChange={(e) => setVirtualAgent((p) => ({ ...p, personality: e.target.value }))}
                >
                  {personalityOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Idioma y acento</Label>
                <select
                  className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                  value={virtualAgent.languageAccent}
                  onChange={(e) => setVirtualAgent((p) => ({ ...p, languageAccent: e.target.value }))}
                >
                  {languageAccentOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
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
