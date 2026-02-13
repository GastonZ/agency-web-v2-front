
import React, { useEffect, useRef } from "react"
import { motion, useSpring, useTransform, useInView } from "framer-motion"
import { IconBuildingStore } from "@tabler/icons-react"

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

export const SocialListeningIllustration = () => (
    <div className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden">
        {/* Expansive Radar Rings - Centered */}
        <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3, 4, 5].map(i => (
                <motion.div
                    key={i}
                    animate={{
                        scale: [0.8, 3],
                        opacity: [0.15, 0],
                    }}
                    transition={{ duration: 4, delay: i * 0.8, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-40 h-40 border border-emerald-500/30 rounded-full pointer-events-none"
                />
            ))}
            {/* Ambient Pulse Glow */}
            <motion.div
                animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute w-64 h-64 bg-emerald-500/10 blur-[60px] rounded-full"
            />
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
            {/* Data Sentiment Nodes - Orbiting/Scattered around center */}
            {[
                { x: "-50%", y: "-15%", color: "bg-emerald-500", label: "Sentimiento: 82%", delay: 0 },
                { x: "-15%", y: "-30%", color: "bg-emerald-400", label: "Tendencia: I.A.", delay: 1 },
                { x: "10%", y: "15%", color: "bg-emerald-700", label: "Menciones: 1.2k", delay: 2 },
                { x: "-18%", y: "30%", color: "bg-orange-500", label: "Pico detectable", delay: 3 }
            ].map((item, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, -8, 0],
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ duration: 5, delay: item.delay, repeat: Infinity }}
                    className="absolute flex items-center gap-3 px-5 py-2.5 bg-[#121212]/95 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl z-20"
                    style={{ left: `calc(50% + ${item.x})`, top: `calc(50% + ${item.y})` }}
                >
                    <div className={`w-2 h-2 shadow-[0_0_10px_currentColor] rounded-full ${item.color}`} />
                    <span className="text-[12px] font-bold tracking-tight text-white/70 whitespace-nowrap">{item.label}</span>
                </motion.div>
            ))}

            {/* Central Business/Brand Node */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative z-30 w-16 h-16 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center backdrop-blur-xl shadow-2xl"
            >
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl animate-pulse" />
                <IconBuildingStore size={28} className="text-white opacity-90" />
            </motion.div>
        </div>
    </div>
)

export const ConversationsIllustration = () => (
    <div className="absolute top-28 left-0 p-8 pt-16 flex flex-col justify-end gap-4 pointer-events-none overflow-hidden">
        {/* Animated Message History with Channel Icons */}
        {[
            { text: "¿Aceptan pagos con cripto?", type: "user", channel: "/WhatsApp.svg.png", delay: 0 },
            { text: "Confirmando con inventario...", type: "system", channel: "/datacivis-iso.svg", delay: 1 },
            { text: "LISA: Sí, todas las redes aceptadas.", type: "ai", channel: "/ig.svg", delay: 2 }
        ].map((msg, i) => (
            <motion.div
                key={i}
                initial={{ x: msg.type === 'user' ? -20 : 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + msg.delay }}
                className={`max-w-[85%] p-5 rounded-3xl text-[13px] font-bold leading-normal shadow-2xl flex flex-col gap-2 ${msg.type === 'ai'
                    ? 'bg-white text-black self-end rounded-tr-none'
                    : msg.type === 'user'
                        ? 'bg-white/5 border border-white/10 text-white/80 self-start rounded-tl-none'
                        : 'bg-emerald-500/10 text-emerald-500 self-center text-[10px] uppercase font-black px-6 py-2 tracking-[0.2em] border border-emerald-500/20'
                    }`}
            >
                <div className="flex justify-between items-center gap-5">
                    <span className="flex-1">{msg.text}</span>
                    <img src={msg.channel} alt="icon" className={`w-5 h-5 object-contain ${msg.type === 'ai' ? 'invert-0' : 'opacity-80'}`} />
                </div>
            </motion.div>
        ))}
    </div>
)

