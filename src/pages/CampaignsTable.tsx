import * as React from "react";
import { useNavigate } from "react-router-dom";

import OnlineLayout from "../layout/OnlineLayout";
import ActionsButton from "../components/features/ActionsButton";

import { searchMyModerationCampaigns } from "../services/campaigns";
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
  if (v === "active") return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-emerald-400/30";
  if (v === "paused") return "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-amber-400/30";
  return "text-neutral-700 dark:text-neutral-300 bg-neutral-500/10 ring-neutral-400/30";
}

export default function CampaignsTable() {
  const navigate = useNavigate();

  const [modRows, setModRows] = React.useState<ModerationCampaignItem[]>([]);
  const [mktRows, setMktRows] = React.useState<MarketingCampaignItem[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [errorMod, setErrorMod] = React.useState<string | null>(null);
  const [errorMkt, setErrorMkt] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMod(null);
        setErrorMkt(null);

        const [modRes, mktRes] = await Promise.allSettled([
          searchMyModerationCampaigns(),
          searchMyMarketingCampaigns(),
        ]);

        if (!alive) return;

        // Moderation
        if (modRes.status === "fulfilled") {
          const list = (modRes.value?.items || modRes.value || []).slice().sort(sortNewestFirst);
          setModRows(list);
        } else {
          setErrorMod(modRes.reason?.message || "No se pudieron cargar campañas de moderación.");
        }

        // Marketing
        if (mktRes.status === "fulfilled") {
          const list = (mktRes.value?.items || mktRes.value || []).slice().sort(sortNewestFirst);
          setMktRows(list);
        } else {
          setErrorMkt(mktRes.reason?.message || "No se pudieron cargar campañas de marketing.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-300 text-sm">Cargando campañas</p>
        </div>
      </div>
    );
  }

  return (
    <OnlineLayout>
      <div className="space-y-8">
        {/* Errores (si los hay) */}
        {(errorMod || errorMkt) && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
            {errorMod && <div>Moderación: {errorMod}</div>}
            {errorMkt && <div>Marketing: {errorMkt}</div>}
          </div>
        )}

        {/* Tabla Moderación */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Mis campañas de moderación</h2>
          <div className="ring-1 ring-gray-300 dark:ring-gray-600">
            <table className="min-w-full text-[15px] leading-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl">
              <thead className="bg-white/70 dark:bg-neutral-900/70">
                <tr className="text-left border-b border-neutral-200/50 dark:border-neutral-800/60">
                  <th className="p-3 font-semibold">Nombre</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Actualizada</th>
                  <th className="p-3 font-semibold">Canales</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:nth-child(even)]:bg-black/0 [&_tr:nth-child(odd)]:bg-black/0">
                {modRows.length === 0 && (
                  <tr>
                    <td className="p-3 text-sm opacity-70" colSpan={5}>No tenés campañas aún.</td>
                  </tr>
                )}
                {modRows.map((c) => {
                  const date = c.updatedAt || c.createdAt || "";
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-neutral-200/30 dark:border-neutral-800/40 hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="p-3 font-medium">{c.name || "—"}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusTone(c.status)}`}>
                          {c.status || "—"}
                        </span>
                      </td>
                      <td className="p-3">{date ? new Date(date).toLocaleString() : "—"}</td>
                      <td className="p-3">{(c.channels || []).join(", ") || "—"}</td>
                      <td className="p-3">
                        <ActionsButton
                          onViewStats={() => navigate(`/my_moderation_campaign/${c.id}/statistics`)}
                          onEdit={() => navigate(`/campaign_moderation_creation?fromId=${c.id}`)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tabla Marketing */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Mis campañas de marketing</h2>
          <div className="ring-1 ring-gray-300 dark:ring-gray-600">
            <table className="min-w-full text-[15px] leading-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl">
              <thead className="bg-white/70 dark:bg-neutral-900/70">
                <tr className="text-left border-b border-neutral-200/50 dark:border-neutral-800/60">
                  <th className="p-3 font-semibold">Nombre</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Actualizada</th>
                  <th className="p-3 font-semibold">Canales</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:nth-child(even)]:bg-black/0 [&_tr:nth-child(odd)]:bg-black/0">
                {mktRows.length === 0 && (
                  <tr>
                    <td className="p-3 text-sm opacity-70" colSpan={5}>No tenés campañas aún.</td>
                  </tr>
                )}
                {mktRows.map((c) => {
                  const date = c.updatedAt || c.createdAt || "";
                  const chans = c.selectedChannels || c.channels || [];
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-neutral-200/30 dark:border-neutral-800/40 hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="p-3 font-medium">{c.name || "—"}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusTone(c.status)}`}>
                          {c.status || "—"}
                        </span>
                      </td>
                      <td className="p-3">{date ? new Date(date).toLocaleString() : "—"}</td>
                      <td className="p-3">{(chans || []).join(", ") || "—"}</td>
                      <td className="p-3">
                        <ActionsButton
                          onViewStats={() => navigate(`/my_marketing_campaign/${c.id}/statistics`)}
                          onEdit={() => navigate(`/campaign_marketing_creation?fromId=${c.id}`)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </OnlineLayout>
  );
}
