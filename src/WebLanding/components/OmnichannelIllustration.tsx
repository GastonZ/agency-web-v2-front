
import React, { useEffect, useRef } from "react"
import { motion, useSpring, useTransform, useInView } from "framer-motion"

const NumberTicker = ({ value, duration = 2, delay = 0, prefix = "", suffix = "", decimalPlaces = 1 }: { value: number, duration?: number, delay?: number, prefix?: string, suffix?: string, decimalPlaces?: number }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const spring = useSpring(0, {
        mass: 1,
        stiffness: 50,
        damping: 20,
    });

    const displayValue = useTransform(spring, (current) =>
        `${prefix}${current.toFixed(decimalPlaces)}${suffix}`
    );

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => {
                spring.set(value);
            }, delay * 1000);
            return () => clearTimeout(timer);
        }
    }, [isInView, value, spring, delay]);

    return <motion.span ref={ref}>{displayValue}</motion.span>;
};

const OmnichannelIllustration = () => {
    const campaigns = [
        { name: "Winter Sale '25", status: "Active", reach: "12.4k" },
        { name: "Brand Awareness", status: "Paused", reach: "45.1k" },
        { name: "Lead Gen Meta", status: "Active", reach: "8.2k" }
    ]

    const ads = [
        { title: "Carousel Ad V1", growth: "+14%", color: "bg-emerald-400" },
        { title: "Video Reels Opt", growth: "+9%", color: "bg-emerald-700" }
    ]

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Premium Digital Mesh Background */}
            <div className="absolute inset-0 bg-[#0a0a0a]">
                {/* Slow-moving Aurora Blobs */}
                <motion.div
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[130px] rounded-full"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-emerald-900/10 blur-[150px] rounded-full"
                />
            </div>

            {/* High-Precision Technical Grid */}
            <div className="absolute inset-0 opacity-[0.2]"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)
                    `,
                    backgroundSize: '24px 24px'
                }} />

            {/* Subtle Inner Perimeter Glow */}
            <div className="absolute inset-0 border-[1px] border-white/[0.03] rounded-[inherit] m-[1px]" />

            {/* Main SaaS Dashboard Mockup */}
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 70 }}
                className="absolute right-[5%] top-[25%] w-[88%] h-[90%] bg-[#0b0b0b] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header Section */}
                <div className="h-10 border-b border-white/5 bg-white/[0.02] px-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="text-[7px] font-black tracking-widest text-white/20 uppercase">Entorno: Producción</div>
                        <div className="h-4 w-12 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-5 grid grid-cols-12 gap-5 h-full">
                    {/* Left: Campaign List */}
                    <div className="col-span-4 space-y-3">
                        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Campañas</div>
                        {campaigns.map((camp, i) => (
                            <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="text-[9px] font-bold text-white/70">{camp.name}</div>
                                    <div className={`w-1.5 h-1.5 rounded-full ${camp.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                                </div>
                                <div className="flex justify-between items-center opacity-40">
                                    <div className="text-[7px] font-black uppercase tracking-tighter">Alcance: {camp.reach}</div>
                                    <div className="text-[7px] font-black uppercase tracking-tighter">{camp.status === 'Active' ? 'Activa' : 'Pausada'}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Analytics & Ads Table */}
                    <div className="col-span-8 flex flex-col gap-5">
                        {/* Analytics Card */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[7px] uppercase font-black text-white/30 tracking-widest mb-1">CPA Promedio</div>
                                    <div className="text-xl font-bold text-white font-heading tracking-tight leading-none">
                                        <NumberTicker value={12.42} prefix="$" decimalPlaces={2} delay={1} />
                                    </div>
                                    <div className="text-[8px] font-bold text-emerald-500 mt-1">-3.1% vs anterior</div>
                                </div>
                                <div className="h-10 w-28 pr-2">
                                    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                                        <motion.path
                                            d="M 0 35 Q 25 10 50 25 T 100 5 V 40 H 0 Z"
                                            fill="rgba(52, 211, 153, 0.05)"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            transition={{ duration: 1.5 }}
                                        />
                                        <motion.path
                                            d="M 0 32 Q 25 8 50 20 T 100 5"
                                            stroke="#10b981"
                                            strokeWidth="1.5"
                                            fill="none"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            transition={{ duration: 1.5 }}
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Top Ads Mock Table */}
                        <div className="space-y-2">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Ads de Alta Eficiencia</div>
                            {ads.map((ad, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 bg-white/[0.01] border border-white/5 rounded-lg group/ad transition-colors hover:bg-white/[0.03]">
                                    <div className={`w-8 h-8 rounded bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center`} />
                                    <div className="flex-1">
                                        <div className="text-[9px] font-bold text-white/60 mb-0.5">{ad.title}</div>
                                        <div className="text-[7px] font-black text-white/20 uppercase tracking-tighter">Seguimiento Activo</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-emerald-500">{ad.growth}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Performance Metric Overlay (Floating like a SaaS widget) */}
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[8%] bottom-[15%] w-40 p-4 bg-[#0d0d0d] border border-white/20 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-30"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                    </div>
                    <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">Índice Crecimiento</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white tracking-tighter">
                        <NumberTicker value={4.8} delay={1.2} />
                    </span>
                    <span className="text-[9px] font-black text-emerald-600">X</span>
                </div>
                <div className="mt-3 space-y-1.5">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '84%' }}
                            transition={{ duration: 1.2, delay: 0.5 }}
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        />
                    </div>
                    <div className="flex justify-between text-[6px] font-black uppercase text-white/20">
                        <span>Objetivo alcanzado</span>
                        <span>84.2%</span>
                    </div>
                </div>
            </motion.div>

        </div>
    )
}

export default OmnichannelIllustration
