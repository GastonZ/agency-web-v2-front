// src/components/AgencyChatbot.tsx
import * as React from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import useWebRTCAudio from "../../AIconversational/voice/useWebRTCAudio";
import { navTools, useNavigationTools } from "../../AIconversational/voice/tools/useNavigationTools";
import { uiTools, useThemeTool } from "../../AIconversational/voice/tools/useThemeTool";

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
    extraTools?: ToolSpec[];
    onRegisterTools?: (register: (name: string, fn: Function) => void) => void;
};

export default function AgencyChatbot({
    extraTools = [],
    onRegisterTools,
}: AgencyChatbotProps) {
    // 1) SÓLO SCHEMAS en baseTools
    const baseTools: ToolSpec[] = React.useMemo(
        () => [...navTools, ...uiTools],
        []
    );
    const tools = React.useMemo(() => [...baseTools, ...extraTools], [baseTools, extraTools]);
    const {
        isSessionActive,
        handleStartStopClick,
        sendTextMessage,
        registerFunction,
        status,
        currentVolume,
        conversation, // 👈 lo vamos a renderizar
    } = useWebRTCAudio("ash", tools as any);

    const { goToCampaignSelection, goToMyCampaigns, goToListeningCreation, goToMarketingCreation, goToModerationCreation } = useNavigationTools();
    const { changeTheme } = useThemeTool();

    // permitir que el padre registre funciones (ej: las del Moderation context)
    React.useEffect(() => {
        registerFunction("goToCampaignSelection", goToCampaignSelection);
        registerFunction("goToMyCampaigns", goToMyCampaigns);
        registerFunction("goToListeningCreation", goToListeningCreation);
        registerFunction("goToMarketingCreation", goToMarketingCreation);
        registerFunction("goToModerationCreation", goToModerationCreation);
        registerFunction("changeTheme", changeTheme);
    }, [
        registerFunction,
        goToCampaignSelection, goToMyCampaigns, goToListeningCreation, goToMarketingCreation, goToModerationCreation,
        changeTheme
    ]);

    React.useEffect(() => {
        if (onRegisterTools) onRegisterTools(registerFunction);
    }, [onRegisterTools, registerFunction]);

    const [text, setText] = React.useState("");
    const glowScale = isSessionActive ? 1 + Math.min(currentVolume * 2.5, 0.25) : 1;
    const glowOpacity = isSessionActive ? Math.min(0.7 + currentVolume * 1.2, 1) : 0.7;

    return (
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
                AgencIAChatbot
            </div>

            {/* HISTORIAL */}
            <div className="absolute inset-x-3 top-10 bottom-16 overflow-y-auto space-y-2 pr-1">
                {conversation.map((m) => (
                    <div
                        key={m.id}
                        className={[
                            "max-w-[85%] px-0 py-0 rounded-lg text-sm",
                            "whitespace-pre-wrap leading-relaxed",
                            m.role === "user"
                                ? "ml-auto text-emerald-300"
                                : "mr-auto text-neutral-200",
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
                    placeholder={''}
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
}
