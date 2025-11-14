import * as React from "react";
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from "recharts";
import type { FunnelStep } from "../mockMetrics";


export function ConversionFunnel({ data }: { data: FunnelStep[] }) {
    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-4">
            <div className="mb-3">
                <h4 className="text-sm font-semibold">Embudo de conversión</h4>
                <p className="text-xs opacity-70">Desde mensajes hasta clientes</p>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                        <Tooltip />
                        <Funnel dataKey="value" data={data} isAnimationActive>
                            <LabelList position="right" fill="#10B981" stroke="none" dataKey="name" />
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}