import type { ListeningCampaignItem } from "../../../services/types/listening-types";
import type { ListeningStepOneCtx, ListeningConfigPayload, ProfilingConfigPayload } from "../../../services/types/listening-types";
import { mapApiToWizard } from "./mapApiToWizard";


export type CtxSetters = {
    setCampaignId?: (id: string) => void;
    setStepOne?: (v: ListeningStepOneCtx) => void;
    setListeningConfig?: (v: ListeningConfigPayload) => void;
    setProfilingConfig?: (v: ProfilingConfigPayload) => void;
};


export function fillContextFromApi(apiItem: ListeningCampaignItem, setters: CtxSetters) {
    const data = mapApiToWizard(apiItem);
    if (data.campaignId) setters.setCampaignId?.(data.campaignId);
    setters.setStepOne?.(data.stepOne);
    setters.setListeningConfig?.(data.stepTwo);
    setters.setProfilingConfig?.(data.stepThree);
}