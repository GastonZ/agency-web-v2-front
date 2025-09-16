import type {
  ModerationCampaignItem,
  StepOneCtx,
} from "../../../services/types/moderation-types";
import { mapApiToWizard } from "./mapApiToWizard";

type CtxSetters = {
  setCampaignId?: (id: string) => void;
  setBasics?: (payload: StepOneCtx) => void;
  setChannels?: (arr: Array<"instagram"|"facebook"|"whatsapp"|"email"|"x">) => void;

  setAssistant?: (payload: { name?: string; greeting?: string; conversationLogic?: string }) => void;
  clearQA?: () => void;
  addQA?: (qa: { question: string; answer: string }) => void;

  setAllowedTopics?: (items: string[]) => void;
  setEscalationItems?: (items: string[]) => void;
  setEscalationPhone?: (phone?: string) => void;

  setCalendarsEnabled?: (v: boolean) => void;
  setCalendars?: (calendars: any[]) => void;
};

export function fillContextFromApi(
  apiItem: ModerationCampaignItem,
  setters: CtxSetters
) {
  const data = mapApiToWizard(apiItem);

  if (data.campaignId) setters.setCampaignId?.(data.campaignId);

  setters.setBasics?.(data.stepOne);

  setters.setChannels?.(data.channels as any);

  const assistant = data.assistant || {};
  setters.setAssistant?.({
    name: assistant.assistantName ?? "",
    greeting: assistant.greeting ?? "",
    conversationLogic: assistant.conversationLogic ?? "",
  });

  if (Array.isArray(assistant.knowHow)) {
    setters.clearQA?.();
    for (const qa of assistant.knowHow) {
      if (qa?.question && qa?.answer) {
        setters.addQA?.({ question: qa.question, answer: qa.answer });
      }
    }
  }

  if (assistant.respondOnlyRelatedTo) {
    const asArr = typeof assistant.respondOnlyRelatedTo === "string"
      ? [assistant.respondOnlyRelatedTo]
      : Array.isArray(assistant.respondOnlyRelatedTo) ? assistant.respondOnlyRelatedTo : [];
    setters.setAllowedTopics?.(asArr.filter(Boolean));
  }

  if (Array.isArray(assistant.humanEscalation)) {
    setters.setEscalationItems?.(assistant.humanEscalation.filter(Boolean));
  }
  if (assistant.escalationContactNumber != null) {
    setters.setEscalationPhone?.(assistant.escalationContactNumber || "");
  }

  const calendars = (assistant as any).calendars;
  if (Array.isArray(calendars)) {
    setters.setCalendarsEnabled?.(calendars.length > 0);
    setters.setCalendars?.(calendars);
  } else {
    setters.setCalendarsEnabled?.(false);
    setters.setCalendars?.([]);
  }
}
