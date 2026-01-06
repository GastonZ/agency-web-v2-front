import * as React from "react";
import { useNavigate } from "react-router-dom";

import OnlineLayout from "../layout/OnlineLayout";
import ActionsButton from "../components/features/ActionsButton";
import { useTranslation } from "react-i18next";
import { isSubAccountSession } from "../utils/helper";

import {
  searchMyModerationCampaigns,
  updateModerationCampaignStatus,
} from "../services/campaigns";
import type { ModerationCampaignItem } from "../services/types/moderation-types";

import { searchMyMarketingCampaigns } from "../services/marketingCampaigns";
import type { MarketingCampaignItem } from "../services/types/marketing-types";

function sortNewestFirst<A extends { updatedAt?: string; createdAt?: string }>(a: A, b: A) {
  const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
  const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
  return db - da;
}

function statusTone(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "active")
    return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-emerald-400/30";
  if (v === "paused")
    return "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-amber-400/30";
  if (v === "inactive" || v === "archived")
    return "text-neutral-500 dark:text-neutral-400 bg-neutral-500/10 ring-neutral-400/30";
  return "text-neutral-700 dark:text-neutral-300 bg-neutral-500/10 ring-neutral-400/30";
}

type StatusFilter = "" | "draft" | "active" | "inactive";

