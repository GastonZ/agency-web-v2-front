
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const ProblemIllustration = () => {
    const [isHovered, setIsHovered] = useState(false)

    // Using real AI icons with fixed offset positions relative to center
    const icons = [
        { src: "/chatgpt-icon.webp", name: "ChatGPT", x: -130, y: -110, delay: 0 },
        { src: "/claude-ai-icon.webp", name: "Claude", x: 130, y: -90, delay: 0.1 },
        { src: "/google-gemini-icon.webp", name: "Gemini", x: -110, y: 110, delay: 0.2 },
        { src: "/grok-icon.webp", name: "Grok", x: 120, y: 120, delay: 0.3 },
    ]

    return (
        <div
            className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center cursor-default bg-[#090909] rounded-[3rem] overflow-hidden border border-white/5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Circle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    animate={{
                        scale: isHovered ? 1.05 : 1,
                        opacity: isHovered ? 0.1 : 0.05
                    }}
                    className="w-[80%] h-[80%] border border-white/20 rounded-full"
                />
            </div>

            {/* Stage: Icon Logic */}
            <div className="relative w-full h-full">
                {/* AI Icons (Problem state) - Nested to avoid transform conflicts */}
                {icons.map((item, idx) => (
                    <div
                        key={idx}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20"
                    >
                        <motion.div
                            initial={false}
                            animate={{
                                x: isHovered ? 0 : item.x,
                                y: isHovered ? 0 : item.y,
                                opacity: isHovered ? 0 : 1,
                                scale: isHovered ? 0.2 : 1,
                            }}
                            transition={{
                                duration: 0.7,
                                ease: [0.16, 1, 0.3, 1],
                                delay: isHovered ? item.delay * 0.2 : 0
                            }}
                            className="w-full h-full p-1 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center will-change-transform"
                        >
                            <img src={item.src} alt={item.name} className="w-10 h-10 object-contain opacity-70" />

                            {/* Fragmented Indicator */}
                            {!isHovered && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#090909]" />
                            )}
                        </motion.div>
                    </div>
                ))}

                {/* Central Nucleus (Datacivis) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40">
                    <motion.div
                        animate={{
                            scale: isHovered ? 1 : 0.8,
                            opacity: isHovered ? 1 : 0.3,
                        }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full flex flex-col items-center justify-center"
                    >
                        <div className="relative mb-4">
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1.2 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-white/5 blur-[40px] rounded-full"
                                    />
                                )}
                            </AnimatePresence>

                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/[0.05] border border-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-2xl relative">
                                <img src="/datacivis-iso.svg" alt="Datacivis" className="w-14 h-14 object-contain" />
                            </div>
                        </div>

                        <span className="text-white font-bold tracking-[0.3em] uppercase text-[9px] absolute -bottom-2">
                            Datacivis OS
                        </span>
                    </motion.div>
                </div>


            </div>

            {/* Simple Status Badge */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <div className="px-5 py-2 bg-white/5 border border-white/5 rounded-full backdrop-blur-md flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-emerald-500' : 'bg-white/20'}`} />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold whitespace-nowrap">
                        {isHovered ? "Solución Unificada" : "Herramientas Aisladas"}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ProblemIllustration
