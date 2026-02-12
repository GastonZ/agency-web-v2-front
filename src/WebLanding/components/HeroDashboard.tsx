
import React from "react";
import { motion } from "framer-motion";
import {
    IconHome,
    IconUsers,
    IconMessage,
    IconChartBar,
    IconSettings,
    IconSearch,
    IconBell,
    IconPlus,
} from "@tabler/icons-react";

export default function HeroDashboard() {
    return (
        <div className="w-full h-full bg-[#090909] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
            {/* Top Bar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/[0.02]">
                <div className="flex items-center gap-4 w-1/3">
                    <div className="flex items-center gap-2 text-white/40 bg-white/5 px-3 py-1.5 rounded-md text-xs w-full max-w-[200px]">
                        <IconSearch size={14} />
                        <span>Buscar...</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                        <IconBell size={16} />
                    </div>
                    {/* User Avatar */}
                    <img
                        src="/lucas-avatar.png"
                        alt="Lucas Profile"
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-16 border-r border-white/10 flex flex-col items-center py-6 gap-6 bg-white/[0.02]">
                    {[IconHome, IconUsers, IconMessage, IconChartBar, IconSettings].map((Icon, i) => (
                        <div
                            key={i}
                            className={`p-2 rounded-lg transition-colors ${i === 0 ? "text-white bg-white/10" : "text-white/40 hover:text-white"
                                }`}
                        >
                            <Icon size={20} />
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 overflow-hidden relative">
                    {/* Header */}
                    <div className="mb-8 flex flex-col items-start text-left">
                        <h3 className="text-xl font-bold text-white mb-1">Panel de Control</h3>
                        <p className="text-white/40 text-xs">Bienvenido de vuelta, Lucas.</p>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Leads Activos", val: "1,245", trend: "+12%" },
                            { label: "Conversaciones", val: "854", trend: "+5%" },
                            { label: "Cierres", val: "142", trend: "+18%" },
                            { label: "ROI Est.", val: "450%", trend: "+2%" },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col justify-between group hover:bg-white/5 transition-colors duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider group-hover:text-white/60 transition-colors">{kpi.label}</span>
                                    <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{kpi.trend}</span>
                                </div>
                                <div className="text-2xl font-mono font-medium text-white">{kpi.val}</div>
                                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-white/20 group-hover:bg-emerald-500/50 transition-colors duration-300" style={{ width: `${60 + i * 10}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-6 h-full">
                        {/* Main Chart Area */}
                        <div className="col-span-2 bg-white/[0.03] border border-white/5 rounded-xl p-6 min-h-[300px]">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-bold text-white">Rendimiento de Campañas</h4>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-md bg-white/10 text-[10px] text-white">Semanal</div>
                                    <div className="px-3 py-1 rounded-md bg-transparent text-[10px] text-white/40">Mensual</div>
                                </div>
                            </div>
                            {/* Mock Chart */}
                            <div className="w-full h-[200px] flex items-end gap-2 px-2">
                                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 65, 80, 95].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-white/5 to-white/20 rounded-t-sm relative group hover:to-white/40 transition-all duration-300" style={{ height: `${h}%` }}>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {h * 10}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="col-span-1 space-y-4">
                            {/* Activity - with hover reveal */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                                <h4 className="text-sm font-bold text-white mb-4">Actividad Reciente</h4>
                                <div className="space-y-4 relative z-10">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-default">
                                            <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <div>
                                                <p className="text-xs text-white/80 leading-tight">Nueva conversión en campaña <span className="text-white font-medium">Q1 Growth</span></p>
                                                <p className="text-[10px] text-white/30 mt-1">Hace {i * 15 + 5} min</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Glow effect on card hover */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>

                            {/* Quick Action - WOW Button */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 to-emerald-800/30 border border-white/10 rounded-xl p-5 flex items-center justify-between cursor-pointer group hover:border-emerald-500/20 transition-all duration-300"
                            >
                                <div className="relative z-10">
                                    {/* Text glow on hover */}
                                    <h4 className="text-sm font-bold text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">Crear Campaña</h4>
                                    <p className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">Lanzar nueva estrategia</p>
                                </div>
                                <div className="relative z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center text-black group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <IconPlus size={16} />
                                </div>

                                {/* Background Gradient Animation */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-emerald-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Shining sweep effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
