import * as React from "react";
import { createPortal } from "react-dom";
import {
    ExternalLink,
    MessageSquare,
    Instagram,
    Facebook,
    ChevronDown,
    Check,
    Loader2,
    Eye,
    X,
} from "lucide-react";
import type { Lead, LeadStatus } from "../../../../services/types/moderation-types";
import { updateModerationCampaignLeadStatus } from "../../../../services/campaigns";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS: LeadStatus[] = [
    "new",
    "on_following",
    "contacted",
    "negotiating",
    "closed_won",
    "closed_lost",
    "custom",
];

function countWords(value: string) {
    return value
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
}

function scoreClasses(score: number) {
    if (score >= 9) return "bg-emerald-500/15 text-emerald-400 ring-emerald-400/30";
    if (score >= 7) return "bg-green-500/10 text-green-400 ring-green-400/30";
    if (score >= 4) return "bg-amber-500/10 text-amber-400 ring-amber-400/30";
    return "bg-rose-500/10 text-rose-400 ring-rose-400/30";
}

function ChannelIcon({
    channel,
    className = "h-4 w-4",
}: {
    channel?: Lead["channel"];
    className?: string;
}) {
    switch (channel) {
        case "whatsapp":
            return <MessageSquare className={className} />;
        case "instagram":
            return <Instagram className={className} />;
        case "facebook":
            return <Facebook className={className} />;
        case "email":
            return <ExternalLink className={className} />;
        default:
            return <ExternalLink className={className} />;
    }
}

function ChannelBadge({ channel }: { channel: Lead["channel"] | string }) {
    return (
        <div className="h-9 w-9 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 ring-1 ring-neutral-300/60 dark:ring-neutral-700/60 flex items-center justify-center">
            <ChannelIcon channel={channel as any} className="h-4 w-4" />
        </div>
    );
}

function prettifyWhatsNumber(raw?: string | null) {
    if (!raw) return null;
    return String(raw)
        .replace(/@.+$/, "")
        .replace(/[^\d+]/g, "");
}

function getConversationLink(lead: Lead) {
    const channel = String((lead as any).channel || "").toLowerCase();
    const username = (lead as any).username as string | null | undefined;
    const contactNumber = (lead as any).contactNumber as string | null | undefined;

    if ((lead as any).channelLink) return (lead as any).channelLink as string;

    if (channel === "instagram") {
        if (!username) return null;
        return `https://www.instagram.com/${username}/`;
    }

    if (channel === "whatsapp") {
        const num = prettifyWhatsNumber(contactNumber);
        if (!num) return null;
        return `https://wa.me/${num.replace(/^\+/, "")}`;
    }

    if (channel === "facebook") {
        if (!username) return null;
        return `https://www.facebook.com/${username}`;
    }

    return null;
}

function ContactCell({ lead }: { lead: Lead }) {
    const channel = String((lead as any).channel || "").toLowerCase();
    const profilePic = (lead as any).profilePic as string | null | undefined;
    const username = (lead as any).username as string | null | undefined;
    const contactNumber = (lead as any).contactNumber as string | null | undefined;

    if (channel === "instagram") {
        const primary = username ? `@${username}` : (lead as any).name || "Instagram";
        const secondary = username && (lead as any).name ? (lead as any).name : null;

        return (
            <div className="flex items-center gap-3 min-w-[220px]">
                {profilePic ? (
                    <img
                        src={profilePic}
                        alt={primary}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-emerald-400/20"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <ChannelBadge channel="instagram" />
                )}

                <div className="leading-tight">
                    <div className="font-medium">{primary}</div>
                    {secondary ? <div className="text-xs opacity-70">{secondary}</div> : null}
                </div>
            </div>
        );
    }

    if (channel === "whatsapp") {
        const number = prettifyWhatsNumber(contactNumber);
        const primary = "Whatsapp user";

        return (
            <div className="flex items-center gap-3 min-w-[220px]">
                <ChannelBadge channel="whatsapp" />
                <div className="leading-tight">
                    <div className="font-medium">{primary}</div>
                    {number ? <div className="text-xs opacity-70 font-mono">{number}</div> : null}
                </div>
            </div>
        );
    }

    if (channel === "facebook") {
        const primary = (lead as any).name || "Facebook";

        return (
            <div className="flex items-center gap-3 min-w-[220px]">
                <ChannelBadge channel="facebook" />
                <div className="leading-tight">
                    <div className="font-medium">{primary}</div>
                </div>
            </div>
        );
    }

    return <div className="font-medium">{(lead as any).name}</div>;
}

