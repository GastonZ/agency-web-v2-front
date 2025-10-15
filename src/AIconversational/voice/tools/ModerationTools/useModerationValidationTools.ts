// src/AIconversational/voice/tools/ModerationTools/useModerationValidationTools.ts
import { useModeration } from "../../../../context/ModerationContext";

function missingFromStep0(data: any) {
    const missing: string[] = [];
    if (!((data.name || "").trim().length > 1)) missing.push("name");
    if (!((data.leadDefinition || "").trim().length > 0)) missing.push("leadDefinition");
    if (!((data.goal || "").trim().length > 0)) missing.push("goal");
    const countryId =
        data?.audience?.geo?.countryId ?? data?.audience?.geo?.country ?? data?.countryId;
    if (!countryId) missing.push("geo.countryId");
    return missing;
}

function missingFromStep1(data: any) {
    const arr = Array.isArray(data.channels) ? data.channels : [];
    return arr.length ? [] : ["channels"];
}

function humanizeMissing(keys: string[]) {
    const map: Record<string, string> = {
        name: "Nombre de campaña",
        leadDefinition: "Definición de lead",
        goal: "Objetivo principal",
        "geo.countryId": "Ubicación: País",
        channels: "Seleccionar al menos un canal",
    };
    return keys.map((k) => map[k] ?? k);
}

export function useModerationValidationTools() {
    const { data } = useModeration();

    function checkModerationStepStatus(args?: { step?: number }) {
        const step = typeof args?.step === "number" ? args!.step : undefined;

        const make = (i: number) => {
            const k = i === 0 ? missingFromStep0(data) : i === 1 ? missingFromStep1(data) : [];
            return {
                step: i,
                ok: k.length === 0,
                missingKeys: k,
                missing: humanizeMissing(k),
            };
        };

        if (typeof step === "number") {
            return { success: true, ...make(step) };
        }

        const all = [0, 1].map(make);
        const overallOk = all.every((s) => s.ok);
        return { success: true, overallOk, steps: all };
    }

    return { checkModerationStepStatus };
}
