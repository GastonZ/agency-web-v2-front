import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ScoreBin } from "../mockMetrics";
import { useTranslation } from "react-i18next";

export function LeadQualityBars({ data }: { data: ScoreBin[] }) {
    const { t } = useTranslation("translations");
    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-4">
            <div className="mb-3">
                <h4 className="text-sm font-semibold">{t("stats_leads_quality")}</h4>
                <p className="text-xs opacity-70">{t("stats_count_by_score_range")}</p>
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