export default function CampaignsTable() {
  const navigate = useNavigate();

  const { t } = useTranslation('translations');

  const isSub = isSubAccountSession();

  const [modRows, setModRows] = React.useState<ModerationCampaignItem[]>([]);
  const [mktRows, setMktRows] = React.useState<MarketingCampaignItem[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [errorMod, setErrorMod] = React.useState<string | null>(null);
  const [errorMkt, setErrorMkt] = React.useState<string | null>(null);

  const [searchText, setSearchText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");

  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const campaignToDelete = React.useMemo(
    () => modRows.find((c) => c.id === confirmDeleteId) || null,
    [confirmDeleteId, modRows]
  );

  const deleteModCampaign = async (id: string) => {
    try {
      setDeleting(true);
      setDeleteError(null);

      await updateModerationCampaignStatus(id, "inactive");

      setModRows((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    } catch (e: any) {
      console.error(e);
      setDeleteError(e?.message || "No se pudo borrar la campaña. Intentá de nuevo.");
    } finally {
      setDeleting(false);
    }
  };

  // aplica filtros al backend
  const applyFilters = React.useCallback(async () => {
    setLoading(true);
    setErrorMod(null);
    setErrorMkt(null);

    try {
      const filters: any = {};
      if (searchText.trim()) filters.search = searchText.trim();
      if (statusFilter) filters.status = statusFilter;

      const [modRes, mktRes] = await Promise.allSettled([
        searchMyModerationCampaigns(filters),
        searchMyMarketingCampaigns(),
      ]);

      if (modRes.status === "fulfilled") {
        const list =
          (modRes.value?.items || (modRes.value as any) || []).slice().sort(sortNewestFirst);
        setModRows(list);
      } else {
        setErrorMod(modRes.reason?.message || "No se pudieron cargar campañas de moderación.");
      }

      if (mktRes.status === "fulfilled") {
        const list =
          (mktRes.value?.items || (mktRes.value as any) || []).slice().sort(sortNewestFirst);
        setMktRows(list);
      } else {
        setErrorMkt(mktRes.reason?.message || "No se pudieron cargar campañas de marketing.");
      }
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter]);

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("");
    applyFilters();
  };

  const handleShowArchived = () => {
    setStatusFilter("inactive");
    setTimeout(() => {
      applyFilters();
    }, 0);
  };

  if (loading && !modRows.length && !mktRows.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-300 text-sm">{t("loading_campaigns")}</p>
        </div>
      </div>
    );
  }

  return (
    <OnlineLayout>
      <div className="space-y-8">
        {/* Errores (si los hay) */}
        {(errorMod || errorMkt || deleteError) && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300 space-y-1">
            {errorMod && (
              <div>
                {t("campaigns_error_moderation")}: {errorMod}
              </div>
            )}
            {errorMkt && (
              <div>
                {t("campaigns_error_marketing")}: {errorMkt}
              </div>
            )}
            {deleteError && <div>{deleteError}</div>}
          </div>
        )}

        {/* Tabla Moderación */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{t("my_moderation_campaigns")}</h2>
            {/*             <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg text-sm bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                  onClick={handleShowArchived}
                >
                  Ver campañas archivadas
                </button>
              </div> */}
          </div>

          <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl ring-1 ring-emerald-400/20 overflow-visible">
            {/* Filtros */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-200/40 dark:border-neutral-800/60 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={t("campaigns_search_placeholder")}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full md:max-w-xs rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                >
                  <option value="">{t("campaigns_status_all")}</option>
                  <option value="draft">{t("campaigns_status_draft")}</option>
                  <option value="active">{t("campaigns_status_active")}</option>
                  <option value="inactive">{t("campaigns_status_inactive")}</option>
                  <option value="archived">{t("campaigns_status_archived")}</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-lg text-xs md:text-sm bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                >
                  {t("campaigns_clear")}
                </button>
                <button
                  onClick={applyFilters}
                  className="px-3 py-1.5 rounded-lg text-xs md:text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
                  disabled={loading}
                >
                  {t("campaigns_apply_filters")}
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-[15px] leading-6">
                <thead className="bg-white/80 dark:bg-neutral-900/80">
                  <tr className="text-left border-b border-neutral-200/50 dark:border-neutral-800/60">
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_name")}</th>
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_status")}</th>
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_updated")}</th>
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_channels")}</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="[&_tr:nth-child(even)]:bg-black/0 [&_tr:nth-child(odd)]:bg-black/0">
                  {modRows.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-4 text-sm opacity-70" colSpan={5}>
                        {t("campaigns_empty_with_filters")}
                      </td>
                    </tr>
                  )}
                  {modRows.map((c) => {
                    const date = c.updatedAt || c.createdAt || "";
                    return (
                      <tr
                        key={c.id}
                        className="border-t border-neutral-200/20 dark:border-neutral-800/40 hover:bg-emerald-500/5 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusTone(c.status)}`}>
                            {c.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{date ? new Date(date).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3">{(c.channels || []).join(", ") || "—"}</td>
                        <td className="px-4 py-3">
                          <ActionsButton
                            onViewStats={() => navigate(`/my_moderation_campaign/${c.id}/statistics`)}
                            onEdit={isSub ? undefined : () => navigate(`/campaign_moderation_creation?fromId=${c.id}`)}
                            showEdit={!isSub}
                            showDelete={!isSub && c.status !== "inactive"}
                            onDelete={isSub ? undefined : () => setConfirmDeleteId(c.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Tabla Marketing */}
        <section className="space-y-3 pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">{t("my_marketing_campaigns")}</h2>

          <div className="rounded-2xl pt-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl ring-1 ring-emerald-400/20 overflow-visible">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[15px] leading-6">
                <thead className="bg-white/80 dark:bg-neutral-900/80">
                  <tr className="text-left border-b border-neutral-200/50 dark:border-neutral-800/60">
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_name")}</th>
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_status")}</th>
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_updated")}</th>
                    <th className="px-4 py-3 font-semibold">{t("campaigns_table_channels")}</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="[&_tr:nth-child(even)]:bg-black/0 [&_tr:nth-child(odd)]:bg-black/0">
                  {mktRows.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-4 text-sm opacity-70" colSpan={5}>
                        {t("campaigns_empty_marketing")}
                      </td>
                    </tr>
                  )}
                  {mktRows.map((c) => {
                    const date = c.updatedAt || c.createdAt || "";
                    const chans = c.selectedChannels || c.channels || [];
                    return (
                      <tr
                        key={c.id}
                        className="border-t border-neutral-200/20 dark:border-neutral-800/40 hover:bg-emerald-500/5 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusTone(c.status)}`}>
                            {c.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{date ? new Date(date).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3">{(chans || []).join(", ") || "—"}</td>
                        <td className="px-4 py-3">
                          <ActionsButton
                            onViewStats={() => navigate(`/my_marketing_campaign/${c.id}/statistics`)}
                            onEdit={isSub ? undefined : () => navigate(`/campaign_marketing_creation?fromId=${c.id}`)}
                            showEdit={!isSub}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-xl w-full max-w-md p-6 ring-1 ring-emerald-400/40">
            <h3 className="text-[15px] font-semibold leading-tight mb-2">
              {t("campaigns_delete_modal_title")}
            </h3>
            <p className="text-sm opacity-80">
              {t("campaigns_delete_modal_confirm")}
              <br />
              <span className="font-medium">{campaignToDelete?.name || t("campaigns_unnamed_campaign")}</span>.
              <br />
              {t("campaigns_delete_modal_will_be_marked_as")}{" "}
              <span className="font-mono">inactive</span>{" "}
              {t("campaigns_delete_modal_will_disappear")}
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="text-sm px-3 py-1.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70"
                disabled={deleting}
                onClick={() => {
                  if (!deleting) {
                    setConfirmDeleteId(null);
                    setDeleteError(null);
                  }
                }}
              >
                {t("campaigns_cancel")}
              </button>
              <button
                className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white disabled:opacity-60"
                disabled={deleting}
                onClick={() => confirmDeleteId && deleteModCampaign(confirmDeleteId)}
              >
                {deleting ? t("campaigns_deleting") : t("campaigns_delete_campaign")}
              </button>
            </div>
          </div>
        </div>
      )}
    </OnlineLayout>
  );
}
