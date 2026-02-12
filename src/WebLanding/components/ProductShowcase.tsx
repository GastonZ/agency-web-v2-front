
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import {
    IconMessageChatbot,
    IconTrendingUp,
    IconUsers,
    IconBolt,
    IconCircleCheckFilled,
    IconMouse
} from "@tabler/icons-react";

export default function ProductShowcase() {
    const { t } = useI18n();

    return (
        <section id="demo" className="relative w-full border-t border-white/[0.08] bg-[#090909] py-24 sm:py-32 overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)] pointer-events-none" />

            <div className="mx-auto max-w-7xl px-4 relative z-10">
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 sm:mb-24 px-4"
                >
                    <Badge variant="outline" className="mb-6 bg-white/5 border-white/10 text-white/90 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md mx-auto">
                        Product Experience
                    </Badge>
                    <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white tracking-tight mb-8 max-w-4xl mx-auto leading-[1.2]">
                        Automatización Conversacional <br />
                        <span className="text-white/40 italic font-medium">diseñada para el Crecimiento.</span>
                    </h2>
                    <p className="text-white/40 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                        No es solo un dashboard. Es LISA, tu copiloto de growth que entiende objetivos complejos y los ejecuta en todos tus canales.
                    </p>
                </motion.header>

                {/* The Dashboard Mockup Container */}
                <div className="relative max-w-6xl mx-auto p-4 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden group">

                    {/* Animated Border Ray - Reused from Footer concept */}
                    <motion.div
                        animate={{
                            x: ['-100%', '100%'],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />

                    <div className="grid lg:grid-cols-12 gap-8 items-start relative z-10">
                        {/* Sidebar / Menu Preview */}
                        <div className="hidden lg:block lg:col-span-1 space-y-8 pt-4">
                            {[IconBolt, IconUsers, IconMessageChatbot, IconTrendingUp].map((Icon, i) => (
                                <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${i === 2 ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}>
                                    <Icon size={20} />
                                </div>
                            ))}
                        </div>

                        {/* Main Canvas Area */}
                        <div className="lg:col-span-11 grid md:grid-cols-2 gap-8">

                            {/* LISA Conversational UI Mockup */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-[10px]">L</div>
                                        <span className="text-white font-bold text-sm">LISA AI</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                                        <p className="text-white/80 text-sm leading-relaxed">
                                            LISA, necesito escalar nuestra campaña de Meta Ads. Optimiza el presupuesto hacia los leads con mayor scoring de CRM.
                                        </p>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-white text-black p-4 rounded-2xl rounded-tr-none ml-auto max-w-[85%] shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <IconCircleCheckFilled size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Acción Ejecutada</span>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed">
                                            Entendido. He reasignado $2.5k usd a el set de anuncios "High Intent" y activado el funnel de WhatsApp automático para leads grado A.
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Simulated typing */}
                                <div className="absolute bottom-6 left-6 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>

                            {/* Growth Metrics / Stats Mockup */}
                            <div className="space-y-6">
                                <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 space-y-6 relative group/card">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mb-1">Costo por Lead</p>
                                            <h4 className="text-3xl font-bold text-white leading-none">$1.42</h4>
                                        </div>
                                        <div className="bg-green-500/10 text-green-400 px-2 py-1 rounded-md text-[10px] font-bold">
                                            -24%
                                        </div>
                                    </div>

                                    {/* Visual Chart Placeholder */}
                                    <div className="h-24 w-full flex items-end gap-1 px-1">
                                        {[40, 60, 45, 78, 55, 90, 65, 80, 70, 95].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${h}%` }}
                                                transition={{ delay: i * 0.05, duration: 0.8 }}
                                                className={`flex-grow rounded-t-sm ${i === 9 ? 'bg-white' : 'bg-white/10'}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Absolute mouse indicator for interactive feel */}
                                    <motion.div
                                        animate={{
                                            x: [100, 150, 120, 180],
                                            y: [30, 10, 50, 20]
                                        }}
                                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-1/2 right-1/4 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                    >
                                        <IconMouse className="text-white/40" size={24} />
                                    </motion.div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                                        <p className="text-white/30 text-[9px] uppercase font-bold tracking-widest mb-1">Conversiones</p>
                                        <h5 className="text-xl font-bold text-white">4.2k</h5>
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                                        <p className="text-white/30 text-[9px] uppercase font-bold tracking-widest mb-1">Automated Tasks</p>
                                        <h5 className="text-xl font-bold text-white">12.8k</h5>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Feature Pills under the showcase */}
                <div className="mt-16 flex flex-wrap justify-center gap-4">
                    {["Meta Ads Integration", "LISA AI Copilot", "Growth Flow Canvas", "WhatsApp Business API", "Real-time Analytics"].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="px-6 py-3 rounded-full bg-white/[0.02] border border-white/10 text-white/50 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
                        >
                            {item}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
