import * as React from "react";
import { motion } from "framer-motion";


interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
}


export function KpiCards({ items }: { items: KpiCardProps[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            {items.map((it, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 20 }}
                    className="rounded-2xl p-4 ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-70">{it.title}</div>
                            <div className="text-2xl font-semibold mt-1">{it.value}</div>
                            {it.subtitle && (
                                <div className="text-xs opacity-70 mt-1">{it.subtitle}</div>
                            )}
                        </div>
                        <div className="h-10 w-10 rounded-xl ring-1 ring-emerald-400/20 bg-emerald-500/10 flex items-center justify-center">
                            {it.icon}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}