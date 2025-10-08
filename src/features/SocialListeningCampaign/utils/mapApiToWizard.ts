import type { ListeningCampaignItem, ListeningConfigPayload, ProfilingConfigPayload } from "../../../services/types/listening-types";
import type { ListeningStepOneCtx } from "../../../services/types/listening-types";


export type WizardHydrated = {
    campaignId?: string;
    stepOne: ListeningStepOneCtx;
    stepTwo: ListeningConfigPayload;
    stepThree: ProfilingConfigPayload;
};


export function mapApiToWizard(c: ListeningCampaignItem): WizardHydrated {
    const geoArr = Array.isArray((c as any)?.audience?.geo) ? (c as any).audience.geo : [];
    const geo0 = geoArr?.[0] || {};


    const stepOne: ListeningStepOneCtx = {
        name: c.name,
        objective: c.objective ?? "",
        description: c.description ?? "",
        geo: {
            countryId: geo0.countryId ?? "",
            stateId: geo0.stateId ?? "",
            city: geo0.city ?? "",
            postalCode: geo0.postalCode ?? "",
        },
        status: (c as any).status ?? "draft",
    } as any;


    const stepTwo: ListeningConfigPayload = {
        mainKeywords: Array.isArray(c.keywords) ? c.keywords : [],
        negativeKeywords: Array.isArray(c.negativeKeywords) ? c.negativeKeywords : [],
        socialNetworkSources: Array.isArray(c.socialSources) ? c.socialSources as any : [],
        digitalMediaSources: Array.isArray(c.mediaSources) ? c.mediaSources as any : [],
        specificSources: Array.isArray(c.specificSources) ? c.specificSources : [],
        languages: Array.isArray(c.languages) ? c.languages as any : [],
        searchStartDate: c.startAt,
        searchEndDate: c.endAt,
        continuousListening: c.continuous,
        enableNotifications: c.notifyWhenReady,
        notificationChannels: Array.isArray(c.notifyChannels) ? c.notifyChannels as any : [],
        whatsappContact: c?.notifyData?.whatsapp,
        emailContact: c?.notifyData?.email,
    };


    const stepThree: ProfilingConfigPayload = {
        enableProfiling: (c as any)?.profiling?.enabled ?? false,
        profilingScope: (c as any)?.profiling?.scope ?? 5000,
        profilingDepth: (c as any)?.profiling?.depth ?? "advanced",
        enableExternalOSINT: (c as any)?.profiling?.allowOsint ?? true,
        textualDataCapture: (c as any)?.profiling?.textCaptures ?? ["posts", "messages", "bio"],
        contextualMetadata: (c as any)?.profiling?.metadata ?? ["location", "followers", "engagement"],
        aiInferredFields: (c as any)?.profiling?.aiInferred ?? ["political_intent", "emotion", "education_level", "socioeconomic"],
        interestsAndAffinities: (c as any)?.profiling?.interests ?? ["political", "commercial", "cultural"],
        reachLimit: (c as any)?.reachLimit ?? 5000,
    };


    return { campaignId: c.id, stepOne, stepTwo, stepThree };
}