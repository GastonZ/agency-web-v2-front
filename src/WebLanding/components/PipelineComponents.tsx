
import React from "react"
import { motion } from "framer-motion"

interface PipelineConnectorProps {
    delay?: number
}

const PipelineConnector = ({ delay = 0 }: PipelineConnectorProps) => (
    <div className="flex-1 h-px relative bg-white/5 mx-2 min-w-[20px] sm:min-w-[40px]">
        <motion.div
            animate={{ x: ["0%", "100%"], opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
        />
    </div>
)

interface PipelineNodeProps {
    title: string
    icon?: any
    items: string[]
    active?: boolean
    logos?: string[]
}

const PipelineNode = ({ title, icon: Icon, items, active = false, logos }: PipelineNodeProps) => (
    <motion.div
        whileHover={{ y: -2 }}
        className={`flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border transition-all duration-500 ${active
            ? 'bg-white/[0.03] border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
            : 'bg-transparent border-white/5 opacity-40 hover:opacity-100 hover:border-white/10'
            }`}
    >
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${active ? 'bg-white/5 border-white/10 text-white' : 'bg-white/[0.02] border-white/5 text-white/40'
            }`}>
            {Icon ? <Icon size={20} /> : logos && logos.length > 0 && (
                <div className="grid grid-cols-2 gap-1 p-1">
                    {logos.slice(0, 4).map((logo, i) => (
                        <div key={i} className="w-3 h-3 bg-white/10 rounded-sm flex items-center justify-center p-0.5">
                            <img src={logo} alt="logo" className="w-full h-full object-contain" />
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="text-center">
            <div className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-3 ${active ? 'text-white' : 'text-white/20'
                }`}>
                {title}
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-[120px] sm:max-w-[150px]">
                {items.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5">
                        <span className="text-[7px] sm:text-[8px] font-bold text-white/30 whitespace-nowrap">
                            {item}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
)

export { PipelineConnector, PipelineNode }
export default PipelineNode
