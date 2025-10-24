export function buildInstagramOAuthUrl(campaignId: string) {
    const clientId = import.meta.env.VITE_IG_APP_ID as string;
    const redirectUri = import.meta.env.VITE_IG_REDIRECT_URI as string;

    const scope = [
        "instagram_business_basic",
        "instagram_business_manage_messages",
        "instagram_business_manage_comments",
        "instagram_business_content_publish",
    ].join(",");

    const statePayload = { campaignId, nonce: crypto.randomUUID() };
    const state = encodeURIComponent(btoa(JSON.stringify(statePayload)));

    const authBase = "https://www.facebook.com/v19.0/dialog/oauth";
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        state,
    });

    return `${authBase}?${params.toString()}`;
}
