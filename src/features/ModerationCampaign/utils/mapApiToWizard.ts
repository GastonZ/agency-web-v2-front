import type {
  ModerationCampaignItem,
  StepOneCtx,
  AssistantSettingsPayload,
} from "../../../services/types/moderation-types";

export type WizardHydrated = {
  campaignId?: string;
  stepOne: StepOneCtx;
  channels: Array<"instagram" | "facebook" | "whatsapp" | "email" | "x">;
  assistant: AssistantSettingsPayload;
};

function normalizeGender(apiGender?: string): string | undefined {
  if (!apiGender) return undefined;
  const g = apiGender.toLowerCase();
  if (g === "m" || g === "male" || g === "hombre") return "male";
  if (g === "f" || g === "female" || g === "mujer") return "female";
  if (g === "todos" || g === "all" || g === "other" || g === "otro") return "other";
  return "other";
}

export function mapApiToWizard(c: ModerationCampaignItem): WizardHydrated {
  const geoArr = Array.isArray(c?.audience?.geo) ? c.audience.geo : [];
  const geo0 = geoArr?.[0];

  const stepOne: StepOneCtx = {
    name: c.name,
    goal: c.objective ?? "",
    summary: c.description ?? "",
    leadDefinition: c.leadDefinition ?? "",

    audience: {
      geo: {
        country: geo0?.countryId ?? "",
        countryCode: geo0?.countryId ?? "",
        region: geo0?.stateId ?? "",
        regionCode: geo0?.stateId ?? "",
        city: geo0?.city ?? "",
        postalCode: geo0?.postalCode ?? "",
      },
      demographic: {
        ageGroups: Array.isArray(c?.audience?.demographics?.age)
          ? c.audience!.demographics!.age
          : [],
        gender: normalizeGender(c?.audience?.demographics?.gender),
        socioeconomic: Array.isArray(c?.audience?.demographics?.nse)
          ? c.audience!.demographics!.nse
          : [],
      },
      cultural: c?.audience?.culturalInterests ?? "",
    },

    tone: (c as any).communicationTone ?? "informal",
    customTone: (c as any).communicationToneOther ?? "",
  };

  const assistant: AssistantSettingsPayload = {
    assistantName: c.assistantName ?? "",
    greeting: c.greeting ?? "",
    conversationLogic: c.conversationLogic ?? "",
    voiceConfig: (c as any).voiceConfig,


    knowHow: Array.isArray(c.knowHow) ? c.knowHow : [],
    respondOnlyRelatedTo: c.respondOnlyRelatedTo ?? "",
    humanEscalation: Array.isArray(c.humanEscalation) ? c.humanEscalation : [],
    escalationContactNumber: c.escalationContactNumber ?? "",

    calendars: (c as any).calendars ?? [],
  };

  return {
    campaignId: c.id,
    stepOne,
    channels: (Array.isArray(c.channels) ? c.channels : []) as WizardHydrated["channels"],
    assistant,
  };
}
