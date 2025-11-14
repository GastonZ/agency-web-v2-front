import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TimePoint } from "../mockMetrics";


export function LeadsOverTimeArea({ data }: { data: TimePoint[] }) {
    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-4">
            <div className="mb-3">
                <h4 className="text-sm font-semibold">Evolución de leads</h4>
                <p className="text-xs opacity-70">Nuevos leads por día</p>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="areaEmerald" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.55} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={0.08} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.25)" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{ stroke: "#10B981", strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="count" stroke="#10B981" fill="url(#areaEmerald)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}