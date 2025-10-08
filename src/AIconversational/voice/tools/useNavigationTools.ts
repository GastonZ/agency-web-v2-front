// src/voice/useNavigationTools.ts
export function useNavigationTools() {
    const goToCampaignSelection = () => {
        window.location.href = "/campaign_selection";
        return { success: true, route: "/campaign_selection" };
    };
    const goToMyCampaigns = () => {
        window.location.href = "/my_campaigns";
        return { success: true, route: "/my_campaigns" };
    };
    return { goToCampaignSelection, goToMyCampaigns };
}