function getLeadConversationId(lead: Lead) {
    return ((lead as any).conversationId as string | undefined) || (lead as any).id;
}

function getLeadStatus(lead: Lead): { status?: LeadStatus; customStatusLabel?: string } {
    return {
        status: ((lead as any).status || (lead as any).leadStatus) as LeadStatus | undefined,
        customStatusLabel: (lead as any).customStatusLabel as string | undefined,
    };
}

function StatusPill({
    label,
    muted,
    buttonRef,
}: {
    label: string;
    muted?: boolean;
    buttonRef?: React.Ref<HTMLButtonElement>;
}) {
    return (
        <button
            ref={buttonRef}
            type="button"
            className={
                "inline-flex items-center gap-1.5 rounded-lg ring-1 px-2.5 py-1.5 text-[12px] transition " +
                (muted
                    ? "opacity-60 ring-neutral-300/60 dark:ring-neutral-700/60 cursor-not-allowed"
                    : "ring-emerald-400/20 hover:bg-emerald-500/10")
            }
        >
            {label}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
    );
}

function StatusCell({
    lead,
    campaignId,
    onUpdateLeadStatus,
    onLocalUpdate,
}: {
    lead: Lead;
    campaignId?: string;
    onUpdateLeadStatus?: (args: {
        campaignId: string;
        conversationId: string;
        status: LeadStatus;
        customStatusLabel?: string;
    }) => Promise<unknown>;
    onLocalUpdate: (next: { status: LeadStatus; customStatusLabel?: string }) => void;
}) {
    const { t } = useTranslation("translations");

    const [open, setOpen] = React.useState(false);
    const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
    const [loading, setLoading] = React.useState<LeadStatus | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [customModalOpen, setCustomModalOpen] = React.useState(false);
    const [customValue, setCustomValue] = React.useState("");

    const pillRef = React.useRef<HTMLButtonElement | null>(null);

    const convId = getLeadConversationId(lead);
    const effectiveCampaignId = campaignId || ((lead as any).campaignId as string | undefined);

    const { status, customStatusLabel } = getLeadStatus(lead);

    const label =
        status === "custom"
            ? customStatusLabel || t("lead_status.custom")
            : status
              ? t(`lead_status.${status}`)
              : "—";

    const closeAll = React.useCallback(() => {
        setOpen(false);
        setAnchor(null);
        setError(null);
    }, []);

    React.useEffect(() => {
        function onKeyDown(ev: KeyboardEvent) {
            if (ev.key !== "Escape") return;
            closeAll();
            setCustomModalOpen(false);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [closeAll]);

    async function doUpdate(next: { status: LeadStatus; customStatusLabel?: string }) {
        if (!effectiveCampaignId || !convId) return;

        setError(null);
        setLoading(next.status);

        try {
            const updater = onUpdateLeadStatus || updateModerationCampaignLeadStatus;
            await updater({
                campaignId: effectiveCampaignId,
                conversationId: convId,
                status: next.status,
                customStatusLabel: next.customStatusLabel,
            });

            onLocalUpdate(next);
            closeAll();
            setCustomModalOpen(false);
        } catch (e: any) {
            setError(e?.message || "Error");
        } finally {
            setLoading(null);
        }
    }

    // prevent clicks from reaching row underneath
    const swallowPointer = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="inline-block" data-stop-row>
            <div
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.stopPropagation();

                    if (!pillRef.current) {
                        setOpen((v) => !v);
                        setError(null);
                        return;
                    }

                    const nextOpen = !open;
                    setOpen(nextOpen);
                    setError(null);
                    setAnchor(nextOpen ? pillRef.current.getBoundingClientRect() : null);
                }}
            >
                <StatusPill
                    buttonRef={pillRef}
                    label={label}
                    muted={!effectiveCampaignId || !convId}
                />
            </div>

            {open && anchor
                ? createPortal(
                      <div
                          className="fixed inset-0 z-[9999]"
                          onMouseDown={(e) => {
                              swallowPointer(e);
                              closeAll();
                          }}
                          onClick={(e) => {
                              swallowPointer(e);
                              closeAll();
                          }}
                      >
                          <div className="fixed left-0 top-0 h-full w-full bg-transparent" aria-hidden />

                          {(() => {
                              const MENU_W = 240;
                              const PAD = 12;
                              const vw = window.innerWidth;
                              const vh = window.innerHeight;

                              let left = anchor.left;
                              if (left + MENU_W > vw - PAD) left = vw - PAD - MENU_W;
                              if (left < PAD) left = PAD;

                              let top = anchor.bottom + 8;
                              const approxH = 320;
                              if (top + approxH > vh - PAD) top = Math.max(PAD, anchor.top - 8 - approxH);

                              return (
                                  <div
                                      className="fixed"
                                      style={{ top, left, width: MENU_W }}
                                      onMouseDown={(e) => {
                                          e.stopPropagation();
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                  >
                                      <div className="rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl ring-1 ring-neutral-200/70 dark:ring-neutral-800/70 shadow-xl overflow-hidden">
                                          <div className="px-3 py-2 text-[11px] uppercase tracking-wide opacity-70 border-b border-neutral-200/60 dark:border-neutral-800/60">
                                              {t("stats_status")}
                                          </div>

                                          <div className="p-2 space-y-1">
                                              {STATUS_OPTIONS.filter((s) => s !== "custom").map((s) => {
                                                  const active = status === s;
                                                  return (
                                                      <button
                                                          key={s}
                                                          type="button"
                                                          disabled={!effectiveCampaignId || !convId || !!loading}
                                                          className={
                                                              "w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-emerald-500/10 disabled:opacity-50 disabled:hover:bg-transparent " +
                                                              (active
                                                                  ? "ring-1 ring-emerald-400/20"
                                                                  : "ring-1 ring-transparent")
                                                          }
                                                          onClick={() => doUpdate({ status: s })}
                                                          title={t(`lead_status.${s}`)}
                                                      >
                                                          <span className="truncate">
                                                              {t(`lead_status.${s}`)}
                                                          </span>
                                                          {loading === s ? (
                                                              <Loader2 className="h-4 w-4 animate-spin opacity-70" />
                                                          ) : active ? (
                                                              <Check className="h-4 w-4 opacity-70" />
                                                          ) : null}
                                                      </button>
                                                  );
                                              })}

                                              <button
                                                  type="button"
                                                  disabled={!effectiveCampaignId || !convId || !!loading}
                                                  className={
                                                      "w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-emerald-500/10 disabled:opacity-50 disabled:hover:bg-transparent ring-1 " +
                                                      (status === "custom"
                                                          ? "ring-emerald-400/20"
                                                          : "ring-transparent")
                                                  }
                                                  onClick={() => {
                                                      closeAll();
                                                      setCustomValue(customStatusLabel || "");
                                                      setCustomModalOpen(true);
                                                  }}
                                              >
                                                  <span className="truncate">{t("lead_status.custom")}</span>
                                                  {status === "custom" ? (
                                                      <Check className="h-4 w-4 opacity-70" />
                                                  ) : null}
                                              </button>

                                              {error ? (
                                                  <div className="mt-2 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/20 px-2.5 py-2 text-[12px] text-rose-400">
                                                      {error}
                                                  </div>
                                              ) : null}
                                          </div>
                                      </div>
                                  </div>
                              );
                          })()}
                      </div>,
                      document.body,
                  )
                : null}

            {customModalOpen
                ? createPortal(
                      <div
                          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                          onMouseDown={(e) => {
                              swallowPointer(e);
                              setCustomModalOpen(false);
                          }}
                          onClick={(e) => {
                              swallowPointer(e);
                              setCustomModalOpen(false);
                          }}
                      >
                          <div
                              className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-950 ring-1 ring-emerald-400/30 shadow-xl p-5"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                          >
                              <div className="flex items-start justify-between gap-3">
                                  <div>
                                      <h4 className="text-[15px] font-semibold">
                                          {t("lead_status.custom")}
                                      </h4>
                                      <p className="text-xs opacity-70 mt-1">
                                          {t("lead_status.custom_hint")}
                                      </p>
                                  </div>
                                  <button
                                      type="button"
                                      className="text-xs px-3 py-1 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70"
                                      onClick={() => setCustomModalOpen(false)}
                                  >
                                      {t("close")}
                                  </button>
                              </div>

                              <div className="mt-4">
                                  <label className="block text-sm opacity-80">
                                      {t("lead_status.custom_label")}
                                  </label>
                                  <input
                                      autoFocus
                                      value={customValue}
                                      onChange={(e) => setCustomValue(e.target.value)}
                                      placeholder={t("lead_status.custom_placeholder")}
                                      className="mt-1 w-full rounded-xl bg-white/80 dark:bg-neutral-950/40 px-3 py-2.5 text-sm ring-1 ring-neutral-200/70 dark:ring-neutral-800/70 outline-none focus:ring-emerald-400/30"
                                  />
                                  {countWords(customValue) > 2 ? (
                                      <div className="mt-2 text-[12px] text-rose-500">
                                          {t("lead_status.custom_too_long")}
                                      </div>
                                  ) : null}
                              </div>

                              <div className="mt-5 flex justify-end gap-2">
                                  <button
                                      type="button"
                                      className="text-sm px-4 py-2 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70"
                                      onClick={() => setCustomModalOpen(false)}
                                  >
                                      {t("cancel")}
                                  </button>
                                  <button
                                      type="button"
                                      disabled={
                                          !effectiveCampaignId ||
                                          !convId ||
                                          !!loading ||
                                          !customValue.trim() ||
                                          countWords(customValue) > 2
                                      }
                                      className="text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                                      onClick={() =>
                                          doUpdate({
                                              status: "custom",
                                              customStatusLabel: customValue.trim(),
                                          })
                                      }
                                  >
                                      {loading === "custom" ? (
                                          <span className="inline-flex items-center gap-2">
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              {t("saving")}
                                          </span>
                                      ) : (
                                          t("save")
                                      )}
                                  </button>
                              </div>
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    );
}

/** Modal interno para leer el summary completo */
function LeadSummaryModal({
    lead,
    open,
    onClose,
}: {
    lead: Lead | null;
    open: boolean;
    onClose: () => void;
}) {
    const { t } = useTranslation("translations");

    React.useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open, onClose]);

    if (!open || !lead) return null;

    const summary = String((lead as any).summary || "").trim();
    const convLink = getConversationLink(lead);
    const { status, customStatusLabel } = getLeadStatus(lead);

    const statusLabel =
        status === "custom"
            ? customStatusLabel || t("lead_status.custom")
            : status
              ? t(`lead_status.${status}`)
              : "—";

    return createPortal(
        <div
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="w-full max-w-3xl rounded-2xl bg-white dark:bg-neutral-950 ring-1 ring-emerald-400/30 shadow-2xl overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-neutral-200/70 dark:border-neutral-800/70 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold">{t("stats_summary")}</div>
                                <div className="mt-1">
                                    <ContactCell lead={lead} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                                className={
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] ring-1 " +
                                    scoreClasses(Number((lead as any).score || 0))
                                }
                            >
                                {Number((lead as any).score || 0)}/10
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-lg ring-1 ring-emerald-400/20 px-2.5 py-1 text-[12px]">
                                <span className="opacity-70">{t("stats_status")}:</span>
                                <span className="font-medium">{statusLabel}</span>
                            </span>

                            {convLink ? (
                                <a
                                    href={convLink}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="inline-flex items-center gap-2 rounded-lg ring-1 ring-emerald-400/20 px-2.5 py-1 text-[12px] hover:bg-emerald-500/10"
                                    title="Abrir conversación"
                                >
                                    <ChannelIcon channel={(lead as any).channel} />
                                    <span>{t("open")}</span>
                                </a>
                            ) : null}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 ring-1 ring-neutral-300/60 dark:ring-neutral-700/60"
                        onClick={onClose}
                        title={t("close")}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <div className="max-h-[60vh] overflow-auto rounded-xl bg-neutral-50 dark:bg-neutral-900/40 ring-1 ring-neutral-200/70 dark:ring-neutral-800/70 p-4">
                        {summary ? (
                            <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-800 dark:text-neutral-100/90">
                                {summary}
                            </p>
                        ) : (
                            <p className="text-sm opacity-70">—</p>
                        )}
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-neutral-200/70 dark:border-neutral-800/70 flex justify-end">
                    <button
                        type="button"
                        className="text-sm px-4 py-2 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        onClick={onClose}
                    >
                        {t("close")}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

interface LeadsTableProps {
    leads: Lead[];
    /** Callback opcional (por si querés trackear o hacer algo al abrir el modal) */
    onOpenLead?: (lead: Lead) => void;
    campaignId?: string;
    onUpdateLeadStatus?: (args: {
        campaignId: string;
        conversationId: string;
        status: LeadStatus;
        customStatusLabel?: string;
    }) => Promise<unknown>;
}

export function LeadsTable({ leads, onOpenLead, campaignId, onUpdateLeadStatus }: LeadsTableProps) {
    const { t } = useTranslation("translations");

    console.log('my leads', leads);
    

    const [overrides, setOverrides] = React.useState<
        Record<string, { status: LeadStatus; customStatusLabel?: string }>
    >({});

    const [summaryOpen, setSummaryOpen] = React.useState(false);
    const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

    const mergedLeads = React.useMemo(() => {
        return leads.map((l) => {
            const convId = getLeadConversationId(l);
            const ov = convId ? overrides[convId] : undefined;
            if (!ov) return l;
            return {
                ...(l as any),
                status: ov.status,
                customStatusLabel: ov.customStatusLabel,
            } as Lead;
        });
    }, [leads, overrides]);

    const openSummary = React.useCallback(
        (lead: Lead) => {
            setSelectedLead(lead);
            setSummaryOpen(true);
            onOpenLead?.(lead);
        },
        [onOpenLead],
    );

    const closeSummary = React.useCallback(() => {
        setSummaryOpen(false);
        setSelectedLead(null);
    }, []);

    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-400/10">
                <h3 className="text-sm font-semibold">Leads</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left">
                        <tr className="border-b border-emerald-400/10">
                            <th className="px-4 py-2">{t("stats_name")}</th>
                            <th className="px-4 py-2">{t("stats_summary")}</th>
                            <th className="px-4 py-2">{t("stats_score")}</th>
                            <th className="px-4 py-2">{t("stats_status")}</th>
                            <th className="px-4 py-2">{t("stats_area")}</th>
                            <th className="px-4 py-2">{t("stats_conversation")}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {mergedLeads.map((l) => {
                            const convLink = getConversationLink(l);
                            const convId = getLeadConversationId(l);

                            return (
                                <tr
                                    key={(l as any).id}
                                    className="group border-b border-emerald-400/10 hover:bg-emerald-500/5 cursor-pointer"
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target?.closest?.("[data-stop-row]")) return;
                                        openSummary(l);
                                    }}
                                    title="Ver resumen completo"
                                >
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <ContactCell lead={l} />
                                    </td>

                                    <td className="px-4 py-2 max-w-[420px]">
                                        <div className="relative pr-10">
                                            <p className="line-clamp-2 opacity-80">{(l as any).summary}</p>

                                            {/* Botón ojo: abre modal sin afectar otras acciones */}
                                            <button
                                                type="button"
                                                data-stop-row
                                                className="absolute right-0 top-0 inline-flex items-center justify-center h-8 w-8 rounded-lg ring-1 ring-emerald-400/20 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openSummary(l);
                                                }}
                                                title="Ver resumen completo"
                                            >
                                                <Eye className="h-4 w-4 opacity-80" />
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-4 py-2">
                                        <span
                                            className={
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] ring-1 " +
                                                scoreClasses((l as any).score)
                                            }
                                        >
                                            {(l as any).score}/10
                                        </span>
                                    </td>

                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <StatusCell
                                            lead={l}
                                            campaignId={campaignId}
                                            onUpdateLeadStatus={onUpdateLeadStatus}
                                            onLocalUpdate={(next) => {
                                                if (!convId) return;
                                                setOverrides((prev) => ({ ...prev, [convId]: next }));
                                            }}
                                        />
                                    </td>
                                    
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span className="inline-block max-w-[150px] truncate">
                                            {t((l as any).area || "—")}
                                        </span>
                                    </td>

                                    <td className="px-4 py-2" data-stop-row>
                                        {convLink ? (
                                            <a
                                                href={convLink}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="inline-flex items-center gap-2 rounded-lg ring-1 ring-emerald-400/20 px-2.5 py-1.5 text-[12px] hover:bg-emerald-500/10"
                                                title="Abrir conversación"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ChannelIcon channel={(l as any).channel} />
                                                <span className="hidden sm:inline">{t("open")}</span>
                                            </a>
                                        ) : (
                                            <span className="text-xs opacity-60">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <LeadSummaryModal lead={selectedLead} open={summaryOpen} onClose={closeSummary} />
        </div>
    );
}
