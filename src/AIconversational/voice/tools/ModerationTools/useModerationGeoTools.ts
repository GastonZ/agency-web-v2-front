import { useModeration } from "../../../../context/ModerationContext";
import { fetchCountries, fetchStatesByCountry } from "../../../../services/geo";
import { useTranslation } from "react-i18next";

const normalize = (s: string) =>
    (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function fuzzyPick(userText: string, options: { id?: string; name: string }[]) {
    const q = normalize(userText);
    if (!q) return null;

    let hit = options.find(o => normalize(o.name) === q);
    if (hit) return hit;

    hit = options.find(o => normalize(o.name).startsWith(q));
    if (hit) return hit;

    hit = options.find(o => normalize(o.name).includes(q));
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
        let countryId: string | undefined;
        let stateId: string | undefined;

        try {
            if (args.country) {
                const countries = await fetchCountries(lang);
                const c = fuzzyPick(args.country, countries.map(x => ({ id: x.id, name: x.name })));
                if (c?.id) countryId = c.id;
            }

            if (args.state && countryId) {
                const states = await fetchStatesByCountry(countryId, lang);
                const s = fuzzyPick(args.state, states.map(x => ({ id: x.id, name: x.name })));
                if (s?.id) stateId = s.id;
            }

            if (!countryId && !stateId && !args.city) {
                return { success: false, message: "No pude interpretar país/provincia/ciudad." };
            }

            const patch: any = {};
            if (countryId) patch.countryId = countryId;
            if (stateId) patch.stateId = stateId;
            if (typeof args.city === "string") patch.city = args.city.trim();

            setGeo(patch);
            return { success: true, patch, message: "Ubicación actualizada." };
        } catch (e: any) {
            return { success: false, message: e?.message || "Error al actualizar ubicación." };
        }
    }

    return { updateModerationGeoByName };
}