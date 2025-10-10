// Dashboard.tsx
import React from "react";
import OnlineLayout from "../layout/OnlineLayout";
import AgencyChatbot from "../components/features/AgencyChatbot";

type GlassCardProps = {
    title?: React.ReactNode;
    rightLabel?: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    children?: React.ReactNode;
};

const baseCardCls =
    "rounded-2xl border shadow-sm bg-white/80 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-neutral-200 dark:border-neutral-800";

function GlassCard({
    title,
    rightLabel,
    className = "",
    bodyClassName = "",
    children,
}: GlassCardProps) {
    return (
        <section
            className={`${baseCardCls} p-4 md:p-6 flex flex-col ${className}`}
        >
            {(title || rightLabel) && (
                <header className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {title}
                    </h3>
                    {rightLabel ? (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {rightLabel}
                        </span>
                    ) : null}
                </header>
            )}

            <div
                className={[
                    "flex-1 rounded-xl ring-1 ring-white/5 dark:ring-black/20",
                    "bg-gradient-to-b from-white/5 to-transparent",
                    bodyClassName,
                ].join(" ")}
            >
                {children}
            </div>
        </section>
    );
}

function Placeholder({ className = "" }: { className?: string }) {
    return (
        <div
            className={[
                "w-full h-full rounded-xl",
                "bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0)_40%)]",
                className,
            ].join(" ")}
        />
    );
}

const Dashboard: React.FC = () => {

    return (
        <OnlineLayout>
            <div className="w-full px-2 md:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
                    {/* Chatbot */}
                    <div className="lg:col-span-5 flex">
                        <AgencyChatbot placeholder="Decime algo como: 'cambiá a tema oscuro' o 'andá a campaigns'"
                            mode="classic" />
                    </div>

                    <div className="lg:col-span-7 flex">
                        <GlassCard title="Active campaigns performance" rightLabel="Last 24h" className="w-full">
                            <Placeholder className="h-full" />
                        </GlassCard>
                    </div>

                    <div className="lg:col-span-12 flex">
                        <GlassCard title="Actions" rightLabel="Realtime" className="w-full min-h-[220px]">
                            <Placeholder className="h-full" />
                        </GlassCard>
                    </div>
                </div>
            </div>
        </OnlineLayout>
    );
};

export default Dashboard;
