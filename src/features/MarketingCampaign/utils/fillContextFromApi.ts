import { mapApiToWizardMarketing, type MarketingApiItem } from "./mapApiToWizard";
import type { MarketingCampaign, Channel, DayOfWeek, TimeRange } from "../../../context/MarketingContext";

type Setters = {
  setCampaignId?: (id: string) => void;

  // paso 1
  setBasics?: (p: Partial<MarketingCampaign["basics"]>) => void;
  setGeo?: (p: Partial<MarketingCampaign["audience"]["geo"]>) => void; // <- FIX typo
  setAudience?: (p: Partial<MarketingCampaign["audience"]>) => void;
  setTone?: (tone: MarketingCampaign["tone"], customTone?: string) => void;
  setChannels?: (arr: Channel[]) => void;

  // paso 2
  setTopics?: (topics: string[]) => void;
  setContentTypes?: (types: MarketingCampaign["content"]["contentTypes"]) => void;
  setPersistedImages?: (paths: string[]) => void;
  setReferenceImages?: (urls: string[]) => void;
  setPublishingSchedule?: (s: MarketingCampaign["content"]["publishingSchedule"]) => void;

  // paso 3
  setInfluencerType?: (t: MarketingCampaign["influencerType"]) => void;
  setCatalogInfluencer?: (id: string | null, notes?: string) => void;

  // paso 4
  setPlatforms?: (arr: Channel[]) => void;
  setAdvertisingBudget?: (n: number) => void;
  setReferenceDocuments?: (names: string[]) => void;
  addConnectedAccount?: (acc: string) => void;
  setMinFollowers?: (n: number) => void;
};

export function fillContextFromApiMarketing(apiItem: MarketingApiItem, setters: Setters) {
  const data = mapApiToWizardMarketing(apiItem);

  if (data.campaignId) setters.setCampaignId?.(data.campaignId);

  // Paso 1
  if (data.basics) setters.setBasics?.(data.basics);
  if (data.audience?.geo) setters.setGeo?.(data.audience.geo);
  if (typeof data.audience?.cultural === "string") {
    setters.setAudience?.({ cultural: data.audience.cultural });
  }
  if (data.tone) setters.setTone?.(data.tone, data.customTone || "");
  if (Array.isArray(data.channels)) setters.setChannels?.(data.channels as Channel[]);

  // Paso 2
  if (Array.isArray(data.content?.topics)) setters.setTopics?.(data.content.topics);
  if (Array.isArray(data.content?.contentTypes)) setters.setContentTypes?.(data.content.contentTypes);
  if (Array.isArray(data.content?.persistedImages)) setters.setPersistedImages?.(data.content.persistedImages);

  // no re-cargar las pending a menos que quieras
  setters.setReferenceImages?.([]);

  if (data.content?.publishingSchedule) {
    setters.setPublishingSchedule?.({
      activeDays: (data.content.publishingSchedule.activeDays || []) as DayOfWeek[],
      timeSlots: (data.content.publishingSchedule.timeSlots ||
        { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] }) as Record<DayOfWeek, TimeRange[]>,
      timezone: data.content.publishingSchedule.timezone,
    });
  }

  // Paso 3
  if (data.influencerType) setters.setInfluencerType?.(data.influencerType);
  if (data.influencerType === "catalog") {
    setters.setCatalogInfluencer?.(data.selectedInfluencerId || null, data.influencerSelectionNotes || "");
  } else {
    setters.setCatalogInfluencer?.(null, "");
  }

  // Paso 4
  if (Array.isArray(data.channelsContacts?.platforms)) {
    setters.setPlatforms?.(data.channelsContacts.platforms as Channel[]);
  }
  if (typeof data.channelsContacts?.advertisingBudget === "number") {
    setters.setAdvertisingBudget?.(data.channelsContacts.advertisingBudget);
  }
  if (Array.isArray(data.channelsContacts?.referenceDocuments)) {
    setters.setReferenceDocuments?.(data.channelsContacts.referenceDocuments);
  }
  if (Array.isArray(data.channelsContacts?.connectedSocialAccounts)) {
    for (const acc of data.channelsContacts.connectedSocialAccounts) {
      setters.addConnectedAccount?.(acc);
    }
  }
  if (typeof data.channelsContacts?.minFollowers === "number") {
    setters.setMinFollowers?.(data.channelsContacts.minFollowers);
  }
}
