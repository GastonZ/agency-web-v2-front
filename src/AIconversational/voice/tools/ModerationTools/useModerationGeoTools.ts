import { useModeration } from "../../../../context/ModerationContext";
import { fetchCountries, fetchStatesByCountry } from "../../../../services/geo";
import { useTranslation } from "react-i18next";

const normalize = (s: string) =>
    (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// Hacemos fuzzyPick genérico, así podemos pasar objetos completos
function fuzzyPick<T extends { name: string }>(userText: string, options: T[]): T | null {
    const q = normalize(userText);
    if (!q) return null;

    let hit = options.find((o) => normalize(o.name) === q);
    if (hit) return hit;

    hit = options.find((o) => normalize(o.name).startsWith(q));
    if (hit) return hit;

    hit = options.find((o) => normalize(o.name).includes(q));
    return hit || null;
}

export function useModerationGeoTools() {
    const { i18n } = useTranslation();
    const langDefault = (i18n?.language as string) || "es";
    const { setGeo } = useModeration();

    async function updateModerationGeoByName(args: {
        country?: string;
        state?: string;
        city?: string;
        language?: string;
    }) {
        const lang = args.language || langDefault;

        let countryCode: string | undefined;
        let countryDbId: string | undefined;
        let stateCodeOrId: string | undefined;

        try {
            if (args.country) {
                const countries = await fetchCountries(lang);
                const c = fuzzyPick(args.country, countries);
                if (c) {
                    countryCode = (c as any).code || (c as any).id;
                    countryDbId = (c as any).id || (c as any).code;
                }
            }

            if (args.state && countryDbId) {
                const states = await fetchStatesByCountry(countryDbId, lang);
                const s = fuzzyPick(args.state, states);
                if (s) {
                    stateCodeOrId = (s as any).code || (s as any).id;
                }
            }

            if (!countryCode && !stateCodeOrId && !args.city) {
                return { success: false, message: "No pude interpretar país/provincia/ciudad." };
            }

            const patch: any = {};

            if (countryCode) {
                patch.countryCode = countryCode;
                patch.countryId = countryCode;
            }

            if (stateCodeOrId) {
                patch.stateId = stateCodeOrId;
                patch.regionCode = stateCodeOrId;
            }

            if (typeof args.city === "string") {
                patch.city = args.city.trim();
            }

            setGeo(patch);

            return {
                success: true,
                patch,
                message: "Ubicación actualizada.",
            };
        } catch (e: any) {
            return {
                success: false,
                message: e?.message || "Error al actualizar ubicación.",
            };
        }
    }

    return { updateModerationGeoByName };
}