export const IntegrationsIllustration = () => {
    const apps = [
        { name: "Meta", logo: "/Meta_Platforms_Inc._logo_(cropped).svg.png", pos: { top: '15%', left: '50%', x: '-50%' }, delay: 0 },     // Top
        { name: "HubSpot", logo: "/5968872.png", pos: { bottom: '15%', left: '50%', x: '-50%' }, delay: 1.2 },                         // Bottom
        { name: "Slack", logo: "/Slack_icon_logo.webp", pos: { top: '50%', right: '15%', y: '-50%' }, delay: 0.6 },                   // Right
        { name: "WhatsApp", logo: "/WhatsApp.svg.png", pos: { top: '50%', left: '15%', y: '-50%' }, delay: 1.8 }                    // Left
    ]
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Center Logo Hub - Minimalist */}
            <div className="w-16 h-16 flex items-center justify-center z-10 relative">
                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full animate-pulse" />
                <img src="/datacivis-iso.svg" alt="Datacivis" className="w-10 h-10 object-contain opacity-90 relative z-10" />
            </div>

            {/* Structured Diamond Pattern - More Aligned & Systematic */}
            {apps.map((app, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    animate={{
                        y: [0, -8, 0],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 6,
                        delay: app.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute"
                    style={{
                        ...app.pos,
                        transform: `translate(${app.pos.x || '0'}, ${app.pos.y || '0'})`
                    }}
                >
                    <div className="w-14 h-14 flex items-center justify-center">
                        <img
                            src={app.logo}
                            alt={app.name}
                            className="w-9 h-9 object-contain drop-shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                        />
                    </div>
                </motion.div>
            ))}

            {/* Subtle connecting pulse lines - Diamond Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none">
                <path d="M 50% 15% L 85% 50% L 50% 85% L 15% 50% Z" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" style={{ transformOrigin: 'center', transform: 'scale(0.9)' }} />
            </svg>
        </div>
    )
}

export const PerformanceIllustration = () => {
    // Technical data path for the area chart
    const pathData = "M 0 80 Q 20 70 40 85 T 80 40 T 120 60 T 160 20 T 200 45";
    const points = [
        { x: 40, y: 85, label: "62%" },
        { x: 80, y: 40, label: "88%" },
        { x: 160, y: 20, label: "94%" }
    ];

    return (
        <div className="w-full flex flex-col gap-6 mt-6">
            {/* Top Stats Row */}
            <div className="flex items-end justify-between px-1">
                <div className="flex flex-col space-y-2">
                    <div className="text-[12px] font-bold tracking-[0.2em] text-white/30 uppercase">ROI Activo</div>
                    <div className="text-5xl font-bold text-white tracking-tighter leading-none flex items-baseline">
                        <span className="text-white">x</span>
                        <NumberTicker value={6.2} delay={0.5} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                        <span className="text-[12px] font-bold text-emerald-500 tracking-tight">+12% vs mes anterior</span>
                    </div>
                </div>
                {/* Secondary metric */}
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Conversión</div>
                    <div className="text-xl font-bold text-white/60 font-heading">
                        <NumberTicker value={4.2} suffix="%" delay={0.8} />
                    </div>
                </div>
            </div>

            {/* Premium Area Chart Container */}
            <div className="relative h-32 w-full bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden group/chart">
                {/* Horizontal Technical Grid */}
                <div className="absolute inset-0 flex flex-col justify-between py-6 opacity-[0.05]">
                    {[1, 2, 3].map(i => <div key={i} className="h-px w-full bg-white" />)}
                </div>

                {/* SVG Chart */}
                <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none">
                    {/* Gradient Fill under the curve */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <motion.path
                        d={`${pathData} V 100 H 0 Z`}
                        fill="url(#chartGradient)"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />

                    {/* The main stroke line */}
                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {/* Animated Data Points */}
                    {points.map((p, i) => (
                        <motion.g key={i}>
                            <motion.circle
                                cx={p.x}
                                cy={p.y}
                                r="3"
                                fill="#090909"
                                stroke="#10b981"
                                strokeWidth="2"
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                            />
                        </motion.g>
                    ))}
                </svg>

                {/* Floating tooltips (aesthetic only) */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 }}
                        className="absolute right-8 top-4 px-3 py-1.5 bg-[#090909] border border-emerald-500/30 rounded-lg shadow-2xl"
                    >
                        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest text-center">Optimización</div>
                        <div className="text-[10px] font-bold text-emerald-500 text-center">IA ACTIVA</div>
                    </motion.div>
                </div>

                {/* Left/Right Fades */}
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0d0d0d]/40 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0d0d0d]/40 to-transparent pointer-events-none" />
            </div>
        </div>
    )
}
