// Dashboard.tsx
import React, { use } from "react";
import OnlineLayout from "../layout/OnlineLayout";
import AgencyChatbot from "../components/features/AgencyChatbot";
import { DASHBOARD_PLAYBOOK, getUserId, DASHBOARD_PLAYBOOK_ES } from "../utils/helper";
import WipeMemoryBtn from "../components/features/WipeMemoryBtn";
import HeroConversational from "../WebLanding/components/HeroConversational";
import HeroConversationalAgency from "../components/features/HeroConversationalAgency";
import { useTranslation } from "react-i18next";
import { V2ConversationalWidget } from "../V2Conversational";

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

    const userId = getUserId?.() || "anon";

    const { i18n } = useTranslation();
    const uiLang = i18n.language.startsWith("en") ? "en" : "es";

    return (
        <OnlineLayout>
            <div className="w-full px-2 md:px-4">
                    <V2ConversationalWidget profile="dashboard" />
{/*                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch pb-2">
                    <div className="lg:col-span-12 flex">
                        <HeroConversationalAgency />
                    </div>

                </div> */}
            </div>
        </OnlineLayout>
    );
};

export default Dashboard;
