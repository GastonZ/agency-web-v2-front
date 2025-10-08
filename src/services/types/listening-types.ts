import { getUserId, prune } from "../../utils/helper";
import type { GeoLean } from "../../components/features/LocationSelection";

export type ListeningCampaignUpdateResponse = { id: string };

export type SocialNetworkSource = "facebook" | "instagram" | "x" | "tiktok" | "youtube" | "linkedin";
export type DigitalMediaSource = "news" | "blogs" | "forums";
export type ListeningLanguage = "es" | "en" | "pt";
export type NotifyChannel = "whatsapp" | "email";
export type ProfilingDepth = "basic" | "advanced";

export type ListeningCampaignCreateRequest = {
    userId: string;
    name: string;
    objective?: string;
    description?: string;
    geographicSegmentation?: Array<{
        countryId?: string;
        stateId?: string;
        city?: string;
        postalCode?: string;
    }>;
    status?: "draft" | "active" | "inactive" | "archived";
};

export type ListeningCampaignCreateResponse = { id: string };


export type ListeningStepOneCtx = {
    name?: string;
    objective?: string;
    description?: string;
    geo?: GeoLean; // a una entrada del array geographicSegmentation
    status?: "draft" | "active" | "inactive" | "archived";
};

export function buildListeningCreatePayload(
    ctx: ListeningStepOneCtx,
    opts?: { includeUserId?: boolean }
): ListeningCampaignCreateRequest {
    const userId = getUserId();
    return prune({
        ...(opts?.includeUserId ? { userId } : {}),
        name: ctx.name || "",
        objective: ctx.objective || undefined,
        description: ctx.description || undefined,
        geographicSegmentation: ctx.geo
            ? [
                prune({
                    countryId: ctx.geo.countryId,
                    stateId: ctx.geo.stateId,
                    city: ctx.geo.city,
                    // postalCode: opcional (no lo exponemos en GeoLean por ahora)
                }),
            ]
            : undefined,
        status: ctx.status || "draft",
    });
}

export type ListeningConfigPayload = {
    mainKeywords: string[];
    negativeKeywords?: string[];
    socialNetworkSources?: SocialNetworkSource[];
    digitalMediaSources?: DigitalMediaSource[];
    specificSources?: string[]; // URLs
    languages?: ListeningLanguage[];
    searchStartDate?: string; // ISO
    searchEndDate?: string; // ISO
    continuousListening?: boolean;
    enableNotifications?: boolean;
    notificationChannels?: NotifyChannel[];
    whatsappContact?: string; // E.164
    emailContact?: string;
};


// ---- Step 3: Profiling Config ----
export type ProfilingConfigPayload = {
    enableProfiling?: boolean;
    profilingScope?: number; // FIX: number (1000-10000)
    profilingDepth?: ProfilingDepth;
    enableExternalOSINT?: boolean;
    textualDataCapture?: Array<"posts" | "messages" | "bio" | "comments">;
    contextualMetadata?: Array<"location" | "followers" | "engagement">;
    aiInferredFields?: Array<"political_intent" | "emotion" | "education_level" | "socioeconomic">;
    interestsAndAffinities?: Array<"political" | "commercial" | "cultural">;
    reachLimit?: number;
};


// ---- Minimal item model (read/search) ----
export type ListeningCampaignItem = {
    id: string;
    user: { id: string; email: string };
    name: string;
    objective?: string;
    description?: string;
    audience?: { geo?: { countryId?: string; stateId?: string; city?: string } };
    keywords?: string[];
    negativeKeywords?: string[];
    socialSources?: SocialNetworkSource[];
    mediaSources?: DigitalMediaSource[];
    specificSources?: string[];
    languages?: ListeningLanguage[];
    startAt?: string;
    endAt?: string;
    continuous?: boolean;
    notifyWhenReady?: boolean;
    notifyChannels?: NotifyChannel[];
    notifyData?: { whatsapp?: string; email?: string };
    profiling?: {
        enabled?: boolean;
        scope?: number; // FIX aplicado aquí también
        depth?: ProfilingDepth;
        allowOsint?: boolean;
        textCaptures?: Array<"posts" | "bio" | "comments" | "messages">;
        metadata?: Array<"location" | "followers" | "engagement">;
        aiInferred?: Array<"political_intent" | "education_level" | "socioeconomic" | "emotion">;
        interests?: Array<"political" | "commercial" | "cultural">;
    };
    status?: string;
};

export type ListeningCampaignSearchResponse = {
    page: number;
    pageSize: number;
    total: number;
    items: ListeningCampaignItem[];
};