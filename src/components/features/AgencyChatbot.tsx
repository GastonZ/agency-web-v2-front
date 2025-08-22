import * as React from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";

type AgencyChatbotProps = {
    className?: string;
    placeholder?: string;
    onTextChange?: (v: string) => void;
    onMicClick?: () => void;
};

export default function AgencyChatbot({
    className = "",
    placeholder = "Type a message…",
    onTextChange,
    onMicClick,
}: AgencyChatbotProps) {
    const [text, setText] = React.useState("");

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

            <div className="absolute inset-0 grid place-items-center pointer-events-none">
                {/* Core glow */}
                <motion.div
                    className="rounded-full blur-2xl"
                    style={{
                        width: "14rem",
                        height: "14rem",
                        background:
                            "radial-gradient(closest-side, rgba(0,255,128,0.9), rgba(0,255,128,0.35) 60%, transparent 70%)",
                    }}
                    animate={{
                        scale: [1, 1.08, 1],
                        opacity: [0.7, 0.95, 0.7],
                        filter: ["blur(28px)", "blur(22px)", "blur(28px)"],
                    }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Soft ring 1 */}
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: "12rem",
                        height: "12rem",
                        boxShadow:
                            "0 0 0 1px rgba(0,255,128,0.4), inset 0 0 40px 10px rgba(0,255,128,0.15)",
                    }}
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.35, 0.6, 0.35],
                    }}
                    transition={{
                        duration: 5.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2,
                    }}
                />

                {/* Soft ring 2 */}
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: "18rem",
                        height: "18rem",
                        boxShadow:
                            "0 0 0 1px rgba(0,255,128,0.25), inset 0 0 32px 8px rgba(0,255,128,0.1)",
                    }}
                    animate={{
                        scale: [0.92, 1.08, 0.92],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 6.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.4,
                    }}
                />
            </div>


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
                    // hook up when you wire backend: send `text`
                }}
            >
                <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        onTextChange?.(e.target.value);
                    }}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent h-10 text-sm outline-none text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400"
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={onMicClick}
                    aria-label="Start voice input"
                    className={[
                        "inline-flex items-center justify-center",
                        "size-10 rounded-full",
                        "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                        "hover:opacity-90 focus:outline-none focus-visible:ring-2",
                        "focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600",
                        "transition-opacity",
                    ].join(" ")}
                >
                    <Mic className="h-4 w-4" />
                </button>
            </form>

            {/* Subtle top label (optional aesthetic) */}
            <div className="absolute top-3 left-0 right-0 text-center text-xs tracking-wider text-neutral-500 dark:text-neutral-400 select-none">
                AgencIAChatbot
            </div>
        </div>

    );
}
