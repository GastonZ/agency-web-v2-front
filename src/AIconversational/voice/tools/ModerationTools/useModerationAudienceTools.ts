import { useModeration } from "../../../../context/ModerationContext";

export function useModerationAudienceTools() {
    const { setAudience } = useModeration();

    function updateModerationAudienceCultural({ cultural }: { cultural: string }) {
        const val = (cultural || "").trim();
        if (!val) return { success: false, message: "Falta 'cultural'." };
        setAudience({ cultural: val });
        return { success: true, cultural: val };
    }

    return { updateModerationAudienceCultural };
}
