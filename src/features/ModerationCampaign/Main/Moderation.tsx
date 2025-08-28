import React, { useMemo, useState, useCallback } from "react";
import OnlineLayout from "../../../layout/OnlineLayout";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import { StepperTop, StepControls } from "../stepper/Stepper";
import { StepOneBottom, StepOneTop } from "../steps/StepOne";
import StepTwo from "../steps/StepTwo";
import { StepThreeTop, StepThreeBottom } from "../steps/StepThree";
import { useModeration } from "../../../context/ModerationContext";
import { toast } from "react-toastify";
import { createModerationCampaignFromStepOne, updateModerationCampaignFromStepOne, mapAssistantSettingsFromContext, updateAssistantSettings, updateCampaignChannels } from "../../../services/campaigns";


const STEPS = [
    { id: 1, title: "Datos" },
    { id: 2, title: "Canales" },
    { id: 3, title: "Reglas" },
    { id: 4, title: "Revisión" },
];

const Moderation: React.FC = () => {
    const [current, setCurrent] = useState(0);
    const [saving, setSaving] = useState(false);
    const { data, setCampaignId } = useModeration();
    
    const validateStep = useCallback((index: number) => {
        if (index === 0) {
            const hasName = (data.name || "").trim().length > 1;
            const hasStart = !!data.dates?.start;
            const hasEnd = !!data.dates?.end;
            return hasName && hasStart && hasEnd;
        }
        return true;
    }, [data]);

    const canPrev = current > 0;
    const canNext = useMemo(() => validateStep(current), [current, data]);


    const jumpTo = (i: number) => {
        if (i <= current || validateStep(current)) setCurrent(i);
    };

    /* Creation handler -> */

    const saveStepOne = useCallback(async () => {
        if (!validateStep(0)) {
            toast.warning("Completá los datos requeridos antes de continuar.");
            return false;
        }

        setSaving(true);
        try {
            if (!data.campaignId) {
                const res = await createModerationCampaignFromStepOne(data);
                setCampaignId(res.id);
                toast.success("Campaña creada con éxito.");
            } else {
                await updateModerationCampaignFromStepOne(data.campaignId, data);
                toast.success("Cambios guardados.");
            }
            return true;
        } catch (err: any) {
            const msg = err?.message || "Error al guardar la campaña.";
            toast.error(msg);
            return false;
        } finally {
            setSaving(false);
        }
    }, [data, setCampaignId, validateStep]);

    const saveCurrentStep = useCallback(async (): Promise<boolean> => {
        if (!validateStep(current)) {
            toast.warning("Revisá los datos antes de continuar.");
            return false;
        }
        if (current === 3) return true;

        if (!data.campaignId && current > 0) {
            toast.error("Falta crear la campaña en el Paso 1.");
            return false;
        }

        if (current === 0) return await saveStepOne();

        if (current === 1) {
            const channels = (data.channels || []) as Array<"instagram" | "facebook" | "whatsapp" | "email" | "x">;

            if (!channels.length) {
                toast.warning("Elegí al menos un canal.");
                return false;
            }

            setSaving(true);
            try {
                await updateCampaignChannels(data.campaignId!, channels);
                toast.success("Canales actualizados.");
                return true;
            } catch (err: any) {
                toast.error(err?.message || "No se pudieron actualizar los canales.");
                return false;
            } finally {
                setSaving(false);
            }
        }

        if (current === 2) {
            // STEP 3 → assistant settings
            const payload = mapAssistantSettingsFromContext({
                assistant: data.assistant || {},
                knowHow: data.knowHow || [],
                allowedTopics: data.allowedTopics || [],
                escalationItems: data.escalationItems || [],
                escalationPhone: data.escalationPhone,
                calendars: data.calendarsEnabled ? data.calendars : []
            });
            setSaving(true);
            try {
                await updateAssistantSettings(data.campaignId!, payload);
                toast.success("Asistente actualizado.");
                return true;
            } catch (err: any) {
                toast.error(err?.message || "No se pudo actualizar el asistente.");
                return false;
            } finally {
                setSaving(false);
            }
        }

        return true;
    }, [current, data, saveStepOne, validateStep]);

    const goPrev = () => setCurrent((c) => Math.max(0, c - 1));


    const goNext = useCallback(async () => {
        const ok = await saveCurrentStep();
        if (!ok) return;
        setCurrent((c) => Math.min(3, c + 1));
    }, [saveCurrentStep]);

    console.log(data);
    

    return (
        <OnlineLayout>
            <div className="w-full px-2 md:px-4">
                <div className="mb-4 md:mb-6">
                    <StepperTop steps={STEPS} current={current} onStepClick={jumpTo} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                    <div className="lg:col-span-5">
                        <AgencyChatbot className="w-full h-[420px]" />
                    </div>

                    {current === 0 && (
                        <>
                            <div className="lg:col-span-7">
                                <StepOneTop />
                            </div>

                            <div className="lg:col-span-12">
                                <StepOneBottom />
                            </div>
                        </>
                    )}

                    {current === 1 && <div className="lg:col-span-7"><StepTwo /></div>}

                    {current === 2 && (
                        <>
                            <div className="lg:col-span-7">
                                <StepThreeTop />
                            </div>
                            <div className="lg:col-span-12">
                                <StepThreeBottom />
                            </div>
                        </>
                    )}

                    <div className="lg:col-span-12">
                        <StepControls
                            canPrev={canPrev}
                            canNext={canNext}
                            onPrev={goPrev}
                            onNext={goNext}
                            nextLabel={
                                current === 0
                                    ? (saving ? (data.campaignId ? "Guardando…" : "Creando…") : "Siguiente")
                                    : current === 1
                                        ? (saving ? "Guardando canales…" : "Siguiente")
                                        : current === 2
                                            ? (saving ? "Guardando asistente…" : "Siguiente")
                                            : "Finalizar"
                            }
                        />
                    </div>
                </div>
            </div>
        </OnlineLayout>
    );
};

export default Moderation;
