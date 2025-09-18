import type { MarketingCampaign } from "../../../context/MarketingContext";

export type MarketingApiItem = any;

export function mapApiToWizardMarketing(c: MarketingApiItem): Partial<MarketingCampaign> {
  const geo0 = Array.isArray(c?.audience?.geo) ? c.audience.geo[0] : undefined;

  const publishingSchedule = {
    activeDays: Array.isArray(c?.publishingSchedule?.activeDays) ? c.publishingSchedule.activeDays : [],
    timeSlots: typeof c?.publishingSchedule?.timeSlots === "object" && c.publishingSchedule.timeSlots
      ? c.publishingSchedule.timeSlots
      : { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] },
    timezone: c?.publishingSchedule?.timezone,
  };

  const persistedImages: string[] = Array.isArray(c?.referenceImages) ? c.referenceImages : [];

  const influencerType =
    (c?.influencerSelectionType as "catalog" | "own_account" | "virtual_ai") ||
    (c?.influencerType as "catalog" | "own_account" | "virtual_ai") ||
    "own_account";

  const platforms = Array.isArray(c?.scrappingConfig?.platforms) ? c.scrappingConfig.platforms : [];
  const minFollowers = Number(c?.scrappingConfig?.filters?.minFollowers || 0);
  const connectedSocialAccounts = Array.isArray(c?.connectedSocialAccounts) ? c.connectedSocialAccounts : [];
  const referenceDocuments = Array.isArray(c?.referenceDocuments) ? c.referenceDocuments : [];

  const hydrated: Partial<MarketingCampaign> = {
    campaignId: c?.id,
    basics: {
      name: c?.name || "",
      campaignType: c?.campaignType || "venta",
      businessType: c?.businessType || "B2C",
      objective: c?.objective || "",
      mainMessage: c?.mainMessage || "",
      description: c?.description || "",
      leadDefinition: c?.leadDefinition || "",
    },
    audience: {
      geo: {
        countryId: geo0?.countryId || "",
        stateId: geo0?.stateId || "",
        city: geo0?.city || "",
      },
      cultural: c?.audience?.culturalInterests || "",
    },
    tone: (c?.communicationTone as any) || "informal",
    customTone: c?.communicationToneOther || "",
    channels: Array.isArray(c?.channels) ? c.channels : [],

    // Paso 2
    content: {
      topics: Array.isArray(c?.topics) ? c.topics : [],
      contentTypes: Array.isArray(c?.contentTypes) ? c.contentTypes : [],
      referenceImages: [],        
      persistedImages,          
      publishingSchedule,
    },

    // Paso 3
    influencerType,
    selectedInfluencerId: c?.selectedInfluencerId || null,
    influencerSelectionNotes: c?.influencerSelectionNotes || "",

    // Paso 4
    channelsContacts: {
      platforms,
      connectedSocialAccounts,
      minFollowers,
      advertisingBudget: Number(c?.advertisingBudget || 2000),
      referenceDocuments,
    },
  };

  return hydrated;
}
