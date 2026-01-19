import * as React from "react";
import { Loader2, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Lead, LeadStatus } from "../../../../services/types/moderation-types";
import {
  getModerationAnalysisSummary,
  type ModerationAnalysisSummaryFilters,
  type ModerationAnalysisSummarySortBy,
  type ModerationAnalysisSummarySortOrder,
} from "../../../../services/campaigns";
import { getMyAreas } from "../../../../services/subaccounts";
import { LeadsTable } from "./LeadsTable";

type DraftFilters = {
  channels: Array<"instagram" | "whatsapp" | "facebook">;
  classifications: Array<"hot" | "warm" | "cold">;
  priorities: Array<"high" | "medium" | "low" | "urgent">;
  statuses: LeadStatus[];
  /** null => no filter. string includes "all" or a user area */
  area: string | null;
  scoreMin: string;
  scoreMax: string;
  sortBy: ModerationAnalysisSummarySortBy;
  sortOrder: ModerationAnalysisSummarySortOrder;
};

type UserArea = {
  _id?: string;
  name: string;
  description?: string;
};

const DEFAULT_FILTERS: DraftFilters = {
  channels: [],
  classifications: [],
  priorities: [],
  statuses: [],
  area: null,
  scoreMin: "",
  scoreMax: "",
  sortBy: "updatedAt",
  sortOrder: "desc",
};

function toNumberOrUndefined(v: string) {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? undefined : n;
}

function toggleInArray<T extends string>(arr: T[], value: T) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function mapApiLeadToLead(l: any): Lead {
  const cp = l?.contactProfile || {};

  const normalizedProfilePic =
    cp.profile_pic || cp.profilePic || cp?.raw?.profile_pic || null;

  const normalizedName =
    cp.name ||
    (l?.extractedData && l.extractedData.name) ||
    l?.contactName ||
    "Lead sin nombre";

  const normalizedUsername = cp.username || null;
  const conversationId = l?.conversationId || l?.id;

  return {
    id: conversationId || `${l?.contactNumber || "lead"}-${l?.analyzedAt || ""}`,
    conversationId: conversationId || undefined,
    campaignId: l?.campaignId || undefined,
    name: normalizedName,
    summary: l?.summary || "",
    score: typeof l?.finalScore === "number" ? l.finalScore : 0,
    channel: (l?.channel || "unknown") as any,
    channelLink: undefined,
    status: (l?.status || l?.leadStatus || "new") as any,
    customStatusLabel: l?.customStatusLabel || undefined,
    area: l?.area || "all",
    username: normalizedUsername,
    profilePic: normalizedProfilePic,
    contactNumber: l?.contactNumber || null,
    nextAction: Array.isArray(l?.nextAction) ? l.nextAction : undefined,
  };
}

function Chip({
  active,
  children,
  onClick,
  title,
  disabled,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={
        "inline-flex items-center rounded-full px-3 py-1.5 text-[12px] ring-1 transition whitespace-nowrap " +
        (active
          ? "bg-emerald-600 text-white ring-emerald-600"
          : "bg-white/70 dark:bg-neutral-950/30 ring-neutral-300/60 dark:ring-neutral-800/70 hover:bg-neutral-50 dark:hover:bg-white/5") +
        (disabled ? " opacity-60 cursor-not-allowed" : "")
      }
    >
      {children}
    </button>
  );
}

