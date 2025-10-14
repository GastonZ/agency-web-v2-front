import { useNavigate } from "react-router-dom";
import type { ToolSpec } from "../types";

// Sólo los schemas (sin lógica) — iguales que antes
export const navTools: ToolSpec[] = [
  { type: "function", name: "goToCampaignSelection", description: "Ir a /campaign_selection", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "goToMyCampaigns",       description: "Ir a /my_campaigns",       parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "goToListeningCreation",  description: "Ir a /campaign_listening_creation",  parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "goToMarketingCreation",  description: "Ir a /campaign_marketing_creation",  parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "goToModerationCreation", description: "Ir a /campaign_moderation_creation", parameters: { type: "object", properties: {}, additionalProperties: false } },
];

export function useNavigationTools() {
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    return { success: true, path };
  };

  return {
    goToCampaignSelection: () => go("/campaign_selection"),
    goToMyCampaigns:       () => go("/my_campaigns"),
    goToListeningCreation: () => go("/campaign_listening_creation"),
    goToMarketingCreation: () => go("/campaign_marketing_creation"),
    goToModerationCreation:() => go("/campaign_moderation_creation"),
  };
}
