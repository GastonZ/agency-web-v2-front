// src/voice/useNavigationTools.ts
export function useNavigationTools() {
    const goToCampaignSelection = () => { window.location.href = "/campaign_selection";return { success: true, route: "/campaign_selection" }};
    const goToMyCampaigns = () => { window.location.href = "/my_campaigns";return { success: true, route: "/my_campaigns" }};
    const goToMarketingCreation = () => { window.location.href = "/campaign_marketing_creation"; return { success: true }};
    const goToModerationCreation = () => { window.location.href = "/campaign_moderation_creation"; return { success: true }};
    const goToListeningCreation = () => { window.location.href = "/campaign_listening_creation"; return { success: true }};
    return { goToCampaignSelection, goToMyCampaigns, goToMarketingCreation, goToModerationCreation, goToListeningCreation };
}
