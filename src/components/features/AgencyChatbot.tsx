import * as React from "react";
import { motion } from "framer-motion";
import { Mic, ArrowUpToLine, X, Maximize2, Loader2, Ear, ChevronDown, ChevronRight } from "lucide-react";
import useWebRTCAudio from "../../AIconversational/voice/useWebRTCAudio";
import { navTools, useNavigationTools } from "../../AIconversational/voice";
import { uiTools, useThemeTool } from "../../AIconversational/voice/tools/useThemeTool";
import { botControlTools, useBotControlTools } from "../../AIconversational/voice/tools/useBotControlTools";

import { internalSummaryTool } from "../../AIconversational/voice/internal/internalSummaryTool";
// utilidades de persistencia genérica
import { useBotPersistence } from "../../AIconversational/voice/session/useBotPersistence";
import { loadBotSnapshot, buildBootInstructions } from "../../AIconversational/voice/session/persistence";

export type ToolSpec = {
    type: "function";
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties?: Record<string, any>;
        required?: string[] | readonly string[];
        additionalProperties?: boolean;
    };
};

type AgencyChatbotProps = {
    mode?: "classic" | "floating";
    extraTools?: ToolSpec[];
    onRegisterTools?: (register: (name: string, fn: Function) => void) => void;
    placeholder?: string;

    persistNamespace: string;
    userId: string;
    getBusinessSnapshot?: () => Record<string, any>;
    getLocalNote?: () => string | undefined;

    autoStart?: boolean;

    bootSummaryOverride?: string;

    onConversationChange?: (
        conversation: Array<{
            id: string;
            role: "user" | "assistant";
            text: string;
            isFinal?: boolean;
            timestamp?: string;
        }>
    ) => void;

    bootExtraInstructions?: string;
};

