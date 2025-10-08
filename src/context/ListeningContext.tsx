// =============================================
// path: src/context/ListeningContext.tsx
// =============================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { GeoLean } from "../components/features/LocationSelection";

/** ==========================
 * Constantes y tipos base
 * ========================== */
export const LISTENING_STORAGE_KEY = "socialListeningCampaignCtx";

export type SourceSocial = "facebook" | "instagram" | "x" | "tiktok" | "youtube" | "linkedin";
export const SOCIAL_SOURCES: SourceSocial[] = ["facebook", "instagram", "x", "tiktok", "youtube", "linkedin"];

export type SourceMedia = "news" | "blogs" | "forums";
export const MEDIA_SOURCES: SourceMedia[] = ["news", "blogs", "forums"];

export type NotifyChannel = "whatsapp" | "email";
export const NOTIFY_CHANNELS: NotifyChannel[] = ["whatsapp", "email"];

export type ListeningLanguage = "es" | "en" | "pt";
export const LISTENING_LANGS: ListeningLanguage[] = ["es", "en", "pt"];

export type ProfilingDepth = "basic" | "advanced";

export type TextualCaptures = "posts" | "bio" | "comments" | "messages";
export const TEXTUAL_CAPTURE_OPTIONS: TextualCaptures[] = ["posts", "bio", "comments", "messages"];

export type MetadataCapture = "location" | "followers" | "engagement";
export const METADATA_OPTIONS: MetadataCapture[] = ["location", "followers", "engagement"];

export type AIInferred = "political_intent" | "education_level" | "socioeconomic" | "emotion";
export const AI_INFERRED_OPTIONS: AIInferred[] = ["political_intent", "education_level", "socioeconomic", "emotion"];

export type InterestBuckets = "political" | "commercial" | "cultural";
export const INTEREST_OPTIONS: InterestBuckets[] = ["political", "commercial", "cultural"];

/** ==========================
 * Modelo de campaña Listening
 * ========================== */
export interface ListeningBasics {
    name: string;
    objective: string;
    description: string;
    geo: GeoLean;
}

export interface ListeningConfig {
    keywords: string[];               // principales
    negativeKeywords: string[];       // exclusión
    socialSources: SourceSocial[];    // 3.1
    mediaSources: SourceMedia[];      // 3.2
    specificSources: string[];        // 3.3 URLs manuales
    languages: ListeningLanguage[];   // 4
    startAt?: string;                 // 5 rango (ISO)
    endAt?: string;                   // 5
    continuous: boolean;              // 5 escucha continua
    notifyWhenReady: boolean;         // 6
    notifyChannels: NotifyChannel[];  // 6.1
    notifyData: {                     // 6.2
        whatsapp?: string;              // E.164 con código país
        email?: string;
    }
}

export interface ListeningProfiling {
    enabled: boolean;                 // 1
    scope: string;                    // 2 ("Top 50...", etc.)
    depth: ProfilingDepth;            // 3
    allowOsint: boolean;              // 4
    textCaptures: TextualCaptures[];  // 5
    metadata: MetadataCapture[];      // 6
    aiInferred: AIInferred[];         // 7
    interests: InterestBuckets[];     // 8
}

export interface ListeningCampaign {
    campaignId?: string;                      // lo pondrá el backend luego
    basics: ListeningBasics;
    config: ListeningConfig;
    profiling: ListeningProfiling;
}

const DEFAULT_CAMPAIGN: ListeningCampaign = {
    campaignId: undefined,
    basics: {
        name: "",
        objective: "",
        description: "",
        geo: { countryId: "", stateId: "", city: "" },
    },
    config: {
        keywords: [],
        negativeKeywords: [],
        socialSources: [],
        mediaSources: [],
        specificSources: [],
        languages: ["es"],
        startAt: undefined,
        endAt: undefined,
        continuous: true,
        notifyWhenReady: false,
        notifyChannels: [],
        notifyData: {},
    },
    profiling: {
        enabled: false,
        scope: "",
        depth: "basic",
        allowOsint: false,
        textCaptures: [],
        metadata: [],
        aiInferred: [],
        interests: [],
    },
};

