import * as React from "react";
import { GlassCard, SectionTitle } from "../../ModerationCampaign/components/Primitives";
import { Label, TextInput } from "../../ModerationCampaign/components/Primitives";
import { useListening, TEXTUAL_CAPTURE_OPTIONS, METADATA_OPTIONS, AI_INFERRED_OPTIONS, INTEREST_OPTIONS } from "../../../context/ListeningContext";
import ToggleSwitch from "../../../components/ui/ToggleSwitch";


const CheckGrid: React.FC<{ values: string[]; onToggle: (v: string) => void; options: string[] }> = ({ values, onToggle, options }) => (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {options.map(o => (
            <label key={o} className="flex items-center gap-2 text-sm">
                <input checked={values.includes(o)} onChange={() => onToggle(o)} type="checkbox" className="accent-emerald-500" /> {o}
            </label>
        ))}
    </div>
);

export default function StepThree() {
    const { data, setProfiling } = useListening();


    const toggleFrom = (key: "textCaptures" | "metadata" | "aiInferred" | "interests") => (v: string) => {
        const set = new Set((data.profiling as any)[key] as string[]);
        set.has(v) ? set.delete(v) : set.add(v);
        setProfiling({ [key]: Array.from(set) } as any);
    };


    return (
        <div className="grid gap-6">
            <GlassCard>
                <SectionTitle title="Perfilado" subtitle="Configura el nivel y el alcance del perfilado" />
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <Label>Activar perfilado</Label>
                        <div className="mt-2"><ToggleSwitch checked={data.profiling.enabled} onChange={(v) => setProfiling({ enabled: v })} label={data.profiling.enabled ? "Activado" : "Desactivado"} /></div>
                    </div>
                    <div className="md:col-span-1">
                        <Label>Alcance</Label>
                        <TextInput value={data.profiling.scope} onChange={(e) => setProfiling({ scope: e.target.value })} placeholder="Ej: Top 50 influenciadores" />
                    </div>
                    <div className="md:col-span-1">
                        <Label>Nivel de profundidad</Label>
                        <div className="mt-2 flex gap-2">
                            {(["basic", "advanced"] as const).map(d => (
                                <button key={d} type="button" onClick={() => setProfiling({ depth: d })} className={["px-3 h-9 rounded-full border text-sm", data.profiling.depth === d ? "bg-emerald-500/20 border-emerald-400/60" : "bg-white/60 dark:bg-neutral-900/60 border-neutral-300/60 dark:border-neutral-700/60"].join(" ")}>{d}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>


            <GlassCard>
                <SectionTitle title="OSINT externo" subtitle="Habilita cruce con bases públicas" />
                <ToggleSwitch checked={data.profiling.allowOsint} onChange={(v) => setProfiling({ allowOsint: v })} label={data.profiling.allowOsint ? "Permitido" : "No permitido"} />
            </GlassCard>


            <GlassCard>
                <SectionTitle title="Datos textuales a capturar" subtitle="Posts, biografía, comentarios, mensajes" />
                <CheckGrid values={data.profiling.textCaptures as any} onToggle={toggleFrom("textCaptures")} options={TEXTUAL_CAPTURE_OPTIONS as any} />
            </GlassCard>


            <GlassCard>
                <SectionTitle title="Metadatos contextuales" subtitle="Ubicación, seguidores/seguidos, engagement" />
                <CheckGrid values={data.profiling.metadata as any} onToggle={toggleFrom("metadata")} options={METADATA_OPTIONS as any} />
            </GlassCard>


            <GlassCard>
                <SectionTitle title="Campos inferidos por IA" subtitle="Intención política, nivel educativo, NSE, emociones" />
                <CheckGrid values={data.profiling.aiInferred as any} onToggle={toggleFrom("aiInferred")} options={AI_INFERRED_OPTIONS as any} />
            </GlassCard>


            <GlassCard>
                <SectionTitle title="Intereses y afinidades" subtitle="Políticos, comerciales, culturales" />
                <CheckGrid values={data.profiling.interests as any} onToggle={toggleFrom("interests")} options={INTEREST_OPTIONS as any} />
            </GlassCard>
        </div>
    );
}