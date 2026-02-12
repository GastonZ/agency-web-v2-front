
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import ProblemIllustration from "./ProblemIllustration";

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-flex items-center px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md text-white/70 text-xs sm:text-sm font-medium tracking-tight transition-colors hover:bg-white/[0.06] hover:text-white ${className}`}>
            {children}
        </span>
    );
}

export const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={32}
        height={33}
        viewBox="0 0 32 33"
        fill="none"
        className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${props.className || ''}`}
        {...props}
    >
        <g filter="url(#filter0_i_star)">
            <path
                d="M10.533 21.965L3.647 19.428A1 1 0 0 1 3 18.5c0-.415.259-.786.647-.929l6.886-2.537 2.537-6.887A1 1 0 0 1 14 7.5c.415 0 .786.259.928.647l2.537 6.886 6.887 2.538A1 1 0 0 1 25 18.5a1 1 0 0 1-.648.928l-6.887 2.537-2.537 6.887A1 1 0 0 1 14 29.5a1 1 0 0 1-.929-.648l-2.538-6.887Z"
                fill="#D9D9D9"
                fillOpacity="0.1"
            />
        </g>
        <path
            d="M10.533 21.965 3.647 19.428A1 1 0 0 1 3 18.5c0-.415.259-.786.647-.929l6.886-2.537 2.537-6.887A1 1 0 0 1 14 7.5c.415 0 .786.259.928.647l2.537 6.886 6.887 2.538A1 1 0 0 1 25 18.5a1 1 0 0 1-.648.928l-6.887 2.537-2.537 6.887A1 1 0 0 1 14 29.5a1 1 0 0 1-.929-.648l-2.538-6.887Z"
            stroke="url(#paint0_linear)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <defs>
            <linearGradient id="paint0_linear" x1="14" y1="7.5" x2="14" y2="29.5" gradientUnits="userSpaceOnUse">
                <stop offset="0.55" stopColor="white" />
                <stop offset="1" stopColor="#999999" />
            </linearGradient>
        </defs>
    </svg>
);

export default function WhoWeAre() {
    const { t } = useI18n()

    return (
        <section
            id="quienes-somos"
            className="relative w-full overflow-hidden"
        >
            {/* Dark Mask Transition - Softens the entry to the structure background */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none" />

            <div className="mx-auto max-w-7xl py-24 sm:py-32 px-4 relative z-10">
                {/* intelligence Intro */}
                {/* intelligence Intro - Hidden as requested */}
                {/* 
                <div className="grid lg:grid-cols-2 gap-20 items-center mb-32 sm:mb-48">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="space-y-12"
                    >
                        <div>
                            <Badge variant="outline" className="mb-6 bg-white/5 border-white/10 text-white/90 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md">
                                {t('whoWeAre.badge')}
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white leading-[1.3] tracking-tight max-w-4xl">
                                “{t('whoWeAre.mainQuote')}”
                            </h2>
                        </div>

                        <div className="space-y-8">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">
                                {t('whoWeAre.operationalText')}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {t('whoWeAre.automation.options').map((opt: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-white/[0.03] border-white/5 text-white/60 rounded-full px-4 py-2 text-xs font-medium backdrop-blur-md hover:bg-white/5 hover:text-white transition-colors">
                                        {opt}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2 }}
                        viewport={{ once: true }}
                        className="relative aspect-square max-w-md mx-auto lg:mx-0 flex items-center justify-center p-8 lg:p-12"
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="w-40 h-40 sm:w-56 sm:h-56 bg-white/[0.01] border border-white/10 rounded-full flex items-center justify-center relative backdrop-blur-sm group">
                                <div className="absolute inset-0 bg-white/[0.02] rounded-full animate-pulse" />
                                <StarIcon className="w-16 h-16 sm:w-24 sm:h-24 text-white relative z-10 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]" />

                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-2 border border-dashed border-white/10 rounded-full"
                                />
                            </div>

                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        rotate: i % 2 === 0 ? 360 : -360,
                                        scale: [1, 1.05, 1],
                                    }}
                                    transition={{
                                        rotate: { duration: 15 + i * 10, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    className="absolute border border-white/[0.05] rounded-full"
                                    style={{
                                        width: `${60 + i * 25}%`,
                                        height: `${60 + i * 25}%`,
                                        borderWidth: i === 3 ? '2px' : '1px',
                                        opacity: 1 - i * 0.2
                                    }}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/20 rounded-full blur-[1px] shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                    {i % 2 === 0 && (
                                        <div className="absolute bottom-1/4 right-0 w-1 h-1 bg-white/10 rounded-full" />
                                    )}
                                </motion.div>
                            ))}

                            <div className="absolute -inset-20 bg-gradient-radial from-white/[0.05] to-transparent blur-3xl rounded-full -z-10" />
                        </div>
                    </motion.div>
                </div>
                */}


                {/* Problem & Solution Section - More Dynamic */}
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1 relative"
                    >
                        <ProblemIllustration />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="space-y-12 order-1 lg:order-2"
                    >
                        <div className="space-y-8">
                            <h2 className="text-3xl lg:text-[36px] font-bold text-white leading-tight tracking-tight font-heading">
                                {t('whoWeAre.description').split('.')[0]}.
                            </h2>
                            <p className="text-lg text-white/40 leading-relaxed font-medium">
                                {t('whoWeAre.description').split('.').slice(1).join('.')}
                            </p>
                        </div>

                        <div className="relative p-10 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md overflow-hidden group/quote">

                            {/* Decorative Quote Icon */}
                            <div className="absolute -top-4 -left-2 text-white/5 font-serif text-[120px] pointer-events-none group-hover/quote:text-white/[0.08] transition-colors duration-700">“</div>

                            <div className="relative z-10 space-y-4">
                                <p className="text-white/80 font-medium text-xl leading-relaxed italic pr-4">
                                    "Datacivis transforma tus indicaciones en resultados: hablar es hacer."
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="h-px w-8 bg-white/20" />
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30">Misión Datacivis</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-40 text-center text-[10px] uppercase text-white/10 font-bold"
                >
                    {t('whoWeAre.disclaimer')}
                </motion.p>
            </div>
            
        </section>
    );
}

