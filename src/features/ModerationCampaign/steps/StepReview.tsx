import * as React from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  MapPin,
  Megaphone,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useModeration } from "../../../context/ModerationContext";
import { useTranslation } from "react-i18next";
import { CHANNEL_META } from "../components/stepTwoComponents/ChannelMeta";

const GlassPanel: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <div className="relative overflow-hidden rounded-2xl p-4 md:p-6 bg-white/55 dark:bg-neutral-900/45 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-800/60">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl opacity-70" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.15)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.12]" />
    </div>

    <div className="relative flex items-start gap-3 mb-4">
      <div className="inline-flex items-center justify-center rounded-xl h-10 w-10 border border-emerald-400/25 bg-emerald-500/10">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-[15px] font-semibold leading-tight truncate">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>

    <div className="relative">{children}</div>
  </div>
);

const Badge: React.FC<{
  tone?: "neutral" | "emerald";
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ tone = "neutral", icon, children }) => {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : "border-neutral-300/50 dark:border-neutral-700/60 bg-white/40 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
};

const TruncText: React.FC<{
  text?: string;
  lines?: 1 | 2;
  className?: string;
}> = ({ text, lines = 1, className }) => {
  const value = (text ?? "").trim();
  if (!value) return <span className="opacity-60">—</span>;

  const lineClamp = lines === 2 ? "line-clamp-2" : "line-clamp-1";
  return (
    <span title={value} className={`block ${lineClamp} break-words ${className ?? ""}`}>
      {value}
    </span>
  );
};

const StatRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <div className="text-[13px] text-neutral-600 dark:text-neutral-400">
      {label}
    </div>
    <div className="text-[14px] text-neutral-900 dark:text-neutral-100 text-right max-w-[65%]">
      {value ?? <span className="opacity-60">—</span>}
    </div>
  </div>
);

function formatLocation(geo: any) {
  if (!geo) return "—";
  const country = geo.country || geo.countryCode || geo.countryId || "—";
  const region = geo.region || geo.regionCode || geo.stateId || "";
  const city = geo.city || "";
  const postal = geo.postalCode || "";

  const parts = [
    country,
    region ? `· ${region}` : "",
    city ? `· ${city}` : "",
    postal ? `· ${postal}` : "",
  ].filter(Boolean);

  return parts.join(" ");
}

function channelLabel(ch: string) {
  try {
    // @ts-ignore
    return CHANNEL_META?.[ch]?.title ?? ch;
  } catch {
    return ch;
  }
}

export default function StepReview() {
  const { data } = useModeration();
  const { t } = useTranslation("translations");

  const channels = data.channels ?? [];
  const geo = data?.audience?.geo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4 md:space-y-6"
    >
      {/* HEADER / RESUMEN DE CAMPAÑA */}
      <div className="relative overflow-hidden rounded-3xl p-4 md:p-6 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-800/60">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-[-10%] h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-[-40%] right-[-10%] h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.15)_1px,transparent_1px)] [background-size:26px_26px] dark:opacity-[0.12]" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[12px] text-neutral-600 dark:text-neutral-400">
              <Sparkles className="h-4 w-4 opacity-70" />
              <span className="uppercase tracking-wide">
                {t("stepReview.header.title")}
              </span>
            </div>

            <h3 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              <span className="truncate block" title={data?.name ?? ""}>
                {data?.name ?? t("basic_data")}
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Badge tone="emerald" icon={<MessageSquare className="h-4 w-4 opacity-70" />}>
              {t("stepReview.header.channelsBadge", { count: channels.length })}
            </Badge>
          </div>
        </div>
      </div>

      {/* GRID */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 gap-4 md:gap-6"
      >
        {/* DATOS PRINCIPALES */}
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
          <GlassPanel
            icon={<ClipboardList className="h-4 w-4" />}
            title={t("stepReview.main.title")}
            subtitle={t("stepReview.main.subtitle")}
          >
            <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
              <StatRow
                label={t("stepReview.main.fields.campaignName")}
                value={<TruncText text={data?.name} lines={1} />}
              />
              <StatRow
                label={t("stepReview.main.fields.productOrService")}
                value={<TruncText text={data?.summary} lines={2} />}
              />
              <StatRow
                label={t("stepReview.main.fields.goal")}
                value={<TruncText text={data?.goal} lines={2} />}
              />
              <StatRow
                label={t("stepReview.main.fields.lead")}
                value={<TruncText text={data?.leadDefinition} lines={2} />}
              />
            </div>
          </GlassPanel>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          {/* CANALES */}
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
            <GlassPanel
              icon={<Megaphone className="h-4 w-4" />}
              title={t("stepReview.channels.title")}
              subtitle={t("stepReview.channels.subtitle")}
            >
              {channels.length ? (
                <div className="flex flex-wrap gap-2">
                  {channels.map((c: string) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-2 px-3 py-2 text-[13px] rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                    >
                      <MessageSquare className="h-4 w-4 opacity-70" />
                      <span className="font-medium">{channelLabel(c)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-neutral-600 dark:text-neutral-400">
                  {t("stepReview.channels.empty")}
                </p>
              )}
            </GlassPanel>
          </motion.div>

          {/* LUGAR */}
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
            <GlassPanel
              icon={<MapPin className="h-4 w-4" />}
              title={t("stepReview.location.title")}
              subtitle={t("stepReview.location.subtitle")}
            >
              <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                <StatRow
                  label={t("stepReview.location.fields.location")}
                  value={<TruncText text={formatLocation(geo)} lines={2} />}
                />
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