export default function AgencyChatbot({
    mode = "classic",
    extraTools = [],
    onRegisterTools,
    placeholder = "",

    persistNamespace,
    userId,
    getBusinessSnapshot,
    getLocalNote,

    autoStart = false,
    bootSummaryOverride,

    onConversationChange,
    bootExtraInstructions,
}: AgencyChatbotProps) {
    const baseTools: ToolSpec[] = React.useMemo(() => [...navTools, ...uiTools, ...botControlTools, internalSummaryTool as any], []);
    const tools = React.useMemo(() => [...baseTools, ...extraTools], [baseTools, extraTools]);

    const [rollingSummary, setRollingSummary] = React.useState<string>("");

    const getBootInstructions = React.useCallback(() => {
        const snap = loadBotSnapshot(persistNamespace, userId);

        // Si no hay nada de nada, devolvemos undefined
        if (!snap && !bootExtraInstructions && !rollingSummary && !bootSummaryOverride) return;

        // 1) Construimos el snapshot “mergeado”
        const merged: any = { ...(snap || {}), business: { ...(snap?.business || {}) } };

        const liveSummary =
            (bootSummaryOverride && String(bootSummaryOverride).trim()) ||
            (rollingSummary && String(rollingSummary).trim()) ||
            (merged.business?.__summary && String(merged.business.__summary).trim()) ||
            "";

        if (liveSummary) {
            merged.business.__summary = liveSummary;
        }

        // 2) Texto base
        const base = (buildBootInstructions(merged) || "").trim();

        // 3) Sección de resumen 
        const summarySection = liveSummary
            ? [
                "=== CONTEXTO RESUMEN (persistente) ===",
                "[RESUMEN_BOOT_BEGIN]",
                liveSummary,
                "[RESUMEN_BOOT_END]",
            ].join("\n")
            : "";

        // 4) Playbook / guía extra
        const extra = (bootExtraInstructions || "").trim();
        const extraSection = extra ? `=== GUÍA ESPECÍFICA DE ESTA VISTA ===\n${extra}` : "";

        // 5) Ensamblado final
        const finalText = [base, summarySection, extraSection].filter(Boolean).join("\n\n");

        // Logs
        console.groupCollapsed("[Chatbot][boot] instructions");
        console.log("hasSnapshot:", !!snap);
        console.log("hasSummaryOverride:", !!bootSummaryOverride, "len:", (bootSummaryOverride || "").length);
        console.log("hasRollingSummary:", !!rollingSummary, "len:", (rollingSummary || "").length);
        console.log("hasExtra:", !!extra);
        console.log("final.len:", finalText.length);
        console.log("final.preview:\n", finalText.slice(0, 800));
        console.groupEnd();

        try { (window as any).__ALMA_LAST_BOOT = { at: new Date().toISOString(), finalText }; } catch { }

        return finalText;
    }, [persistNamespace, userId, bootSummaryOverride, bootExtraInstructions, rollingSummary]);

    const {
        isSessionActive,
        handleStartStopClick,
        sendTextMessage,
        registerFunction,
        status,
        currentVolume,
        conversation,
        isStarting,
        isThinking,
        startSession,
        stopSession,

        sendSilentUserNote,
        updateSessionContext
    } = useWebRTCAudio("sage", tools as any, {
        autoStart,
        startDelayMs: 120,
        debugLogs: true,
        getBootInstructions,
    });

    const {
        goToCampaignSelection,
        goToMyCampaigns,
        goToListeningCreation,
        goToMarketingCreation,
        goToModerationCreation,
    } = useNavigationTools();

    const { changeTheme } = useThemeTool();
    const { deactivateAgent, activateAgent } = useBotControlTools({
        startSession,
        stopSession,
    });

    React.useEffect(() => {
        registerFunction("__setRollingSummary", async ({ summary }: { summary: string }) => {
            const clean = (summary || "").slice(0, 800);
            setRollingSummary(clean);

            setTimeout(() => updateSessionContext?.(), 50);

            return { ok: true };
        });
    }, [registerFunction, updateSessionContext]);

    React.useEffect(() => {
        registerFunction("goToCampaignSelection", goToCampaignSelection);
        registerFunction("goToMyCampaigns", goToMyCampaigns);
        registerFunction("goToListeningCreation", goToListeningCreation);
        registerFunction("goToMarketingCreation", goToMarketingCreation);
        registerFunction("goToModerationCreation", goToModerationCreation);
        registerFunction("changeTheme", changeTheme);
        registerFunction("deactivateAgent", deactivateAgent);
        registerFunction("activateAgent", activateAgent);
    }, [
        registerFunction,
        goToCampaignSelection,
        goToMyCampaigns,
        goToListeningCreation,
        goToMarketingCreation,
        goToModerationCreation,
        deactivateAgent,
        activateAgent,
        changeTheme,
    ]);

    React.useEffect(() => {
        if (onRegisterTools) onRegisterTools(registerFunction);
    }, [onRegisterTools, registerFunction]);

    React.useEffect(() => {
        onConversationChange?.(conversation);
    }, [conversation, onConversationChange]);

    const business = React.useMemo(
        () => (typeof getBusinessSnapshot === "function" ? getBusinessSnapshot() : {}),
        [getBusinessSnapshot]
    );
    const localNote = React.useMemo(
        () => (typeof getLocalNote === "function" ? getLocalNote() : undefined),
        [getLocalNote]
    );
    useBotPersistence({
        namespace: persistNamespace,
        userId,
        conversation,
        business,
        localNote,
        maxHistory: 999,
    });

    //  Silent note

    const refreshCtxDebouncedRef = React.useRef<number | null>(null);
    const refreshCtxDebounced = React.useCallback(() => {
        if (refreshCtxDebouncedRef.current) window.clearTimeout(refreshCtxDebouncedRef.current);
        refreshCtxDebouncedRef.current = window.setTimeout(() => {
            updateSessionContext();
        }, 350);
    }, [updateSessionContext]);

    React.useEffect(() => {
        function onManualChange(ev: any) {
            const d = ev?.detail || {};
            const label = d?.label || d?.field || "campo_desconocido";
            const val = typeof d?.value === "string" ? d.value : JSON.stringify(d?.value ?? "");
            const ns = d?.namespace ? `[${d.namespace}] ` : "";
            const note = `${ns}Cambio manual: "${label}" => ${val}`;
            sendSilentUserNote(note);
            refreshCtxDebounced();
        }

        window.addEventListener("agency:manual-change" as any, onManualChange);
        return () => window.removeEventListener("agency:manual-change" as any, onManualChange);
    }, [sendSilentUserNote, refreshCtxDebounced]);

    // UI state
    const [text, setText] = React.useState("");
    const glowScale = isSessionActive ? 1 + Math.min(currentVolume * 2.5, 0.25) : 1;
    const glowOpacity = isSessionActive ? Math.min(0.7 + currentVolume * 1.2, 1) : 0.7;

    // ==== Observer + bubble state ====
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const [isMostlyHidden, setIsMostlyHidden] = React.useState(false);
    const [bubbleOpen, setBubbleOpen] = React.useState(false);
    const [overlayOpen, setOverlayOpen] = React.useState(false);

    React.useEffect(() => {
        const el = panelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                setIsMostlyHidden(entry.intersectionRatio < 0.3);
            },
            { root: null, threshold: [0, 0.25, 0.3, 0.5, 0.75, 1] }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const scrollToPanel = React.useCallback(() => {
        setBubbleOpen(false);
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    React.useEffect(() => {
        // si la sesión está activa, empujamos nuevas instrucciones
        if (!isSessionActive) return;
        // Esperá  para aglutinar cambios rápidos de UI
        const id = window.setTimeout(() => {
            try { updateSessionContext?.(); } catch { }
        }, 150);
        return () => window.clearTimeout(id);
    }, [
        isSessionActive,
        bootSummaryOverride,
        bootExtraInstructions,

        getBusinessSnapshot,
        getLocalNote,
    ]);

    const ChatPanel = (
        <div
            className={[
                "relative w-full h-[460px]",
                "rounded-2xl border shadow-sm overflow-hidden",
                "bg-white/80 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60",
                "border-neutral-200 dark:border-neutral-800"
            ].join(" ")}
        >
            {/* BG glow */}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <motion.div
                    className="rounded-full blur-2xl"
                    style={{
                        width: "14rem",
                        height: "14rem",
                        background:
                            "radial-gradient(closest-side, rgba(0,255,128,0.9), rgba(0,255,128,0.35) 60%, transparent 70%)",
                    }}
                    animate={{
                        scale: [glowScale, glowScale + 0.06, glowScale],
                        opacity: [glowOpacity, Math.min(glowOpacity + 0.15, 1), glowOpacity],
                        filter: ["blur(28px)", "blur(22px)", "blur(28px)"],
                    }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Estado */}
            <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-md bg-white/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700">
                {isSessionActive ? "Escuchando…" : "Listo"} <span className="opacity-60 ml-2">({status || "idle"})</span>
            </div>

            <div className="absolute top-3 right-3 text-xs tracking-wider text-neutral-500 dark:text-neutral-400 select-none">
                LISA Chatbot
            </div>

            {/* HISTORIAL */}
            <div className="absolute inset-x-3 top-10 bottom-16 overflow-y-auto space-y-2 pr-1">
                {conversation.map((m) => (
                    <div
                        key={m.id}
                        className={[
                            "max-w-[85%] px-0 py-0 rounded-lg text-sm",
                            "whitespace-pre-wrap leading-relaxed",
                            m.role === "user" ? "ml-auto text-emerald-300" : "mr-auto text-black dark:text-neutral-200",
                        ].join(" ")}
                    >
                        {m.text}
                    </div>
                ))}
            </div>

            {/* Input + Mic */}
            <form
                className={[
                    "absolute left-3 right-3 bottom-3",
                    "flex items-center gap-2",
                    "rounded-xl px-3 py-2",
                    "bg-white/75 dark:bg-neutral-900/70 backdrop-blur",
                    "ring-1 ring-neutral-200 dark:ring-neutral-800",
                ].join(" ")}
                onSubmit={(e) => {
                    e.preventDefault();
                    const v = text.trim();
                    if (!v) return;
                    sendTextMessage(v);
                    setText("");
                }}
            >
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent h-10 text-sm outline-none text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400"
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={handleStartStopClick}
                    aria-label={isSessionActive ? "Stop voice input" : "Start voice input"}
                    aria-pressed={isSessionActive}
                    className={[
                        "inline-flex items-center justify-center",
                        "size-10 rounded-full transition-all",
                        isSessionActive
                            ? "bg-emerald-500 text-white ring-2 ring-emerald-400/60 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]"
                            : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600",
                    ].join(" ")}
                    style={
                        isSessionActive
                            ? { boxShadow: `0 0 0 ${Math.min(10, 4 + currentVolume * 30)}px rgba(16,185,129,0.12)` }
                            : undefined
                    }
                    title={isSessionActive ? "Detener micrófono" : "Hablar con IA"}
                >
                    <Mic className="h-4 w-4" />
                </button>
            </form>
        </div>
    );

    if (mode === "classic") {
        return ChatPanel;
    }

    const TALKING_THRESHOLD = 0.02;
    const isTalking = isSessionActive && currentVolume > TALKING_THRESHOLD;

    return (
        <>
            <div className="fixed bottom-20 right-20 z-50">
                <div
                    className={[
                        "absolute -top-3 right-[15px] translate-y-[-100%]",
                        "px-3 py-2 rounded-xl text-[12px] font-medium",
                        "shadow-sm border",
                        "bg-white/95 dark:bg-neutral-900/90",
                        "border-neutral-200 dark:border-neutral-700",
                        "backdrop-blur supports-[backdrop-filter]:bg-white/80",
                        "flex items-center gap-2 select-none",
                        bubbleOpen ? "opacity-0 pointer-events-none" : "opacity-100",
                    ].join(" ")}
                >

                    {!isSessionActive ? (
                        isStarting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin opacity-90" />
                                <span>Iniciando…</span>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Inactiva…</span>
                                <span className="opacity-70">click</span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                                <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                                <Mic className="h-3.5 w-3.5 opacity-90" />
                            </div>
                        )
                    ) : isThinking ? (
                        <div className="flex items-center gap-2">
                            <span className="sr-only">Pensando…</span>
                            <div className="flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "120ms" }} />
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "240ms" }} />
                            </div>
                            <span>Pensando…</span>
                        </div>
                    ) : isTalking ? (
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Hablando…</span>
                        </div>
                    ) : (
                        <>
                            <Ear className="h-3.5 w-3.5 opacity-90" />
                            <span>Te escucho…</span>
                        </>
                    )}
                    <div
                        className="absolute -bottom-1 right-3 h-2 w-2 rotate-45
               bg-white/95 dark:bg-neutral-900/90 border-r border-b
               border-neutral-200 dark:border-neutral-700"
                    />
                </div>
                <motion.button
                    type="button"
                    onClick={() => setBubbleOpen((v) => !v)}
                    aria-expanded={bubbleOpen}
                    className={[
                        "relative rounded-full shadow-lg transition-all",
                        "backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
                        bubbleOpen
                            ? "border border-white/10 dark:border-white/60 bg-white/10 dark:bg-neutral-900/40"
                            : isTalking
                                ? "border-transparent bg-transparent"
                                : "border border-white/10 dark:border-white/60 bg-white/10 dark:bg-neutral-900/40",
                    ].join(" ")}
                    style={{
                        width: bubbleOpen ? 260 : 64,
                        height: bubbleOpen ? 84 : 64,
                    }}
                    whileTap={{ scale: 0.98 }}
                    animate={{ scale: bubbleOpen ? 1 : (isTalking ? [1, 1.06, 1] : 1) }}
                    transition={{ duration: 0.9, repeat: bubbleOpen ? 0 : (isTalking ? Infinity : 0), ease: "easeInOut" }}
                    title={bubbleOpen ? "Ocultar opciones" : "Abrir opciones"}
                >
                    {/* orb */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none rounded-full"
                        style={{ filter: bubbleOpen ? "blur(18px)" : "blur(22px)" }}
                        animate={{
                            boxShadow: isTalking
                                ? `0 0 ${18 + Math.min(40, currentVolume * 120)}px rgba(16,185,129,0.95) inset,
                   0 0 28px rgba(16,185,129,0.45)`
                                : `0 0 ${bubbleOpen ? 24 : 20}px rgba(16,185,129,0.45) inset`,
                            opacity: isTalking ? 1 : 0.9,
                        }}
                        transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    />

                    {/* contenido */}
                    {bubbleOpen ? (
                        <div className="relative h-full w-full flex items-center justify-between px-3">
                            {/* Mic toggle */}
                            <div
                                onClick={(e) => { e.stopPropagation(); handleStartStopClick(); setBubbleOpen(!bubbleOpen) }}
                                className={[
                                    "inline-flex items-center justify-center rounded-full",
                                    "h-10 w-10 border transition-colors",
                                    isSessionActive
                                        ? "bg-emerald-500 text-white border-emerald-400/60"
                                        : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-white/20",
                                ].join(" ")}
                                title={isSessionActive ? "Detener micrófono" : "Hablar con IA"}
                            >
                                <Mic className="h-5 w-5" />
                            </div>

                            {/* Agrandar => abre overlay con panel grande */}
                            <div
                                onClick={(e) => { e.stopPropagation(); setOverlayOpen(true); }}
                                className="inline-flex items-center justify-center h-10 px-3 rounded-lg text-sm border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/40"
                                title="Agrandar panel"
                            >
                                <Maximize2 className="h-4 w-4" />
                                <span className="ml-2">Agrandar</span>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 grid place-items-center">
                            <motion.div
                                className="rounded-full"
                                style={{
                                    width: 26,
                                    height: 26,
                                    background:
                                        isTalking
                                            ? "radial-gradient(closest-side, rgba(16,185,129,1), rgba(16,185,129,0.55) 60%, transparent 70%)"
                                            : "radial-gradient(closest-side, rgba(16,185,129,0.95), rgba(16,185,129,0.5) 60%, transparent 70%)",
                                }}
                                animate={{
                                    scale: isTalking ? [1, 1.12, 1] : [1, 1.06, 1],
                                    opacity: isTalking ? [1, 0.92, 1] : [0.85, 0.95, 0.85],
                                }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    )}
                </motion.button>
            </div>

            {/* Overlay con panel grande DRAGGABLE */}
            {overlayOpen && (
                <div className="fixed inset-0 pointer-events-none z-[60]">
                    {/* Panel draggable en el centro, sin backdrop */}
                    <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0.12}
                        className={[
                            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                            "w-[min(900px,92vw)] pointer-events-auto z-[61]",
                        ].join(" ")}
                        style={{ cursor: "grab" }}
                        whileTap={{ cursor: "grabbing" }}
                    >
                        <div className="relative">
                            {/* botón cerrar con z por encima */}
                            <button
                                type="button"
                                onClick={() => setOverlayOpen(false)}
                                className="absolute -top-3 -right-3 h-8 w-8 rounded-full grid place-items-center border border-white/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm hover:opacity-90 z-[62]"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {ChatPanel}
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}