/** ==========================
 * Persistencia local
 * ========================== */
function revive(raw: string): ListeningCampaign {
    try {
        const p = JSON.parse(raw);
        return {
            ...DEFAULT_CAMPAIGN,
            ...p,
            basics: { ...DEFAULT_CAMPAIGN.basics, ...(p.basics || {}) },
            config: { ...DEFAULT_CAMPAIGN.config, ...(p.config || {}) },
            profiling: { ...DEFAULT_CAMPAIGN.profiling, ...(p.profiling || {}) },
        } as ListeningCampaign;
    } catch { return DEFAULT_CAMPAIGN; }
}

/** ==========================
 * Contexto
 * ========================== */
interface ListeningCtxValue {
    data: ListeningCampaign;
    setCampaignId: (campaignId?: string) => void;

    // Paso 1
    setBasics: (p: Partial<ListeningBasics>) => void;
    setGeo: (p: Partial<GeoLean>) => void;

    // Paso 2
    setConfig: (p: Partial<ListeningConfig>) => void;
    setKeywords: (k: string[]) => void;
    setNegativeKeywords: (k: string[]) => void;
    removeKeyword: (k: string) => void;
    removeNegativeKeyword: (k: string) => void;
    setSocialSources: (s: SourceSocial[]) => void;
    setMediaSources: (s: SourceMedia[]) => void;
    addSpecificSource: (url: string) => void;
    removeSpecificSource: (url: string) => void;
    setLanguages: (langs: ListeningLanguage[]) => void;
    setRange: (start?: string, end?: string, continuous?: boolean) => void;
    setNotifications: (enable: boolean, channels?: NotifyChannel[], data?: ListeningConfig["notifyData"]) => void;

    // Paso 3
    setProfiling: (p: Partial<ListeningProfiling>) => void;
}

const ListeningContext = createContext<ListeningCtxValue | undefined>(undefined);

