import * as React from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import useWebRTCAudio from "../../AIconversational/voice/useWebRTCAudio";
import { useNavigationTools } from "../../AIconversational/voice/tools/useNavigationTools";
import { useThemeTool } from "../../AIconversational/voice/tools/useThemeTool";
import { tools } from "../../AIconversational/voice/toolsSchema";

type Props = {
    className?: string;
    placeholder?: string;
};

export default function AgencyChatbot({
    className = "",
    placeholder = "Decime a dónde ir… (p.ej. “ver mis campañas”)",
}: Props) {
    const [text, setText] = React.useState("");

    const { isSessionActive, handleStartStopClick, sendTextMessage, registerFunction, status, currentVolume } =
        useWebRTCAudio("ash", tools as any);

    const { goToCampaignSelection, goToMyCampaigns } = useNavigationTools();
    const { changeTheme } = useThemeTool();

    React.useEffect(() => {
        registerFunction("goToCampaignSelection", goToCampaignSelection);
        registerFunction("goToMyCampaigns", goToMyCampaigns);
        registerFunction("changeTheme", changeTheme);
    }, [registerFunction, goToCampaignSelection, goToMyCampaigns]);

    const glowScale = isSessionActive ? 1 + Math.min(currentVolume * 2.5, 0.25) : 1;
    const glowOpacity = isSessionActive ? Math.min(0.7 + currentVolume * 1.2, 1) : 0.7;

    return (
        <div
            className={[
                "relative w-full h-[460px]",
                "rounded-2xl border shadow-sm overflow-hidden",
                "bg-white/80 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60",
                "border-neutral-200 dark:border-neutral-800",
                className,
            ].join(" ")}
        >
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(120% 120% at 10% 10%, rgba(99,102,241,0.10) 0%, transparent 50%), radial-gradient(120% 120% at 90% 90%, rgba(16,185,129,0.10) 0%, transparent 50%)",
                }}
                aria-hidden
            />

            {/* Glow dinámico */}
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

            {/* Label */}
            <div className="absolute top-3 right-3 text-xs tracking-wider text-neutral-500 dark:text-neutral-400 select-none">
                AgencIAChatbot
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
}