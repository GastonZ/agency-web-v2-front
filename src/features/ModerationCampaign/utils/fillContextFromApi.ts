import type { ModerationCampaignItem, StepOneCtx, AssistantSettingsPayload } from "../../../services/types/moderation-types";
import { mapApiToWizard } from "./mapApiToWizard";

type CtxSetters = {
  setCampaignId?: (id: string) => void;
  setBasics?: (payload: StepOneCtx) => void;
  setChannels?: (arr: Array<"instagram"|"facebook"|"whatsapp"|"email"|"x">) => void;
  setAssistant?: (payload: AssistantSettingsPayload) => void;
};

export function fillContextFromApi(
  apiItem: ModerationCampaignItem,
  setters: CtxSetters
) {
  const data = mapApiToWizard(apiItem);

  setters.setCampaignId?.(data.campaignId!);
  setters.setBasics?.(data.stepOne);
  setters.setChannels?.(data.channels as any);
  setters.setAssistant?.(data.assistant);
}
