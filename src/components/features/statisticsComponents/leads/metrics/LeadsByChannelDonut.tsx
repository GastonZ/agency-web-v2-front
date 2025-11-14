import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ChannelCount } from "../mockMetrics";
import { useTranslation } from "react-i18next";


const COLORS = ["#10B981", "#34D399", "#A7F3D0", "#6EE7B7", "#99F6E4"];


export function LeadsByChannelDonut({ data }: { data: ChannelCount[] }) {
    const { t } = useTranslation("translations");
    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-4">
            <div className="mb-3">
                <h4 className="text-sm font-semibold">{t("stats_leads_by_channel")}</h4>
                <p className="text-xs opacity-70">{t("stats_distribution_by_source")}</p>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip cursor={{ fill: "rgba(16,185,129,0.06)" }} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}