export const ListeningProvider: React.FC<{
    children: React.ReactNode;
    storageKey?: string;
    autoPersist?: boolean;
    initial?: Partial<ListeningCampaign>;
}> = ({ children, storageKey = LISTENING_STORAGE_KEY, autoPersist = true, initial }) => {
    const [data, setData] = useState<ListeningCampaign>(() => {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
        const base = raw ? revive(raw) : DEFAULT_CAMPAIGN;
        return { ...base, ...initial } as ListeningCampaign;
    });

    useEffect(() => {
        if (!autoPersist || typeof window === "undefined") return;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to persist ListeningContext", e);
        }
    }, [data, autoPersist, storageKey]);

    // ---------- id
    const setCampaignId = useCallback<ListeningCtxValue["setCampaignId"]>((campaignId) => {
        setData((prev) => ({ ...prev, campaignId }));
    }, []);

    // ---------- paso 1
    const setBasics = useCallback<ListeningCtxValue["setBasics"]>((p) => {
        setData((prev) => ({ ...prev, basics: { ...prev.basics, ...p } }));
    }, []);

    const setGeo = useCallback<ListeningCtxValue["setGeo"]>((p) => {
        setData((prev) => ({ ...prev, basics: { ...prev.basics, geo: { ...prev.basics.geo, ...p } } }));
    }, []);

    // ---------- paso 2
    const setConfig = useCallback<ListeningCtxValue["setConfig"]>((p) => {
        setData((prev) => ({ ...prev, config: { ...prev.config, ...p } }));
    }, []);

    const setKeywords = useCallback<ListeningCtxValue["setKeywords"]>((k) => {
        setData((prev) => ({ ...prev, config: { ...prev.config, keywords: Array.from(new Set(k.map(s => s.trim()).filter(Boolean))) } }));
    }, []);

    const setNegativeKeywords = useCallback<ListeningCtxValue["setNegativeKeywords"]>((k) => {
        setData((prev) => ({ ...prev, config: { ...prev.config, negativeKeywords: Array.from(new Set(k.map(s => s.trim()).filter(Boolean))) } }));
    }, []);

    const removeKeyword = useCallback<ListeningCtxValue["removeKeyword"]>((k) => {
        setData(prev => ({ ...prev, config: { ...prev.config, keywords: (prev.config.keywords || []).filter(x => x !== k) } }));
    }, []);


    const removeNegativeKeyword = useCallback<ListeningCtxValue["removeNegativeKeyword"]>((k) => {
        setData(prev => ({ ...prev, config: { ...prev.config, negativeKeywords: (prev.config.negativeKeywords || []).filter(x => x !== k) } }));
    }, []);

    const setSocialSources = useCallback<ListeningCtxValue["setSocialSources"]>((s) => {
        const clean = Array.from(new Set(s.filter((x): x is SourceSocial => SOCIAL_SOURCES.includes(x as SourceSocial))));
        setData((prev) => ({ ...prev, config: { ...prev.config, socialSources: clean } }));
    }, []);

    const setMediaSources = useCallback<ListeningCtxValue["setMediaSources"]>((s) => {
        const clean = Array.from(new Set(s.filter((x): x is SourceMedia => MEDIA_SOURCES.includes(x as SourceMedia))));
        setData((prev) => ({ ...prev, config: { ...prev.config, mediaSources: clean } }));
    }, []);

    const addSpecificSource = useCallback<ListeningCtxValue["addSpecificSource"]>((url) => {
        const u = url.trim();
        if (!u) return;
        setData((prev) => ({ ...prev, config: { ...prev.config, specificSources: Array.from(new Set([...(prev.config.specificSources || []), u])) } }));
    }, []);

    const removeSpecificSource = useCallback<ListeningCtxValue["removeSpecificSource"]>((url) => {
        setData((prev) => ({ ...prev, config: { ...prev.config, specificSources: (prev.config.specificSources || []).filter(x => x !== url) } }));
    }, []);

    const setLanguages = useCallback<ListeningCtxValue["setLanguages"]>((langs) => {
        const clean = Array.from(new Set(langs.filter((x): x is ListeningLanguage => LISTENING_LANGS.includes(x as ListeningLanguage))));
        setData((prev) => ({ ...prev, config: { ...prev.config, languages: clean } }));
    }, []);

    const setRange = useCallback<ListeningCtxValue["setRange"]>((start, end, continuous) => {
        setData((prev) => ({ ...prev, config: { ...prev.config, startAt: start, endAt: end, continuous: !!continuous } }));
    }, []);

    const setNotifications = useCallback<ListeningCtxValue["setNotifications"]>((enable, channels = [], notifyData = {}) => {
        const clean = Array.from(new Set(channels.filter((x): x is NotifyChannel => NOTIFY_CHANNELS.includes(x as NotifyChannel))));
        setData((prev) => ({ ...prev, config: { ...prev.config, notifyWhenReady: enable, notifyChannels: clean, notifyData: { ...prev.config.notifyData, ...notifyData } } }));
    }, []);

    // ---------- paso 3
    const setProfiling = useCallback<ListeningCtxValue["setProfiling"]>((p) => {
        setData((prev) => ({ ...prev, profiling: { ...prev.profiling, ...p } }));
    }, []);

    const value = useMemo<ListeningCtxValue>(() => ({
        data,
        setCampaignId,
        setBasics,
        setGeo,
        setConfig,
        setKeywords,
        setNegativeKeywords,
        setSocialSources,
        setMediaSources,
        addSpecificSource,
        removeSpecificSource,
        setLanguages,
        setRange,
        setNotifications,
        setProfiling,
        removeKeyword,
        removeNegativeKeyword
    }), [data, setCampaignId, setBasics, setGeo, setConfig, setKeywords, setNegativeKeywords, removeKeyword, removeNegativeKeyword, setSocialSources, setMediaSources, addSpecificSource, removeSpecificSource, setLanguages, setRange, setNotifications, setProfiling]);

    return <ListeningContext.Provider value={value}>{children}</ListeningContext.Provider>;
};

export const useListening = () => {
    const ctx = useContext(ListeningContext);
    if (!ctx) throw new Error("useListening debe usarse dentro de <ListeningProvider>");
    return ctx;
};
