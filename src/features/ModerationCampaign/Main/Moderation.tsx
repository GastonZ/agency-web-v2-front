import React, { useMemo, useState, useCallback } from "react";
import OnlineLayout from "../../../layout/OnlineLayout";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import { StepperTop, StepControls } from "../stepper/Stepper";
import { StepOneBottom, StepOneTop } from "../steps/StepOne";
import StepTwo from "../steps/StepTwo";
import { StepThreeTop, StepThreeBottom } from "../steps/StepThree";
import StepReview from "../steps/StepReview";
import { useModeration } from "../../../context/ModerationContext";
import { toast } from "react-toastify";
import { createModerationCampaignFromStepOne, updateModerationCampaignFromStepOne, mapAssistantSettingsFromContext, updateAssistantSettings, updateCampaignChannels, updateModerationCampaignStatus } from "../../../services/campaigns";
import { saveLastLaunchedModeration } from "../../../utils/helper";
import { useNavigate } from "react-router-dom";
import { getModerationCampaignById } from "../../../services/campaigns";
import { fillContextFromApi } from "../utils/fillContextFromApi";
import EditModeBanner from "../utils/EditModeBanner";
import { moderationSchemas } from "../../../AIconversational/voice/schemas/moderationSchemas";
import { useModerationBasicsTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationBasicsTools";
import { useModerationGeoTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationGeoTools";
import { useModerationAudienceTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationAudienceTools";
import { useModerationToneTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationToneTools";
import { useModerationChannelsTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationChannelsTools";
import { validationSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/validation.schema";
import { useModerationValidationTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationValidationTools";
import { assistantSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/assistant.schema";
import { useModerationAssistantTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationAssistantTools";
import { communicationSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/communication.schema";
import { useModerationCommsTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationCommsTools";
import { calendarSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/calendar.schema";
import { useModerationCalendarTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationCalendarTools";

const STEPS = [
    { id: 1, title: "Datos" },
    { id: 2, title: "Canales" },
    { id: 3, title: "Reglas" },
    { id: 4, title: "Revisión" },
];

const Moderation: React.FC = () => {

    const navigate = useNavigate();

    const { getModerationOverview, explainModerationField, updateModerationBasics } = useModerationBasicsTools();
    const { updateModerationGeoByName } = useModerationGeoTools();
    const { updateModerationAudienceCultural } = useModerationAudienceTools();
    const { updateModerationToneChoice } = useModerationToneTools();
    const { setModerationChannels, addModerationChannel, removeModerationChannel, describeModerationChannels } =
        useModerationChannelsTools();
    const { checkModerationStepStatus } = useModerationValidationTools();
    const {
        setModerationAssistantConfig,
        explainAssistantVoiceFormat,
        explainKnowledgeBaseUpload,
        addModerationQAPair,
        updateModerationQAMatch,
        removeModerationQAMatch
    } = useModerationAssistantTools();
    const {
        addModerationAllowedTopics,
        removeModerationAllowedTopics,
        listModerationAllowedTopics,
        addModerationEscalationCases,
        removeModerationEscalationCases,
        listModerationEscalationCases,
        setModerationContactNumber,
        getModerationContactNumber,
    } = useModerationCommsTools();
    const {
        explainAndEnableCalendars,
        createModerationCalendar,
        updateModerationCalendarMeta,
        removeModerationCalendar,
        toggleModerationCalendarDay,
        addModerationTimeSlot,
        addModerationTimeSlotsBulk,
        removeModerationTimeSlot,
    } = useModerationCalendarTools();

    const [current, setCurrent] = useState(0);
    const [saving, setSaving] = useState(false);
    const { data, setCampaignId, resetAll, setBasics, setChannels, setAssistant, clearQA, addQA, setAllowedTopics, setCalendarsEnabled, setCalendars, setEscalationItems, setEscalationPhone } = useModeration();

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const fromId = params.get("fromId");
        if (!fromId) return;

        (async () => {
            try {
                const apiItem = await getModerationCampaignById(fromId);
                fillContextFromApi(apiItem, {
                    setCampaignId, setBasics, setChannels,
                    setAssistant,
                    clearQA, addQA,
                    setAllowedTopics, setEscalationItems, setEscalationPhone,
                    setCalendarsEnabled, setCalendars,
                });
            } catch (e: any) {
                toast.error(e?.message || "No se pudo cargar la campaña para editar");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // --- helpers de validación (Paso 1 y Paso 2) ---
    function missingFromStep0(data: any) {
        const missing: string[] = [];

        // básicos
        if (!((data.name || "").trim().length > 1)) missing.push("name");
        if (!((data.leadDefinition || "").trim().length > 0)) missing.push("leadDefinition");
        if (!((data.goal || "").trim().length > 0)) missing.push("goal");

        // geo: mínimo país (countryId)
        const countryId =
            data?.audience?.geo?.countryId ?? data?.audience?.geo?.country ?? data?.countryId;
        if (!countryId) missing.push("geo.countryId");

        return missing;
    }

    function missingFromStep1(data: any) {
        const arr = Array.isArray(data.channels) ? data.channels : [];
        return arr.length ? [] : ["channels"];
    }

    function missingFromStep2(data: any) {
        const missing: string[] = [];

        const assistantNameOk =
            !!(data?.assistant?.name && data.assistant.name.trim().length > 0);

        const hasAtLeastOneQA =
            Array.isArray(data?.knowHow) &&
            data.knowHow.some(
                (qa: any) =>
                    (qa?.question || "").trim().length > 0 &&
                    (qa?.answer || "").trim().length > 0
            );

        if (!assistantNameOk) missing.push("assistant.name");
        if (!hasAtLeastOneQA) missing.push("knowHow");

        return missing;
    }

    const validateStep = useCallback((index: number) => {
        if (index === 0) {
            return missingFromStep0(data).length === 0;
        }
        if (index === 1) {
            return missingFromStep1(data).length === 0;
        }
        if (index === 2) {
            return missingFromStep2(data).length === 0;
        }
        return true;
    }, [data]);

    const canPrev = current > 0;
    const canNext = useMemo(() => validateStep(current), [current, data]);


    const jumpTo = (i: number) => {
        if (i <= current || validateStep(current)) setCurrent(i);
    };

    const saveStepOne = useCallback(async () => {
        if (!validateStep(0)) {
            toast.warning("Completá los datos requeridos antes de continuar.");
            return false;
        }

        setSaving(true);
        try {
            if (!data.campaignId) {
                const res = await createModerationCampaignFromStepOne(data);
                console.log(res);

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

        if (current === 3) {
            if (!data.campaignId) {
                toast.error("Falta el id de campaña.");
                return;
            }
            try {
                setSaving(true);

                await updateModerationCampaignStatus(data.campaignId, "active");

                const channels = Array.isArray(data.channels) ? data.channels : [];
                saveLastLaunchedModeration({
                    id: data.campaignId,
                    channels,
                    savedAt: Date.now(),
                });

                resetAll();

                navigate(`/my_moderation_campaign/${data.campaignId}/statistics`, { replace: true });
            } catch (e: any) {
                toast.error(e?.message || "No se pudo lanzar la campaña");
            } finally {
                setSaving(false);
            }
            return;
        }

        setCurrent((c) => Math.min(3, c + 1));
    }, [saveCurrentStep, current, data, navigate, resetAll, setSaving]);

    return (
        <OnlineLayout>
            <div className="w-full px-2 md:px-4">
                <div className="mb-4 md:mb-6">
                    <StepperTop steps={STEPS} current={current} onStepClick={jumpTo} />
                </div>

                <EditModeBanner />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                    <div className="lg:col-span-5">
                        <AgencyChatbot
                            mode="floating"
                            extraTools={[...(moderationSchemas as any), ...(validationSchema as any), ...(assistantSchema as any), ...(communicationSchema as any), ...(calendarSchema as any)]}
                            onRegisterTools={(register) => {
                                register("getModerationOverview", getModerationOverview);
                                register("explainModerationField", explainModerationField);
                                register("updateModerationBasics", updateModerationBasics);
                                register("updateModerationGeoByName", updateModerationGeoByName);
                                register("updateModerationAudienceCultural", updateModerationAudienceCultural);
                                register("updateModerationToneChoice", updateModerationToneChoice);
                                register("setModerationChannels", setModerationChannels);
                                register("addModerationChannel", addModerationChannel);
                                register("removeModerationChannel", removeModerationChannel);
                                register("describeModerationChannels", describeModerationChannels);
                                register("checkModerationStepStatus", checkModerationStepStatus);
                                register("goToNextModerationStep", async () => {
                                    const ok = await saveCurrentStep();
                                    if (!ok) {
                                        const r = checkModerationStepStatus({ step: current });
                                        return {
                                            success: false,
                                            message: "Faltan completar datos antes de continuar.",
                                            ...r,
                                        };
                                    }
                                    if (current >= 3) {
                                        return {
                                            success: false,
                                            atLastStep: true,
                                            message:
                                                "Ya estás en el último paso. Si todo está correcto, podés finalizar la campaña.",
                                            suggestion:
                                                "Decime “finalizar campaña” o usá el botón de la UI para activarla.",
                                        };
                                    }
                                    setCurrent((c) => Math.min(3, c + 1));
                                    return { success: true, advancedTo: Math.min(3, current + 1) };
                                });
                                register("goToPrevModerationStep", () => {
                                    if (current <= 0) {
                                        return {
                                            success: false,
                                            atFirstStep: true,
                                            message: "Ya estás en el primer paso; no se puede retroceder más.",
                                        };
                                    }
                                    setCurrent((c) => Math.max(0, c - 1));
                                    return { success: true, movedTo: Math.max(0, current - 1) };
                                });

                                register("setModerationAssistantConfig", setModerationAssistantConfig);
                                register("explainAssistantVoiceFormat", explainAssistantVoiceFormat);
                                register("explainKnowledgeBaseUpload", explainKnowledgeBaseUpload);
                                register("addModerationQAPair", addModerationQAPair);

                                register("updateModerationQAMatch", updateModerationQAMatch);
                                register("removeModerationQAMatch", removeModerationQAMatch);

                                // Temas permitidos
                                register("addModerationAllowedTopics", addModerationAllowedTopics);
                                register("removeModerationAllowedTopics", removeModerationAllowedTopics);
                                register("listModerationAllowedTopics", listModerationAllowedTopics);

                                // Escalamiento humano
                                register("addModerationEscalationCases", addModerationEscalationCases);
                                register("removeModerationEscalationCases", removeModerationEscalationCases);
                                register("listModerationEscalationCases", listModerationEscalationCases);

                                // Contacto
                                register("setModerationContactNumber", setModerationContactNumber);
                                register("getModerationContactNumber", getModerationContactNumber);

                                // Calendar
                                register("explainAndEnableCalendars", explainAndEnableCalendars);
                                register("createModerationCalendar", createModerationCalendar);
                                register("updateModerationCalendarMeta", updateModerationCalendarMeta);
                                register("removeModerationCalendar", removeModerationCalendar);
                                register("toggleModerationCalendarDay", toggleModerationCalendarDay);
                                register("addModerationTimeSlot", addModerationTimeSlot);
                                register("addModerationTimeSlotsBulk", addModerationTimeSlotsBulk);
                                register("removeModerationTimeSlot", removeModerationTimeSlot);
                            }}
                        />
                    </div>

                    {current === 0 && (
                        <>
                            <div className="lg:col-span-12">
                                <StepOneTop />
                            </div>

                            <div className="lg:col-span-12">
                                <StepOneBottom />
                            </div>
                        </>
                    )}

                    {current === 1 && <div className="lg:col-span-12"><StepTwo /></div>}

                    {current === 2 && (
                        <>
                            <div className="lg:col-span-12">
                                <StepThreeTop />
                            </div>
                            <div className="lg:col-span-12">
                                <StepThreeBottom />
                            </div>
                        </>
                    )}

                    {current === 3 && (
                        <div className="lg:col-span-12">
                            <StepReview />
                        </div>
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
                                            : (saving ? "Creando..." : "🚀 Crear campaña")
                            }
                        />
                    </div>
                </div>
            </div>
        </OnlineLayout>
    );
};

export default Moderation;
