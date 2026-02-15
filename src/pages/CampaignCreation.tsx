import * as React from "react";
import { motion } from "framer-motion";
import {
    Megaphone,
    ShieldCheck,
    Waves,
    Info,
    Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PunkButton } from "../components/ui/PunkButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/Tooltip";
import { cn } from "../utils/helper";
import OnlineLayout from "../layout/OnlineLayout";
import { useTranslation } from "react-i18next";

type CampaignType = "marketing" | "moderation" | "listening";

type CardSpec = {
    id: CampaignType;
    campaignW: string;
    title: string;
    icon: React.ElementType;
    short: string;
    bullets: string[];
    badge?: string;
    goto: string;
    disabled?: boolean;
};



export default function CampaignCreation({
    defaultValue,
    onConfirm,
}: {
    defaultValue?: CampaignType;
    onConfirm?: (type: CampaignType) => void;
}) {

    const { t } = useTranslation('translations');
    const CARDS: CardSpec[] = [
        {
            id: "moderation",
            campaignW: "Campaign",
            title: t("campaigns_moderation_title"),
            icon: ShieldCheck,
            short: t("campaigns_moderation_desc_1"),
            bullets: [
                t("campaigns_moderation_desc_2"),
                t("campaigns_moderation_desc_3"),
                t("campaigns_moderation_desc_4"),
                t("campaigns_moderation_desc_5"),
                t("campaigns_moderation_desc_6"),
            ],
            badge: "Atención",
            goto: '/campaign_moderation_creation',
            disabled: false
        },
        {
            id: "listening",
            campaignW: "Campaign",
            title: "Social Listening",
            icon: Waves,
            short:
                t("campaigns_listening_title"),
            bullets: [
                t("campaigns_listening_desc_1"),
                t("campaigns_listening_desc_2"),
                t("campaigns_listening_desc_3"),
            ],
            badge: "Insights",
            goto: '/',
            disabled: true
        },
        {
            id: "marketing",
            campaignW: "Campaign",
            title: t("campaigns_marketing_title"),
            icon: Megaphone,
            short: t("campaigns_marketing_desc_1"),
            bullets: [
                t("campaigns_marketing_desc_2"),
                t("campaigns_marketing_desc_3"),
                t("campaigns_marketing_desc_4"),
                t("campaigns_marketing_desc_5"),
            ],
            badge: "Promoción",
            goto: '/campaign_marketing_creation',
            disabled: true
        },
    ];

    const [value, setValue] = React.useState<CampaignType>(defaultValue ?? "marketing");
    const [expanded, setExpanded] = React.useState<CampaignType | null>(null);

    function select(id: CampaignType) {
        setValue(id);
    }


    return (
        <OnlineLayout>
            <TooltipProvider delayDuration={100}>
                <section
                    aria-label="Create a campaign"
                    className="relative w-full h-full"
                >
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">{t("new_campaign")}</h1>
                        </div>
                    </header>

                    {/* Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {CARDS.map((card) => {
                            const Icon = card.icon;
                            const isActive = value === card.id;
                            const isOpen = expanded === card.id;

                            return (
                                <motion.div
                                    key={card.id}
                                    onClick={() => !card.disabled && select(card.id)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !card.disabled) select(card.id); }}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className={cn(
                                        "group relative flex h-full flex-col rounded-2xl p-5 md:p-6 text-left outline-none",

                                        "min-h-[300px] md:min-h-[360px] xl:min-h-[400px]",

                                        "bg-white/20 dark:bg-neutral-900/30 backdrop-blur-xl",
                                        "border border-white/30 dark:border-white/10",
                                        
                                        card.disabled
                                            ? "shadow-[0_0_0_1px_rgba(107,114,128,0.15)] cursor-not-allowed opacity-60"
                                            : "shadow-[0_0_0_1px_rgba(16,185,129,0.15)] hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] cursor-pointer",

                                        "focus-visible:ring-2 focus-visible:ring-red-400/60",
                                        isActive && !card.disabled && "ring-2 ring-emerald-400/60"
                                    )}
                                    aria-pressed={isActive}
                                >
                                    <div className="mb-2 flex w-full items-center justify-between">
                                        <div
                                            className={cn(
                                                "flex size-12 items-center justify-center rounded-xl",
                                                card.disabled
                                                    ? "bg-neutral-400/20 ring-1 ring-neutral-400/30"
                                                    : `bg-emerald-400/20 ring-1 ring-emerald-400/30 group-hover:scale-105 transition-transform`
                                            )}
                                        >
                                            <Icon className={`h-6 w-6 ${card.disabled ? "text-neutral-400" : "text-emerald-400"} md:h-7 md:w-7`} />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isActive && !card.disabled && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                                                    <Check className="h-3.5 w-3.5" /> Selected
                                                </span>
                                            )}
                                            {card.badge && (
                                                <span className={cn(
                                                    "rounded-full px-2 py-1 text-[11px] ring-1",
                                                    card.disabled
                                                        ? "bg-neutral-400/10 text-neutral-600 ring-neutral-400/20 dark:text-neutral-400"
                                                        : "bg-white/10 text-neutral-600 ring-white/20 dark:text-neutral-300"
                                                )}>
                                                    {card.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pr-1">
                                        <h3 className="text-lg font-semibold tracking-tight md:text-xl">{card.title}</h3>
                                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300 md:text-[15px] md:leading-6 md:line-clamp-3">
                                            {card.short}
                                        </p>
                                    </div>

                                    <div className="mt-3 md:mt-4">
                                        <div className="flex md:hidden">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : card.id); }}
                                                        className={cn(
                                                            "inline-flex items-center gap-1 text-xs focus-visible:outline-none",
                                                            card.disabled
                                                                ? "text-neutral-400 cursor-not-allowed"
                                                                : "text-neutral-600 hover:text-emerald-500 dark:text-neutral-300"
                                                        )}
                                                        aria-expanded={isOpen}
                                                        aria-controls={`${card.id}-more`}
                                                        disabled={card.disabled}
                                                    >
                                                        <Info className="h-4 w-4" />
                                                        Learn more
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Ver detalles y alcances</TooltipContent>
                                            </Tooltip>
                                        </div>

                                        {(isOpen || true) && (
                                            <motion.div
                                                id={`${card.id}-more`}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                className={cn(
                                                    "w-full overflow-hidden",

                                                    "hidden md:block",
                                                    isOpen && "block md:hidden mt-2"
                                                )}
                                            >
                                                <ul className="list-inside list-disc space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                                                    {card.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-3 flex w-full items-center justify-between">
                                        <span className="hidden text-xs text-neutral-500 md:block dark:text-neutral-400">
                                        </span>
                                        <Link to={card.disabled ? '#' : card.goto} style={{ textDecoration: 'none' }}>
                                            <PunkButton
                                                size="sm"
                                                disabled={card.disabled}
                                                
                                            >
                                                Create {card.campaignW}
                                            </PunkButton>
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                </section>
            </TooltipProvider>
        </OnlineLayout>
    );
}
