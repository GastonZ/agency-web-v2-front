import { useModeration, TONES, type ToneOption } from "../../../../context/ModerationContext";

const normalize = (s: string) =>
    (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function useModerationToneTools() {
    const { setTone } = useModeration();

    function updateModerationToneChoice({ tone }: { tone: string }) {
        const t = normalize(tone);

        const aliases: Record<string, ToneOption> = {
            "formal": "formal",
            "informal": "informal",
            "casual": "informal",
            "inspirador": "inspirational",
            "inspiracional": "inspirational",
            "inspirational": "inspirational",
            "persuasivo": "persuasive",
            "persuasive": "persuasive",
            "educativo": "educational",
            "educational": "educational",
            "humor": "humorous",
            "humoristico": "humorous",
            "humorístico": "humorous",
            "humorous": "humorous",
            "otro": "other",
            "other": "other",
        };

        const direct = aliases[t] || (TONES as readonly string[]).find(x => normalize(x) === t) as ToneOption | undefined;

        if (direct && direct !== "other") {
            setTone(direct);
            return { success: true, tone: direct };
        }

        setTone("other", tone);
        return { success: true, tone: "other", customTone: tone };
    }

    return { updateModerationToneChoice };
}
