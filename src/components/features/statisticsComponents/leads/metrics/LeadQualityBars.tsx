import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ScoreBin } from "../mockMetrics";


export function LeadQualityBars({ data }: { data: ScoreBin[] }) {
    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-4">
            <div className="mb-3">
                <h4 className="text-sm font-semibold">Calidad de leads</h4>
                <p className="text-xs opacity-70">Cantidad por rango de puntaje</p>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.25)" />
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{ fill: "rgba(16,185,129,0.06)" }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#10B981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}