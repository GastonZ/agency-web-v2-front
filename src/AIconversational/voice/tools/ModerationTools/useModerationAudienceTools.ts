import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

type Lang = "es" | "en";
const normalizeLang = (raw?: string): Lang =>
    raw && raw.toLowerCase().startsWith("en") ? "en" : "es";

export function useModerationAudienceTools() {
    const { setAudience } = useModeration();
    const { i18n } = useTranslation();
    const langDefault = (i18n?.language as string) || "es";

    function updateModerationAudienceCultural({ cultural, language }: { cultural: string; language?: string }) {
        const val = (cultural || "").trim();
        const lang = normalizeLang(language || langDefault);
        if (!val) return {
            success: false,
            message: lang === "en" ? "The 'cultural' segment is missing." : "Falta 'cultural'.",
        };
        setAudience({ cultural: val });
        return { success: true, cultural: val };
    }

    return { updateModerationAudienceCultural };
}
