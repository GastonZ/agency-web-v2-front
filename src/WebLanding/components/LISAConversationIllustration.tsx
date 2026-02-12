
import React from "react"
import { motion } from "framer-motion"

const LISAConversationIllustration = () => {
    return (
        <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center overflow-visible group">
            {/* Central LISA Node */}
            <div className="relative z-20">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-white blur-[60px] rounded-full"
                />

                <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-3xl relative shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                    <img src="/datacivis-iso.svg" alt="LISA" className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />

                    {/* Animated Pulsing Rings */}
                    <motion.div
                        animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 border border-white/20 rounded-[2.5rem]"
                    />
                </div>
            </div>

            {/* Connecting Entities */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {/* User Entity */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-4 -translate-x-4 sm:-translate-x-8"
                >
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-7 h-7 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black">Humano</span>
                </motion.div>

                {/* System/Goal Entity */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-4 translate-x-4 sm:translate-x-8"
                >
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-7 h-7 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-black">Resultados</span>
                </motion.div>
            </div>

            {/* Animated Data Streams */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 400 400">
                {/* Horizontal flow line logic (Simplified for seamless integration) */}
                <motion.path
                    d="M 50 200 L 350 200"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="4 8"
                />

                {/* Flow Particles */}
                <motion.circle r="1.5" fill="#fff" opacity="0.4">
                    <animateMotion dur="4s" repeatCount="indefinite" path="M 60 200 L 160 200" />
                </motion.circle>
                <motion.circle r="1.5" fill="#fff" opacity="0.4">
                    <animateMotion dur="3.5s" repeatCount="indefinite" path="M 240 200 L 340 200" begin="0.5s" />
                </motion.circle>
            </svg>

            {/* Floating Context Bubbles */}
            <motion.div
                animate={{ y: [0, -12, 0], x: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[20%] right-[20%] p-2.5 bg-white/[0.02] border border-white/10 rounded-xl backdrop-blur-md opacity-30"
            >
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                </div>
            </motion.div>
        </div>
    )
}

export default LISAConversationIllustration
