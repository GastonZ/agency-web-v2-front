export function useNavigationTools() {
  return {
    goToCampaignSelection: () => { window.location.href = "/campaign_selection"; return { success:true }; },
    goToMyCampaigns:       () => { window.location.href = "/my_campaigns";       return { success:true }; },
    goToListeningCreation: () => { window.location.href = "/campaign_listening_creation";  return { success:true }; },
    goToMarketingCreation: () => { window.location.href = "/campaign_marketing_creation";  return { success:true }; },
    goToModerationCreation:() => { window.location.href = "/campaign_moderation_creation"; return { success:true }; },
  };
}

export const navTools = [
  { type: "function", name: "goToCampaignSelection", description: "Ir a /campaign_selection", parameters: { type: "object", properties: {} } },
  { type: "function", name: "goToMyCampaigns",       description: "Ir a /my_campaigns",       parameters: { type: "object", properties: {} } },
  { type: "function", name: "goToListeningCreation",  description: "Ir a /campaign_listening_creation",  parameters: { type: "object", properties: {} } },
  { type: "function", name: "goToMarketingCreation",  description: "Ir a /campaign_marketing_creation",  parameters: { type: "object", properties: {} } },
  { type: "function", name: "goToModerationCreation", description: "Ir a /campaign_moderation_creation", parameters: { type: "object", properties: {} } },
] as const;