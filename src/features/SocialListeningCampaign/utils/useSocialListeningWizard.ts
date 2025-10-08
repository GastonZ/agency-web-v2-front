import { useState, useCallback } from "react";
import type {
    ListeningConfigPayload,
    ProfilingConfigPayload,
    ListeningStepOneCtx,
} from "../../../services/types/listening-types";
import {
    saveStepOne,
    updateListeningCampaignListeningConfig,
    updateListeningCampaignProfilingConfig,
} from "../../../services/listeningCampaigns";


export function useSocialListeningWizard(initialId?: string) {
    const [campaignId, setCampaignId] = useState<string | undefined>(initialId);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleSaveStepOne = useCallback(async (ctx: ListeningStepOneCtx & { id?: string }) => {
        setBusy(true); setError(null);
        try {
            const id = await saveStepOne({ ...ctx, id: campaignId });
            setCampaignId(id);
            return id;
        } catch (e: any) {
            setError(e?.message || "Error al guardar el paso 1");
            throw e;
        } finally {
            setBusy(false);
        }
    }, [campaignId]);


    const handleSaveStepTwo = useCallback(async (payload: ListeningConfigPayload) => {
        if (!campaignId) throw new Error("No hay campaignId. Guarda el Paso 1 primero.");
        setBusy(true); setError(null);
        try {
            await updateListeningCampaignListeningConfig(campaignId, payload);
        } catch (e: any) {
            setError(e?.message || "Error al guardar el paso 2");
            throw e;
        } finally {
            setBusy(false);
        }
    }, [campaignId]);


    const handleSaveStepThree = useCallback(async (payload: ProfilingConfigPayload) => {
        if (!campaignId) throw new Error("No hay campaignId. Guarda el Paso 1 primero.");
        setBusy(true); setError(null);
        try {
            await updateListeningCampaignProfilingConfig(campaignId, payload);
        } catch (e: any) {
            setError(e?.message || "Error al guardar el paso 3");
            throw e;
        } finally {
            setBusy(false);
        }
    }, [campaignId]);


    return { campaignId, busy, error, handleSaveStepOne, handleSaveStepTwo, handleSaveStepThree } as const;
}