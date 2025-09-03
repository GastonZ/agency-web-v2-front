import type { ModerationCampaignItem, StepOneCtx, AssistantSettingsPayload } from "../../../services/types/moderation-types";

export type WizardHydrated = {
  campaignId?: string;
  stepOne: StepOneCtx;
  channels: StepOneCtx["dates"] extends infer _ ? Array<"instagram"|"facebook"|"whatsapp"|"email"|"x"> : Array<string>;
  assistant: AssistantSettingsPayload;
};

export function mapApiToWizard(c: ModerationCampaignItem): WizardHydrated {

  const geoArr = Array.isArray(c?.audience?.geo) ? c.audience.geo : [];
  const geo0 = geoArr?.[0];

  const stepOne: StepOneCtx = {
    name: c.name,
    goal: c.objective,
    summary: c.description,
    leadDefinition: c.leadDefinition,
    audience: {
      geo: {
        country: geo0?.countryId,
        countryCode: geo0?.countryId,
        region: geo0?.stateId,
        regionCode: geo0?.stateId,
        city: geo0?.city,
        postalCode: geo0?.postalCode,
      },
      demographic: {
        ageGroups: c?.audience?.demographics?.age ?? [],
        gender: c?.audience?.demographics?.gender,
        socioeconomic: c?.audience?.demographics?.nse ?? [],
      },
      cultural: c?.audience?.culturalInterests,
    },
    tone: c.communicationTone === "other" ? "other" : c.communicationTone,
    customTone: c.communicationTone === "other" ? c.communicationToneOther : undefined,
    dates: {
      start: c.startAt ? c.startAt.slice(0, 10) : undefined, 
      end: c.endAt ? c.endAt.slice(0, 10) : undefined,
    },
  };

  const assistant: AssistantSettingsPayload = {
    assistantName: c.assistantName,
    greeting: c.greeting,
    conversationLogic: c.conversationLogic,
    knowHow: c.knowHow ?? [],
    respondOnlyRelatedTo: c.respondOnlyRelatedTo,
    humanEscalation: c.humanEscalation ?? [],
    escalationContactNumber: c.escalationContactNumber,

    calendars: (c as any).calendars ?? undefined,
  };

  return {
    campaignId: c.id,
    stepOne,
    channels: c.channels ?? [],
    assistant,
  };
}
