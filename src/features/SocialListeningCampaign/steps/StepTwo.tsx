import * as React from "react";
import { GlassCard, SectionTitle } from "../../ModerationCampaign/components/Primitives";
import { Label, TextInput } from "../../ModerationCampaign/components/Primitives";
import { useListening, SOCIAL_SOURCES, MEDIA_SOURCES, LISTENING_LANGS, NOTIFY_CHANNELS } from "../../../context/ListeningContext";
import ToggleSwitch from "../../../components/ui/ToggleSwitch";
import { Trash } from "lucide-react";

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick} className={["px-3 h-9 rounded-full border text-sm",
        active ? "bg-emerald-500/20 border-emerald-400/60" : "bg-white/60 dark:bg-neutral-900/60 border-neutral-300/60 dark:border-neutral-700/60"].join(" ")}>{children}</button>
);

export default function StepTwo() {
    const { data, setKeywords, setNegativeKeywords, removeKeyword, removeNegativeKeyword, setSocialSources, setMediaSources, addSpecificSource, removeSpecificSource, setLanguages, setRange, setNotifications } = useListening();
    const [kw, setKw] = React.useState("");
    const [nkw, setNkw] = React.useState("");
    const [url, setUrl] = React.useState("");


    const addKw = () => { if (kw.trim()) setKeywords([...(data.config.keywords || []), kw.trim()]); setKw(""); };
    const addNkw = () => { if (nkw.trim()) setNegativeKeywords([...(data.config.negativeKeywords || []), nkw.trim()]); setNkw(""); };
    const addUrl = () => { if (url.trim()) addSpecificSource(url.trim()); setUrl(""); };


    const toggleSocial = (s: string) => {
        const set = new Set(data.config.socialSources || []);
        set.has(s as any) ? set.delete(s as any) : set.add(s as any);
        setSocialSources(Array.from(set) as any);
    };
    const toggleMedia = (s: string) => {
        const set = new Set(data.config.mediaSources || []);
        set.has(s as any) ? set.delete(s as any) : set.add(s as any);
        setMediaSources(Array.from(set) as any);
    };
    const toggleLang = (l: string) => {
        const set = new Set(data.config.languages || []);
        set.has(l as any) ? set.delete(l as any) : set.add(l as any);
        setLanguages(Array.from(set) as any);
    };

    return (

        <div className="grid gap-6">
            <GlassCard>
                <SectionTitle title="Palabras clave" subtitle="Principales y negativas (exclusión)" />
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <Label>Principales</Label>
                        <div className="flex gap-2">
                            <TextInput value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Añadir palabra clave" />
                            <button type="button" onClick={addKw} className="px-3 rounded-xl border border-emerald-400/60 bg-emerald-500/20">Agregar</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(data.config.keywords || []).map(k => (
                                <div className="flex items-center rounded-md bg-white/60 dark:bg-neutral-900/60 border border-neutral-300/60 dark:border-neutral-700/60">
                                    <span key={k} className="px-2 py-1 text-xs ">{k}</span>
                                    <span className="cursor-pointer" onClick={ () => removeKeyword(k)}>
                                        <Trash className="h-4 text-red-500"/>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Negativas</Label>
                        <div className="flex gap-2">
                            <TextInput value={nkw} onChange={(e) => setNkw(e.target.value)} placeholder="Añadir palabra excluida" />
                            <button type="button" onClick={addNkw} className="px-3 rounded-xl border border-emerald-400/60 bg-emerald-500/20">Agregar</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(data.config.negativeKeywords || []).map(k => (
                            <div className="flex items-center rounded-md bg-white/60 dark:bg-neutral-900/60 border border-neutral-300/60 dark:border-neutral-700/60">
                                    <span key={k} className="px-2 py-1 text-xs ">{k}</span>
                                    <span className="cursor-pointer" onClick={ () => removeNegativeKeyword(k)}>
                                        <Trash className="h-4 text-red-500"/>
                                    </span>
                                </div>                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>
            <GlassCard>
                <SectionTitle title="Fuentes a monitorear" subtitle="Redes, medios y URLs específicas" />
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <Label>Redes sociales</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {SOCIAL_SOURCES.map(s => (
                                <Pill key={s} active={(data.config.socialSources || []).includes(s)} onClick={() => toggleSocial(s)}>{s}</Pill>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Medios digitales</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {MEDIA_SOURCES.map(s => (
                                <Pill key={s} active={(data.config.mediaSources || []).includes(s)} onClick={() => toggleMedia(s)}>{s}</Pill>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Fuentes específicas (URL)</Label>
                        <div className="flex gap-2">
                            <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://sitio.com/page" />
                            <button type="button" onClick={addUrl} className="px-3 rounded-xl border border-emerald-400/60 bg-emerald-500/20">Agregar</button>
                        </div>
                        <ul className="mt-2 space-y-1">
                            {(data.config.specificSources || []).map(u => (
                                <li key={u} className="flex items-center justify-between text-sm">
                                    <span className="truncate max-w-[75%]">{u}</span>
                                    <button type="button" onClick={() => removeSpecificSource(u)} className="text-xs px-2 py-1 rounded-md border">Quitar</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </GlassCard>

            <GlassCard>
                <SectionTitle title="Idioma y periodo" subtitle="Selecciona idiomas y rango o escucha continua" />
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <Label>Idiomas</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {LISTENING_LANGS.map(l => (
                                <Pill key={l} active={(data.config.languages || []).includes(l)} onClick={() => toggleLang(l)}>{l.toUpperCase()}</Pill>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Inicio</Label>
                        <TextInput type="date" value={data.config.startAt?.slice(0, 10) || ""} onChange={(e) => setRange(e.target.value ? new Date(e.target.value).toISOString() : undefined, data.config.endAt, false)} />
                    </div>
                    <div>
                        <Label>Fin</Label>
                        <TextInput type="date" value={data.config.endAt?.slice(0, 10) || ""} onChange={(e) => setRange(data.config.startAt, e.target.value ? new Date(e.target.value).toISOString() : undefined, false)} />
                        <div className="mt-2 flex items-center gap-2">
                            <ToggleSwitch checked={data.config.continuous} onChange={(v) => setRange(undefined, undefined, v)} label="Escucha continua" />
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard>
                <SectionTitle title="Notificación de finalización" subtitle="Opcional: avísanos cómo contactar" />
                <div className="space-y-3">
                    <ToggleSwitch checked={data.config.notifyWhenReady} onChange={(v) => setNotifications(v, data.config.notifyChannels, data.config.notifyData)} label="Quiero recibir notificación" />
                    {data.config.notifyWhenReady && (
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Canales</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {NOTIFY_CHANNELS.map(c => {
                                        const on = (data.config.notifyChannels || []).includes(c);
                                        return <Pill key={c} active={on} onClick={() => {
                                            const set = new Set(data.config.notifyChannels || []);
                                            on ? set.delete(c) : set.add(c);
                                            setNotifications(true, Array.from(set) as any, data.config.notifyData);
                                        }}>{c}</Pill>;
                                    })}
                                </div>
                            </div>
                            <div>
                                <Label>WhatsApp (E.164)</Label>
                                <TextInput value={data.config.notifyData.whatsapp || ""} onChange={(e) => setNotifications(true, data.config.notifyChannels, { ...data.config.notifyData, whatsapp: e.target.value })} placeholder="+5493810000000" />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <TextInput type="email" value={data.config.notifyData.email || ""} onChange={(e) => setNotifications(true, data.config.notifyChannels, { ...data.config.notifyData, email: e.target.value })} placeholder="correo@dominio.com" />
                            </div>
                        </div>
                    )}
                </div>
            </GlassCard>

        </div>
    )
}