"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    // Borde gradiente blanco→#999 (igual que tus headings) usando wrapper + padding
    return (
        <span className={`relative inline-flex p-[.5px] py-0 bg-white/5 shadow-[inset_0px_0px_16px_0px_rgba(255,255,255,0.15)] outline outline-1 outline-offset-[-1px] outline-white/10 backdrop-blur-[5px] ${className}`}>
            <div className="w-1 h-1 sm:w-2 sm:h-2 border-l-2 border-b-2 border-white/50 absolute bottom-0 left-0"></div>
            <div className="w-1 h-1 sm:w-2 sm:h-2 border-r-2 border-b-2 border-white/50 absolute bottom-0 right-0"></div>
            <div className="w-1 h-1 sm:w-2 sm:h-2 border-r-2 border-t-2 border-white/50 absolute top-0 right-0"></div>
            <div className="w-1 h-1 sm:w-2 sm:h-2 border-l-2 border-t-2 border-white/50 absolute top-0 left-0"></div>
            <span className="inline-flex items-center bg-[#090909]/80 px-2 sm:px-3 py-1 sm:py-1.5 leading-tight tracking-tight bg-gradient-to-b from-white from-[55%] to-[#999] bg-clip-text text-transparent text-xs sm:text-sm">
                {children}
            </span>
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
        <path d="M22 2.5v6" stroke="url(#paint1_linear)" strokeWidth={1.5} strokeLinecap="round" />
        <path d="M28 9.5v4" stroke="url(#paint2_linear)" strokeWidth={1.5} strokeLinecap="round" />
        <path d="M19 5.5h6" stroke="url(#paint3_linear)" strokeWidth={1.5} strokeLinecap="round" />
        <path d="M26 11.5h4" stroke="url(#paint4_linear)" strokeWidth={1.5} strokeLinecap="round" />
        <defs>
            <filter
                id="filter0_i_star"
                x="2.25"
                y="6.75"
                width="23.5"
                height="23.5"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
            >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                />
                <feOffset />
                <feGaussianBlur stdDeviation="5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0"
                />
                <feBlend in2="shape" result="effect1_innerShadow" />
            </filter>
            <linearGradient id="paint0_linear" x1="14" y1="7.5" x2="14" y2="29.5" gradientUnits="userSpaceOnUse">
                <stop offset="0.55" stopColor="white" />
                <stop offset="1" stopColor="#999999" />
            </linearGradient>
            <linearGradient id="paint1_linear" x1="22.5" y1="2.5" x2="22.5" y2="8.5" gradientUnits="userSpaceOnUse">
                <stop offset="0.55" stopColor="white" />
                <stop offset="1" stopColor="#999999" />
            </linearGradient>
            <linearGradient id="paint2_linear" x1="28.5" y1="9.5" x2="28.5" y2="13.5" gradientUnits="userSpaceOnUse">
                <stop offset="0.55" stopColor="white" />
                <stop offset="1" stopColor="#999999" />
            </linearGradient>
            <linearGradient id="paint3_linear" x1="22" y1="5.5" x2="22" y2="6.5" gradientUnits="userSpaceOnUse">
                <stop offset="0.55" stopColor="white" />
                <stop offset="1" stopColor="#999999" />
            </linearGradient>
            <linearGradient id="paint4_linear" x1="28" y1="11.5" x2="28" y2="12.5" gradientUnits="userSpaceOnUse">
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
            aria-labelledby="who-we-are-title"
            className="relative w-full border-t border-gray-200"
            itemScope
            itemType="https://schema.org/Organization"
        >
            <div className="mx-auto max-w-7xl py-12 sm:py-16 md:py-20 lg:py-24 px-3 sm:px-4 md:px-6 lg:px-8">
                {/* Título H2 SEO (el H1 queda en el hero) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.3 }}
                    className="flex justify-center"
                >
                        <Badge variant="outline" className="mb-3 sm:mb-4 md:mb-6 bg-white border-gray-200 text-gray-800 rounded-full px-6 py-2 text-sm font-medium shadow-sm">
                            {t('whoWeAre.badge')}
                        </Badge>
                </motion.div>
                
                {/* H2 principal para accesibilidad */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    id="who-we-are-title"
                    className="font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4 text-center"
                >
                    {t('whoWeAre.title')}
                </motion.h2>
                {/* Frase principal con pills como en tu diseño */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.3 }}
                    className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 text-center font-heading"
                >
                        <div className="mx-auto max-w-xs sm:max-w-xl md:max-w-2xl text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl tracking-tight text-gray-700 leading-relaxed px-2 sm:px-4">
                            {t('whoWeAre.mainQuote')}
                        </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                        viewport={{ once: true, amount: 0.3 }}
                        className="mt-4 sm:mt-6 md:mt-8 flex flex-col items-center gap-2 sm:gap-3 text-gray-600"
                    >
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base lg:text-lg flex-wrap justify-center">
                            <StarIcon />
                            <span>{t('whoWeAre.operationalText')}</span>

                            <Pill className="align-baseline">
                                {/* Accesibilidad */}
                                <span className="sr-only">
                                    {t('whoWeAre.automation.options').join(', ')}
                                </span>

                                {/* Carril: altura = line-height */}
                                <span
                                    aria-hidden="true"
                                    className="relative block overflow-hidden min-w-[24ch] h-[var(--roller-h)] [--roller-h:1.5rem] sm:[--roller-h:1.5rem]"
                                >
                                    {/* Fantasma para fijar ancho */}
                                    <span className="absolute inset-0 opacity-0 pointer-events-none whitespace-nowrap">
                                        {t('whoWeAre.automation.options')[3]}
                                    </span>

                                    {/* Pista */}
                                    <span className="words-roller block bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent">
                                        {t('whoWeAre.automation.options').map((option: any, index: number) => (
                                            <span key={index} className="block whitespace-nowrap h-[var(--roller-h)]">{option}</span>
                                        ))}
                                        <span className="block whitespace-nowrap h-[var(--roller-h)]">{t('whoWeAre.automation.options')[0]}</span>
                                    </span>
                                </span>
                            </Pill>

                        </div>
                        <p className="mt-4 sm:mt-6 max-w-xs sm:max-w-2xl md:max-w-3xl text-xs sm:text-sm leading-relaxed text-gray-500 px-2 sm:px-4 font-body">
                            {t('whoWeAre.disclaimer')}
                        </p>
                    </motion.div>
                </motion.div>

            </div>

        </section>
    );
}
