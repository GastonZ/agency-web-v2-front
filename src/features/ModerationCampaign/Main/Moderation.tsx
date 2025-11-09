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
import { buildTranscriptFromHistory, clampStep, extractPlaybookForStep, formatStepName, resolveStepFromTopic, saveLastLaunchedModeration, toIndexStep, getUserId } from "../../../utils/helper";
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
import { useAutoScrollTools } from "../../../AIconversational/voice/tools/useAutoScrollTools";
import { getResumeOfConversation } from "../../../services/ia";
import { loadBotSnapshot } from "../../../AIconversational/voice/session/persistence";
import { MODERATION_PLAYBOOK } from "../utils/campaignsInstructions";
import ModerationSkeleton from "../components/ModerationSkeleton";
import { useTranslation } from "react-i18next";

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

    const { t } = useTranslation('translations')

    const STEPS_T = [
        { id: 1, title: t("data") },
        { id: 2, title: t("channels") },
        { id: 3, title: t("rules") },
        { id: 4, title: t("review") },
    ];

    const { i18n } = useTranslation();
    const uiLang = i18n.language.startsWith("en") ? "en" : "es";

    const { autoScrollTools, scrollToModerationField, scrollToFieldIfFilled } = useAutoScrollTools();

    const [current, setCurrent] = useState(0);
    const [saving, setSaving] = useState(false);

    const [bootSummary, setBootSummary] = React.useState<string | undefined>(undefined);
    const [bootReady, setBootReady] = React.useState(false);

    const userId = getUserId?.() || "anon";
    const persistNamespace = "moderation";

    const [toolsReady, setToolsReady] = React.useState(false);
    const [showUI, setShowUI] = React.useState(false);

    const { data, setCampaignId, resetAll, setBasics, setChannels, setAssistant, clearQA, addQA, setAllowedTopics, setCalendarsEnabled, setCalendars, setEscalationItems, setEscalationPhone } = useModeration();

    React.useEffect(() => {
        let aborted = false;
        const ctrl = new AbortController();

        (async () => {
            try {
                const primaryNs = persistNamespace;
                const fallbackNs = "global";

                const snapPrimary = loadBotSnapshot("moderation", userId);
                const snapFallback = loadBotSnapshot("global", userId);

                const shouldBridge =
                    (!snapPrimary || (snapPrimary.history ?? []).length === 0) &&
                    (snapFallback && (snapFallback.history ?? []).length > 0);

                const primaryLen = snapPrimary?.history?.length ?? 0;
                const fallbackLen = snapFallback?.history?.length ?? 0;

                console.groupCollapsed("[Moderation][boot] resumen previo");
                console.log("primary:", primaryNs, "len:", primaryLen);
                console.log("fallback:", fallbackNs, "len:", fallbackLen);
                console.groupEnd();

                let chosenText = "";
                let chosenSource: "primary" | "fallback" | "none" = "none";
                let pickedHistory: any[] = [];

                if (primaryLen > 0 && Array.isArray(snapPrimary?.history)) {
                    chosenSource = "primary";
                    pickedHistory = snapPrimary!.history;
                } else if (fallbackLen > 0 && Array.isArray(snapFallback?.history)) {
                    chosenSource = "fallback";
                    pickedHistory = snapFallback!.history;
                } else {
                    chosenSource = "none";
                }

                if (chosenSource !== "none") {
                    chosenText = buildTranscriptFromHistory(pickedHistory, {
                        maxChars: 40000,
                        newestLast: true,
                    });
                }

                if (chosenSource !== "none" && chosenText.trim().length) {
                    console.log(`[Moderation][boot] llamando /api/resume desde: ${chosenSource}, chars:`, chosenText.length);
                    const summary = await getResumeOfConversation(chosenText, 10000, ctrl.signal);
                    if (!aborted) {
                        setBootSummary(summary || undefined);
                        console.groupCollapsed("[Moderation][boot] resumen recibido");
                        console.log("summary.len:", (summary || "").length);
                        console.log("summary.preview:", (summary || "").slice(0, 240));
                        console.groupEnd();
                    }
                } else {
                    console.log("[Moderation][boot] sin historial en primary ni fallback; no se llama a /api/resume");
                }
            } catch (e) {
                console.warn("[Moderation][boot] fallo al resumir:", e);
            } finally {
                if (!aborted) setBootReady(true);
            }
        })();

        return () => {
            aborted = true;
            ctrl.abort();
        };
    }, [persistNamespace, userId]);

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

    React.useEffect(() => {
        if (bootReady && toolsReady) {
            const timeout = setTimeout(() => setShowUI(true), 4000);
            return () => clearTimeout(timeout);
        }
    }, [bootReady, toolsReady]);

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


    const sendStepSilentNote = useCallback(
        (nextIndex: number) => {
            const safeIndex = clampStep(nextIndex);
            const humanIndex = safeIndex + 1;

            // títulos por paso
            const stepTitlesEs = ["Datos", "Canales", "Reglas", "Revisión"];
            const stepTitlesEn = ["Basics", "Channels", "Assistant rules", "Review"];

            const stepTitleEs = stepTitlesEs[safeIndex] ?? `Paso ${humanIndex}`;
            const stepTitleEn = stepTitlesEn[safeIndex] ?? `Step ${humanIndex}`;

            const stepTitle = uiLang === "en" ? stepTitleEn : stepTitleEs;

            let focusText: string;

            if (uiLang === "en") {
                if (safeIndex === 0) {
                    focusText =
                        "Your role is to guide the user to complete the basic campaign data: name, goal, lead definition and the main target country (and, optionally, summary, city, culture and tone).";
                } else if (safeIndex === 1) {
                    focusText =
                        "Your role is to help the user choose and configure the moderation channels, without talking about rules or review yet.";
                } else if (safeIndex === 2) {
                    focusText =
                        "Your role is to define the assistant rules: assistant name, initial greet, conversational logic,  knowledge base (question and answers), allowed topics and human escalation and calendars if users is interested.";
                } else {
                    focusText =
                        "Your role is to review that everything is ready to launch the campaign, once done offer to launch the campaign without reopening previous steps unless the user asks explicitly.";
                }

                const message =
                    `We are in Step ${humanIndex} (${stepTitle}) of the moderation campaign wizard. ` +
                    `${focusText} ` +
                    `While we stay on this step, avoid switching topics or jumping between steps on your own. Always answer in the same language the user is using.`;

                console.groupCollapsed(
                    `[Moderation] Sending silent step note (EN) -> Step ${humanIndex} (${stepTitle})`
                );
                console.log("message:", message);
                console.groupEnd();

                try {
                    window.dispatchEvent(
                        new CustomEvent("agency:manual-change" as any, {
                            detail: {
                                namespace: "moderation",
                                label: "wizard_step",
                                value: message,
                            },
                        })
                    );
                    console.log("[Moderation] Silent step note dispatched (EN).");
                } catch (e) {
                    console.warn(
                        "[Moderation] Failed to dispatch silent step note (EN):",
                        e
                    );
                }

                return;
            }

            // === español ===
            if (safeIndex === 0) {
                focusText =
                    "Tu rol es guiar al usuario para completar los datos básicos de la campaña: nombre, objetivo, definición de lead y país principal del público (y, opcionalmente, resumen, ciudad, cultura y tono).";
            } else if (safeIndex === 1) {
                focusText =
                    "Tu rol es guiar al usuario para elegir y configurar los canales de la campaña, sin hablar de reglas ni revisión todavía.";
            } else if (safeIndex === 2) {
                focusText =
                    "Tu rol es guiar al usuario para definir las reglas del asistente: nombre del asistente, saludo inicial, logica conversacional, base de conocimiento (preguntas y respuestas), temas permitidos y escalamiento humano.";
            } else {
                focusText =
                    "Tu rol es ayudar a revisar que todo esté listo para lanzar la campaña, una vez hecho eso ofrece lanzar la campaña sin volver a pedir datos de pasos anteriores salvo que el usuario lo pida explícitamente.";
            }

            const message =
                `Estamos en el Paso ${humanIndex} (${stepTitle}) del flujo de creación de la campaña de moderación. ` +
                `${focusText} ` +
                `Mientras no cambiemos de paso, evitá tocar otros temas o adelantarte/retroceder por tu cuenta. Respondé siempre en el mismo idioma que use el usuario.`;

            console.groupCollapsed(
                `[Moderation] Enviando nota silenciosa de cambio de paso (ES) -> ${humanIndex} (${stepTitle})`
            );
            console.log("message:", message);
            console.groupEnd();

            try {
                window.dispatchEvent(
                    new CustomEvent("agency:manual-change" as any, {
                        detail: {
                            namespace: "moderation",
                            label: "wizard_step",
                            value: message,
                        },
                    })
                );
                console.log("[Moderation] Nota silenciosa de cambio de paso despachada (ES).");
            } catch (e) {
                console.warn(
                    "[Moderation] No se pudo enviar la nota silenciosa de cambio de paso (ES):",
                    e
                );
            }
        },
        [uiLang]
    );

    const jumpTo = (i: number) => {
        if (i <= current || validateStep(current)) {
            const next = clampStep(i);
            setCurrent(next);
            sendStepSilentNote(next);
        }
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

    const goPrev = () =>
        setCurrent((c) => {
            const next = Math.max(0, c - 1);
            sendStepSilentNote(next);
            return next;
        });

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

        setCurrent((c) => {
            const next = Math.min(3, c + 1);
            sendStepSilentNote(next);
            return next;
        });
    }, [saveCurrentStep, current, data, navigate, resetAll, setSaving, sendStepSilentNote]);

    async function finalizeCampaign() {
        const miss0 = missingFromStep0(data);
        const miss1 = missingFromStep1(data);
        const miss2 = missingFromStep2(data);

        if (miss0.length || miss1.length || miss2.length) {
            const failingStep = miss0.length ? 0 : miss1.length ? 1 : 2;
            const stepName = ["Datos", "Canales", "Reglas"][failingStep] ?? String(failingStep);
            return {
                success: false,
                message: `Faltan completar datos para finalizar. Revisá el paso "${stepName}".`,
                failingStep,
                missing: { step0: miss0, step1: miss1, step2: miss2 },
            };
        }

        if (!data.campaignId) {
            const created = await saveStepOne();
            if (!created || !data.campaignId) {
                return {
                    success: false,
                    message: "No se pudo crear/obtener el id de campaña. Guardá los datos del Paso 1 e intentá nuevamente.",
                };
            }
        }

        try {
            setSaving(true);

            await updateModerationCampaignStatus(data.campaignId!, "active");

            const channels = Array.isArray(data.channels) ? data.channels : [];
            saveLastLaunchedModeration({
                id: data.campaignId!,
                channels,
                savedAt: Date.now(),
            });

            resetAll();
            navigate(`/my_moderation_campaign/${data.campaignId}/statistics`, { replace: true });

            return {
                success: true,
                activated: true,
                campaignId: data.campaignId,
                navigatedTo: "statistics",
                message: "Campaña activada y vista de estadísticas abierta.",
            };
        } catch (e: any) {
            return { success: false, error: e?.message || "No se pudo lanzar la campaña." };
        } finally {
            setSaving(false);
        }
    }

    function resetAndGoFirst() {
        try {
            resetAll();
            setCurrent(0);
            sendStepSilentNote(0);
            return {
                success: true,
                movedTo: 0,
                label: "Datos",
                message: "Se limpió el borrador y volvimos al Paso 1.",
            };
        } catch (e: any) {
            return { success: false, error: e?.message ?? "No se pudo reiniciar el flujo." };
        }
    }
    const viewReady = bootReady;

    if (!viewReady) {
        return <ModerationSkeleton />;
    }

    return (
        <div className="relative">
            <div
                className={`${showUI ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                aria-hidden={!showUI}
            >
                <OnlineLayout>
                    <div className="w-full px-2 md:px-4">
                        <div className="mb-4 md:mb-6">
                            <StepperTop steps={STEPS_T} current={current} onStepClick={jumpTo} />
                        </div>

                        <EditModeBanner />
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                            <div className="lg:col-span-5">
                                <AgencyChatbot
                                    mode="floating"
                                    persistNamespace="moderation"
                                    userId={userId}
                                    autoStart={bootReady && toolsReady}
                                    bootSummaryOverride={bootSummary}
                                    bootExtraInstructions={MODERATION_PLAYBOOK}
                                    getBusinessSnapshot={() => ({
                                        __summary: (() => {
                                            const name = data?.name || "Sin nombre";
                                            const stepNames = ["Datos", "Canales", "Reglas", "Revisión"];
                                            const step = stepNames[current] ?? String(current);
                                            return `Campaña de Moderación “${name}”, paso ${step}.`;
                                        })(),
                                        stepIndex: current,
                                        campaignId: data?.campaignId,
                                        basics: {
                                            name: data?.name,
                                            goal: data?.goal,
                                            summary: data?.summary,
                                            leadDefinition: data?.leadDefinition,
                                        },
                                        audience: {
                                            countryId: data?.audience?.geo?.countryCode,
                                            provinceId: data?.audience?.geo?.regionCode,
                                            cityId: data?.audience?.geo?.city,
                                            culture: data?.audience?.cultural,
                                            tone: data?.tone,
                                        },
                                        channels: Array.isArray(data?.channels) ? data.channels : [],
                                        assistant: {
                                            name: data?.assistant?.name,
                                            greeting: data?.assistant?.greeting,
                                            logic: data?.assistant?.conversationLogic,
                                            qaCount: Array.isArray(data?.knowHow) ? data.knowHow.length : 0,
                                            allowedTopicsCount: Array.isArray(data?.allowedTopics) ? data.allowedTopics.length : 0,
                                            escalationCount: Array.isArray(data?.escalationItems) ? data.escalationItems.length : 0,
                                            phone: data?.escalationPhone,
                                            calendarsEnabled: !!data?.calendarsEnabled,
                                        },
                                    })}
                                    extraTools={[...(moderationSchemas as any), ...(validationSchema as any), ...(assistantSchema as any), ...(communicationSchema as any), ...(calendarSchema as any), ...(autoScrollTools as any)]}
                                    onRegisterTools={(register) => {
                                        register("getModerationOverview", getModerationOverview);
                                        register("explainModerationField", (args: { field: "name" | "goal" | "summary" | "leadDefinition" }) => {
                                            const res = explainModerationField(args);
                                            try { scrollToModerationField({ field: args.field as any }); } catch { }
                                            return res;
                                        });
                                        register("updateModerationBasics", (args: {
                                            name?: string; goal?: string; summary?: string; leadDefinition?: string;
                                        }) => {
                                            const res = updateModerationBasics(args);
                                            if (res?.success) {
                                                const updated: string[] = Array.isArray(res.updated) ? res.updated : [];
                                                if (updated.length === 1) {
                                                    try {
                                                        scrollToFieldIfFilled({ field: updated[0] as any, payload: data });
                                                    } catch { }
                                                } else if (updated.length > 1) {
                                                    updated.forEach((f, i) => {
                                                        setTimeout(() => {
                                                            try { scrollToFieldIfFilled({ field: f as any, payload: data }); } catch { }
                                                        }, i * 300);
                                                    });
                                                }
                                            }
                                            return res;
                                        });
                                        register("updateModerationGeoByName", (args: any) => {
                                            const out = updateModerationGeoByName(args);
                                            // scrollea a lo que se “tocó” (si está lleno en data)
                                            const candidates: Array<{ field: any, path: string[] }> = [
                                                { field: "audience.geo.country", path: ["audience", "geo", "countryId"] },
                                                { field: "audience.geo.province", path: ["audience", "geo", "provinceId"] },
                                                { field: "audience.geo.city", path: ["audience", "geo", "cityId"] },
                                            ];
                                            candidates.forEach((c, i) => {
                                                const value = c.path.reduce((acc: any, k) => acc?.[k], data);
                                                if (value) setTimeout(() => {
                                                    try { scrollToModerationField({ field: c.field as any }); } catch { }
                                                }, i * 200);
                                            });
                                            return out;
                                        });
                                        register("updateModerationAudienceCultural", (args: any) => {
                                            const out = updateModerationAudienceCultural(args);
                                            try { scrollToModerationField({ field: "audience.culture" as any }); } catch { }
                                            return out;
                                        });
                                        register("updateModerationToneChoice", (args: any) => {
                                            const out = updateModerationToneChoice(args);
                                            try { scrollToModerationField({ field: "tone" as any }); } catch { }
                                            return out;
                                        });
                                        const scrollChannels = () => {
                                            try { scrollToModerationField({ field: "channels" as any }); } catch { }
                                        };
                                        register("setModerationChannels", (args: any) => { const r = setModerationChannels(args); scrollChannels(); return r; });
                                        register("addModerationChannel", (args: any) => { const r = addModerationChannel(args); scrollChannels(); return r; });
                                        register("removeModerationChannel", (args: any) => { const r = removeModerationChannel(args); scrollChannels(); return r; });
                                        register("describeModerationChannels", (args: any) => { const r = describeModerationChannels(args); scrollChannels(); return r; });
                                        register("checkModerationStepStatus", checkModerationStepStatus);
                                        register("scrollToModerationField", scrollToModerationField);
                                        register("scrollToFieldIfFilled", scrollToFieldIfFilled);
                                        /* Go to next or prev step */
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
                                                        "Decime “finalizar campaña” “lanzar campaña” o usá el botón de la UI para activarla.",
                                                };
                                            }

                                            const next = clampStep(current + 1);
                                            setCurrent(next);
                                            sendStepSilentNote(next);

                                            return { success: true, advancedTo: next };
                                        });
                                        register("goToPrevModerationStep", () => {
                                            if (current <= 0) {
                                                return {
                                                    success: false,
                                                    atFirstStep: true,
                                                    message: "Ya estás en el primer paso; no se puede retroceder más.",
                                                };
                                            }

                                            const next = clampStep(current - 1);
                                            setCurrent(next);
                                            sendStepSilentNote(next);

                                            return { success: true, movedTo: next };
                                        });
                                        register("goNextNModerationStep", async (args: any) => {
                                            let target: number | null = toIndexStep(args?.step);
                                            if (target === null) {
                                                const byTopic = resolveStepFromTopic(args?.topic);
                                                if (byTopic !== null) target = byTopic;
                                            }
                                            if (target === null && Number.isFinite(args?.n)) {
                                                const delta = Number(args.n);
                                                target = clampStep(current + delta);
                                            }
                                            if (target === null) target = clampStep(current + 1);

                                            if (target === current) {
                                                return {
                                                    success: false,
                                                    message: `Ya estás en "${formatStepName(current)}".`,
                                                    currentStep: current,
                                                };
                                            }

                                            if (target < current) {
                                                setCurrent(target);
                                                sendStepSilentNote(target);
                                                return {
                                                    success: true,
                                                    movedTo: target,
                                                    label: formatStepName(target),
                                                    note: "Movimiento hacia atrás: no se requirió validación.",
                                                };
                                            }

                                            let ptr = current;
                                            while (ptr < target) {
                                                const ok = await saveCurrentStep();
                                                if (!ok) {
                                                    const r = checkModerationStepStatus({ step: ptr });
                                                    return {
                                                        success: false,
                                                        message: `Faltan completar datos antes de continuar desde "${formatStepName(ptr)}".`,
                                                        blockedAt: ptr,
                                                        targetStep: target,
                                                        ...r,
                                                    };
                                                }
                                                ptr += 1;
                                            }

                                            setCurrent(target);
                                            sendStepSilentNote(target);

                                            return {
                                                success: true,
                                                movedTo: target,
                                                label: formatStepName(target),
                                            };
                                        });

                                        register("goPrevNModerationStep", (args: any) => {
                                            let target: number | null = toIndexStep(args?.step);
                                            if (target === null) {
                                                const byTopic = resolveStepFromTopic(args?.topic);
                                                if (byTopic !== null) target = byTopic;
                                            }
                                            if (target === null && Number.isFinite(args?.n)) {
                                                const delta = Math.abs(Number(args.n));
                                                target = clampStep(current - delta);
                                            }
                                            if (target === null) target = clampStep(current - 1);

                                            if (target === current) {
                                                return {
                                                    success: false,
                                                    message: `Ya estás en "${formatStepName(current)}".`,
                                                    currentStep: current,
                                                };
                                            }
                                            if (target > current) {
                                                return {
                                                    success: false,
                                                    message:
                                                        `El objetivo (${formatStepName(target)}) está por delante de "${formatStepName(current)}". ` +
                                                        `Para avanzar, usá "goNextNModerationStep".`,
                                                    currentStep: current,
                                                    targetStep: target,
                                                };
                                            }

                                            setCurrent(target);
                                            sendStepSilentNote(target);

                                            return {
                                                success: true,
                                                movedTo: target,
                                                label: formatStepName(target),
                                                note: "Movimiento hacia atrás: no se requirió validación.",
                                            };
                                        });


                                        register("setModerationAssistantConfig", (args: any) => {
                                            const res = setModerationAssistantConfig(args);
                                            // según las props tocadas, scrollear a cada una
                                            const map: Array<[key: string, field: any, path: string[]]> = [
                                                ["name", "assistant.name", ["assistant", "name"]],
                                                ["greeting", "assistant.greeting", ["assistant", "greeting"]],
                                                ["logic", "assistant.logic", ["assistant", "logic"]],
                                            ];
                                            let delay = 0;
                                            map.forEach(([k, field, path]) => {
                                                const provided = k in (args || {});
                                                if (provided) {
                                                    const value = path.reduce((acc: any, kk) => acc?.[kk], data);
                                                    setTimeout(() => {
                                                        try { scrollToFieldIfFilled({ field: field as any, payload: data }); } catch { }
                                                    }, (delay += 200));
                                                }
                                            });
                                            return res;
                                        });
                                        register("explainAssistantVoiceFormat", (args: any) => {
                                            const r = explainAssistantVoiceFormat(args);
                                            try { scrollToModerationField({ field: "assistant.logic" as any }); } catch { }
                                            return r;
                                        });

                                        register("explainKnowledgeBaseUpload", (args: any) => {
                                            const r = explainKnowledgeBaseUpload(args);
                                            try { scrollToModerationField({ field: "knowHow" as any }); } catch { }
                                            return r;
                                        });

                                        const scrollKnowHow = () => { try { scrollToModerationField({ field: "knowHow" as any }); } catch { } };
                                        register("addModerationQAPair", (args: any) => { const r = addModerationQAPair(args); scrollKnowHow(); return r; });
                                        register("updateModerationQAMatch", (args: any) => { const r = updateModerationQAMatch(args); scrollKnowHow(); return r; });
                                        register("removeModerationQAMatch", (args: any) => { const r = removeModerationQAMatch(args); scrollKnowHow(); return r; });

                                        // Temas permitidos
                                        const scrollAllowed = () => { try { scrollToModerationField({ field: "allowedTopics" as any }); } catch { } };
                                        register("addModerationAllowedTopics", (args: any) => { const r = addModerationAllowedTopics(args); scrollAllowed(); return r; });
                                        register("removeModerationAllowedTopics", (args: any) => { const r = removeModerationAllowedTopics(args); scrollAllowed(); return r; });
                                        register("listModerationAllowedTopics", (args: any) => { const r = listModerationAllowedTopics(args); scrollAllowed(); return r; });


                                        // Escalamiento humano
                                        const scrollEscalation = () => { try { scrollToModerationField({ field: "escalation" as any }); } catch { } };
                                        register("addModerationEscalationCases", (args: any) => { const r = addModerationEscalationCases(args); scrollEscalation(); return r; });
                                        register("removeModerationEscalationCases", (args: any) => { const r = removeModerationEscalationCases(args); scrollEscalation(); return r; });
                                        register("listModerationEscalationCases", (args: any) => { const r = listModerationEscalationCases(args); scrollEscalation(); return r; });


                                        // Contacto
                                        register("setModerationContactNumber", (args: any) => {
                                            const r = setModerationContactNumber(args);
                                            try { scrollToModerationField({ field: "escalation.phone" as any }); } catch { }
                                            return r;
                                        });
                                        register("getModerationContactNumber", (args: any) => {
                                            const r = getModerationContactNumber(args);
                                            try { scrollToModerationField({ field: "escalation.phone" as any }); } catch { }
                                            return r;
                                        });
                                        // Calendar
                                        const scrollCalendars = () => { try { scrollToModerationField({ field: "calendars" as any }); } catch { } };
                                        register("explainAndEnableCalendars", (args: any) => { const r = explainAndEnableCalendars(args); scrollCalendars(); return r; });
                                        register("createModerationCalendar", (args: any) => { const r = createModerationCalendar(args); scrollCalendars(); return r; });
                                        register("updateModerationCalendarMeta", (args: any) => { const r = updateModerationCalendarMeta(args); scrollCalendars(); return r; });
                                        register("removeModerationCalendar", (args: any) => { const r = removeModerationCalendar(args); scrollCalendars(); return r; });
                                        register("toggleModerationCalendarDay", (args: any) => { const r = toggleModerationCalendarDay(args); scrollCalendars(); return r; });
                                        register("addModerationTimeSlot", (args: any) => { const r = addModerationTimeSlot(args); scrollCalendars(); return r; });
                                        register("addModerationTimeSlotsBulk", (args: any) => { const r = addModerationTimeSlotsBulk(args); scrollCalendars(); return r; });
                                        register("removeModerationTimeSlot", (args: any) => { const r = removeModerationTimeSlot(args); scrollCalendars(); return r; });

                                        register("finalizeModerationCampaign", finalizeCampaign);
                                        register("launchModerationCampaign", finalizeCampaign);
                                        register("createModerationCampaignNow", finalizeCampaign);

                                        register("resetModerationCampaignDraft", resetAndGoFirst);
                                        register("startNewModerationCampaign", resetAndGoFirst);
                                        register("clearModerationDraft", resetAndGoFirst);

                                        setToolsReady(true);
                                    }}
                                    autoKickoff
                                    kickoffMessage={
                                        uiLang === "en"
                                            ? "We are at Step 1 (Basics) of the moderation campaign wizard. Greet the user briefly, always answer in english, and then ask whether they prefer to start with the basic data or have you guide them step by step."
                                            : "Estamos en el Paso 1 (Datos básicos) del flujo de creación de la campaña de moderación. Saludá brevemente, respondé en el mismo idioma que use el usuario y preguntá si prefiere empezar por los datos básicos o que lo guíes paso a paso."
                                    }
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
                                            ? (saving ? (data.campaignId ? t("saving") : t("creating")) : t("next"))
                                            : current === 1
                                                ? (saving ? t("saving_channels") : t("next"))
                                                : current === 2
                                                    ? (saving ? t("saving_assistant") : t("next"))
                                                    : (saving ? t("creating") : t("create_campaign"))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </OnlineLayout>
            </div>
            {!showUI && (
                <div className="absolute inset-0 z-10">
                    <ModerationSkeleton />
                </div>
            )}
        </div>
    );
};

export default Moderation;