export function LeadsTablePanel({
  campaignId,
  onOpenLead,
}: {
  campaignId: string;
  onOpenLead?: (lead: Lead) => void;
}) {
  const { t } = useTranslation("translations");

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = React.useState<DraftFilters>(DEFAULT_FILTERS);

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(25);

  const [areas, setAreas] = React.useState<UserArea[]>([]);
  const [areasLoading, setAreasLoading] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [pagination, setPagination] = React.useState<
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAreasLoading(true);
        const data = await getMyAreas();
        if (cancelled) return;
        setAreas(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setAreas([]);
      } finally {
        if (!cancelled) setAreasLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = React.useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(applied);
  }, [draft, applied]);

  const activeChips = React.useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];

    if (applied.channels.length) {
      chips.push({
        key: "channels",
        label: `${t("stats_filter_channels")}: ${applied.channels.join(", ")}`,
      });
    }
    if (applied.classifications.length) {
      chips.push({
        key: "classifications",
        label: `${t("stats_filter_classifications")}: ${applied.classifications.join(", ")}`,
      });
    }
    if (applied.priorities.length) {
      chips.push({
        key: "priorities",
        label: `${t("stats_filter_priorities")}: ${applied.priorities.join(", ")}`,
      });
    }
    if (applied.statuses.length) {
      chips.push({
        key: "statuses",
        label: `${t("stats_filter_statuses")}: ${applied.statuses
          .map((s) => t(`lead_status.${s}`))
          .join(", ")}`,
      });
    }
    if (applied.area) {
      chips.push({
        key: "area",
        label: `${t("stats_filter_area")}: ${applied.area === "all" ? t("all") : applied.area}`,
      });
    }
    if (applied.scoreMin || applied.scoreMax) {
      chips.push({
        key: "score",
        label: `${t("stats_filter_score")}: ${applied.scoreMin || "—"}–${
          applied.scoreMax || "—"
        }`,
      });
    }
    if (applied.sortBy || applied.sortOrder) {
      chips.push({
        key: "sort",
        label: `${t("stats_filter_sort")}: ${applied.sortBy} ${applied.sortOrder}`,
      });
    }

    return chips;
  }, [applied, t]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const query: ModerationAnalysisSummaryFilters = {
          channels: applied.channels.length ? applied.channels : undefined,
          classifications: applied.classifications.length
            ? applied.classifications
            : undefined,
          priorities: applied.priorities.length ? applied.priorities : undefined,
          statuses: applied.statuses.length ? applied.statuses : undefined,
          area: applied.area ?? undefined,
          finalScoreMin: toNumberOrUndefined(applied.scoreMin),
          finalScoreMax: toNumberOrUndefined(applied.scoreMax),
          sortBy: applied.sortBy,
          sortOrder: applied.sortOrder,
          page,
          limit,
        };

        const res: any = await getModerationAnalysisSummary(campaignId, query);
        if (cancelled) return;

        const apiLeads = Array.isArray(res?.analysisResults) ? res.analysisResults : [];
        setLeads(apiLeads.map(mapApiLeadToLead));
        setPagination(res?.pagination || null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Error");
        setLeads([]);
        setPagination(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, applied, page, limit]);

  const total = pagination?.total;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div>
      <div className="mb-3 rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t("stats_leads_table_title") || "Leads"}</div>
              <div className="mt-0.5 text-xs opacity-70">
                {typeof total === "number"
                  ? `${t("stats_showing") || "Mostrando"} ${leads.length} / ${total}`
                  : `${t("stats_showing") || "Mostrando"} ${leads.length}`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-emerald-400/20 hover:bg-emerald-500/10"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t("stats_filters")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDraft(DEFAULT_FILTERS);
                  setApplied(DEFAULT_FILTERS);
                  setPage(1);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 hover:bg-neutral-50 dark:hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4" />
                {t("reset") || "Reset"}
              </button>
            </div>
          </div>

          {activeChips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/20 px-3 py-1 text-[12px]"
                >
                  {c.label}
                </span>
              ))}
            </div>
          ) : null}

          {filtersOpen ? (
            <div className="rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/30 ring-1 ring-neutral-200/70 dark:ring-neutral-800/70 p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold opacity-80 mb-2">{t("stats_filter_channels")}</div>
                  <div className="flex flex-wrap gap-2">
                    {(["instagram", "whatsapp", "facebook"] as const).map((ch) => (
                      <Chip
                        key={ch}
                        active={draft.channels.includes(ch)}
                        onClick={() => setDraft((p) => ({ ...p, channels: toggleInArray(p.channels, ch) }))}
                      >
                        {ch}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold opacity-80 mb-2">{t("stats_filter_classifications")}</div>
                  <div className="flex flex-wrap gap-2">
                    {(["hot", "warm", "cold"] as const).map((c) => (
                      <Chip
                        key={c}
                        active={draft.classifications.includes(c)}
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            classifications: toggleInArray(p.classifications, c),
                          }))
                        }
                      >
                        {c}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold opacity-80 mb-2">{t("stats_filter_priorities")}</div>
                  <div className="flex flex-wrap gap-2">
                    {(["urgent", "high", "medium", "low"] as const).map((p) => (
                      <Chip
                        key={p}
                        active={draft.priorities.includes(p)}
                        onClick={() => setDraft((s) => ({ ...s, priorities: toggleInArray(s.priorities, p) }))}
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold opacity-80 mb-2">{t("stats_filter_statuses")}</div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      "new",
                      "on_following",
                      "contacted",
                      "negotiating",
                      "closed_won",
                      "closed_lost",
                      "custom",
                    ] as LeadStatus[]).map((s) => (
                      <Chip
                        key={s}
                        active={draft.statuses.includes(s)}
                        onClick={() => setDraft((p) => ({ ...p, statuses: toggleInArray(p.statuses, s) }))}
                      >
                        {t(`lead_status.${s}`)}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold opacity-80 mb-2">{t("stats_filter_area")}</div>
                  <select
                    className="h-10 w-full rounded-xl bg-white/80 dark:bg-neutral-950/50 ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 px-3 outline-none"
                    value={draft.area ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft((p) => ({ ...p, area: v === "" ? null : v }));
                    }}
                  >
                    <option value="">{t("stats_any") || "Cualquier"}</option>
                    <option value="all">{t("stats_area_all_default") || `${t("all")} (default)`}</option>
                    {areasLoading ? null :
                      areas.map((a) => (
                        <option key={a._id || a.name} value={a.name}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div className="text-xs font-semibold opacity-80 mb-2">{t("stats_filter_score")}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={draft.scoreMin}
                      onChange={(e) => setDraft((p) => ({ ...p, scoreMin: e.target.value }))}
                      className="h-10 w-full rounded-xl bg-white/80 dark:bg-neutral-950/50 ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 px-3 outline-none"
                      placeholder={t("min") || "Min"}
                    />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={draft.scoreMax}
                      onChange={(e) => setDraft((p) => ({ ...p, scoreMax: e.target.value }))}
                      className="h-10 w-full rounded-xl bg-white/80 dark:bg-neutral-950/50 ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 px-3 outline-none"
                      placeholder={t("max") || "Max"}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold opacity-80 mb-2">{t("stats_filter_sort")}</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={draft.sortBy}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, sortBy: e.target.value as any }))
                      }
                      className="h-10 w-full rounded-xl bg-white/80 dark:bg-neutral-950/50 ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 px-3 outline-none"
                    >
                      {(
                        [
                          "updatedAt",
                          "createdAt",
                          "analyzedAt",
                          "finalScore",
                          "classification",
                          "priority",
                          "status",
                        ] as ModerationAnalysisSummarySortBy[]
                      ).map((sb) => (
                        <option key={sb} value={sb}>
                          {sb}
                        </option>
                      ))}
                    </select>

                    <select
                      value={draft.sortOrder}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, sortOrder: e.target.value as any }))
                      }
                      className="h-10 w-[140px] rounded-xl bg-white/80 dark:bg-neutral-950/50 ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 px-3 outline-none"
                    >
                      <option value="desc">desc</option>
                      <option value="asc">asc</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 hover:bg-neutral-50 dark:hover:bg-white/5"
                  onClick={() => {
                    setDraft(DEFAULT_FILTERS);
                  }}
                >
                  {t("clear") || "Clear"}
                </button>

                <button
                  type="button"
                  disabled={!isDirty}
                  className="h-10 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
                  onClick={() => {
                    setApplied(draft);
                    setPage(1);
                  }}
                >
                  {t("apply") || "Apply"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      <div className="relative">
        <LeadsTable leads={leads} onOpenLead={onOpenLead} campaignId={campaignId} />

        {loading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-neutral-950/40 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin opacity-70" />
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs opacity-70">
          {typeof total === "number"
            ? `${t("stats_total") || "Total"}: ${total}`
            : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">{t("rows") || "Rows"}</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-xl bg-white/80 dark:bg-neutral-950/50 ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 px-2 text-sm outline-none"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              className="h-9 px-3 rounded-xl ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 hover:bg-neutral-50 dark:hover:bg-white/5 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("previous_page") || "Prev"}
            </button>

            <span className="text-sm">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || page >= totalPages}
              className="h-9 px-3 rounded-xl ring-1 ring-neutral-300/60 dark:ring-neutral-800/70 hover:bg-neutral-50 dark:hover:bg-white/5 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("next") || "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
