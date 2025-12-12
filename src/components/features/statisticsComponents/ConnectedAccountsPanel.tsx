import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  pauseModerationChannel,
  unpauseModerationChannel,
} from "../../../services/campaigns";
import type { ModerationChannel } from "../../../services/campaigns";

type WhatsappStatus = {
  qrScanned?: boolean;
  qrScannedAt?: string | null;
  qrScannedBy?: string | null;
  qrScannedByPhone?: string | null;
  paused?: boolean;
} | null | undefined;

type SocialAccsData = {
  instagram?: {
    username?: string;
    profilePicture?: string;
    name?: string;
    paused?: boolean;
  };
  facebook?: {
    id?: string;
    name?: string;
    category?: string;
    profilePicture?: string;
    paused?: boolean;
  };
};

type Props = {
  socialAccsData?: SocialAccsData | null;
  whatsappStatus?: WhatsappStatus;
  campaignId: string;
  className?: string;

  onReconnectWhatsapp?: () => void;
  instagramReconnectButton?: React.ReactNode;
  facebookReconnectButton?: React.ReactNode;
};

export default function ConnectedAccountsPanel({
  socialAccsData,
  whatsappStatus,
  campaignId,
  className = "",
  onReconnectWhatsapp,
  instagramReconnectButton,
  facebookReconnectButton,
}: Props) {
  const { i18n } = useTranslation();
  const { t } = useTranslation("translations");
  const uiLang = i18n.language.startsWith("en") ? "en" : "es";

  const ig = socialAccsData?.instagram;
  const fb = socialAccsData?.facebook;

  const isWhatsConnected = Boolean(whatsappStatus?.qrScanned);
  const isIgConnected = Boolean(ig && (ig.username || ig.profilePicture || ig.name));
  const isFbConnected = Boolean(fb && (fb.id || fb.name || fb.profilePicture));

  const nothingConnected = !isWhatsConnected && !isIgConnected && !isFbConnected;

  const whatsPhone = whatsappStatus?.qrScannedByPhone || null;
  const whatsWhen = whatsappStatus?.qrScannedAt || null;

  const [localPaused, setLocalPaused] = React.useState<{
    whatsapp: boolean;
    instagram: boolean;
    facebook: boolean;
  }>({
    whatsapp: Boolean(whatsappStatus?.paused),
    instagram: Boolean(ig?.paused),
    facebook: Boolean(fb?.paused),
  });

  const [loadingChannel, setLoadingChannel] = React.useState<ModerationChannel | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalPaused({
      whatsapp: Boolean(whatsappStatus?.paused),
      instagram: Boolean(socialAccsData?.instagram?.paused),
      facebook: Boolean(socialAccsData?.facebook?.paused),
    });
  }, [
    whatsappStatus?.paused,
    socialAccsData?.instagram?.paused,
    socialAccsData?.facebook?.paused,
  ]);

  const handleToggleChannel = async (channel: ModerationChannel) => {
    setErrorMsg(null);
    setLoadingChannel(channel);
    try {
      const currentlyPaused = localPaused[channel as keyof typeof localPaused];

      if (currentlyPaused) {
        await unpauseModerationChannel(campaignId, channel);
      } else {
        await pauseModerationChannel(campaignId, channel);
      }

      setLocalPaused((prev) => ({
        ...prev,
        [channel]: !currentlyPaused,
      }));
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
        (uiLang === "en"
          ? "There was an error updating the channel status."
          : "Hubo un error al actualizar el estado del canal.")
      );
    } finally {
      setLoadingChannel(null);
    }
  };

  const pausedLabel = (paused: boolean) =>
    paused
      ? uiLang === "en"
        ? "Paused: the assistant will NOT reply on this channel."
        : "Pausado: el asistente NO va a responder en este canal."
      : uiLang === "en"
        ? "Active: the assistant will reply on this channel."
        : "Activo: el asistente va a responder en este canal.";

  const btnText = (paused: boolean) =>
    paused
      ? uiLang === "en"
        ? "Resume channel"
        : "Reanudar canal"
      : uiLang === "en"
        ? "Pause channel"
        : "Pausar canal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={[
        "rounded-xl p-4 md:p-6 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ring-1 ring-emerald-400/20",
        "relative overflow-hidden",
        className,
      ].join(" ")}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl"
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold leading-tight">
            {t("linked_accounts")}
          </h3>
          <p className="text-sm opacity-80 mt-1">
            {t("ready_channels")}
          </p>

          {errorMsg && (
            <p className="mt-2 text-xs text-red-500">
              {errorMsg}
            </p>
          )}

          {nothingConnected ? (
            <p className="mt-3 text-xs opacity-70">
              {uiLang === "en"
                ? "No channel is connected yet, but once you link WhatsApp / Instagram / Facebook you’ll see them here."
                : "Todavía no hay ningún canal conectado, pero cuando vincules WhatsApp / Instagram / Facebook los vas a ver acá."}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* WHATSAPP */}
              {isWhatsConnected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl ring-1 ring-emerald-400/30 bg-emerald-500/10 p-3"
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-emerald-600/15 ring-1 ring-emerald-400/40"
                      animate={{ rotate: [0, -4, 0, 4, 0] }}
                      transition={{ duration: 6, repeat: Infinity }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </motion.div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">
                        WhatsApp {t("connected")}
                      </div>
                      <div className="mt-0.5 text-xs opacity-80">
                        {t("number")}{" "}
                        <span className="font-mono">
                          {whatsPhone || t("unknown")}
                        </span>
                      </div>
                      {whatsWhen && (
                        <div className="mt-0.5 text-xs opacity-70">
                          {t("since")}{" "}
                          {(() => {
                            const d = new Date(whatsWhen);
                            return isNaN(d.getTime())
                              ? whatsWhen
                              : d.toLocaleString();
                          })()}
                        </div>
                      )}

                      <p className="mt-1 text-xs opacity-80">
                        {pausedLabel(localPaused.whatsapp)}
                      </p>
                      <div className="flex flex-col w-max">
                        <button
                          type="button"
                          onClick={() => handleToggleChannel("whatsapp")}
                          disabled={loadingChannel === "whatsapp"}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ring-1 ring-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-60"
                        >
                          {localPaused.whatsapp ? (
                            <PlayCircle className="h-3.5 w-3.5" />
                          ) : (
                            <PauseCircle className="h-3.5 w-3.5" />
                          )}
                          {loadingChannel === "whatsapp"
                            ? uiLang === "en"
                              ? "Updating..."
                              : "Actualizando..."
                            : btnText(localPaused.whatsapp)}
                        </button>

                        {onReconnectWhatsapp && (
                          <button
                            type="button"
                            onClick={onReconnectWhatsapp}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ring-1 ring-neutral-400/40 bg-neutral-500/5 hover:bg-neutral-500/10"
                          >
                            {uiLang === "en" ? "Relink WhatsApp" : "Re-vincular WhatsApp"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* INSTAGRAM */}
              {isIgConnected && ig && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl ring-1 ring-emerald-400/30 bg-emerald-500/10 p-3"
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="inline-flex items-center justify-center rounded-md h-16 w-16 bg-emerald-600/15 ring-1 ring-emerald-400/40"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {ig.profilePicture ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={ig.profilePicture}
                          alt="Instagram profile picture"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/40" />
                      )}
                    </motion.div>
                    <div className="flex-1">
                      <div className="text-[18px]">
                        Instagram{" "}
                        <span className="font-medium">{ig.username || ig.name || "Cuenta"}</span>{" "}
                        {t("connected")}
                      </div>

                      <p className="mt-1 text-xs opacity-80">
                        {pausedLabel(localPaused.instagram)}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleToggleChannel("instagram")}
                        disabled={loadingChannel === "instagram"}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ring-1 ring-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {localPaused.instagram ? (
                          <PlayCircle className="h-3.5 w-3.5" />
                        ) : (
                          <PauseCircle className="h-3.5 w-3.5" />
                        )}
                        {loadingChannel === "instagram"
                          ? uiLang === "en"
                            ? "Updating..."
                            : "Actualizando..."
                          : btnText(localPaused.instagram)}
                      </button>

                      {instagramReconnectButton && (
                        <div className="mt-2">
                          {instagramReconnectButton}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* FACEBOOK */}
              {isFbConnected && fb && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl ring-1 ring-emerald-400/30 bg-emerald-500/10 p-3"
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-emerald-600/15 ring-1 ring-emerald-400/40"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {fb.profilePicture ? (
                        <img
                          className="h-6 w-6 rounded-full object-cover"
                          src={fb.profilePicture}
                          alt="Facebook profile picture"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/40" />
                      )}
                    </motion.div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">
                        Facebook{" "}
                        <strong>{fb.name || "Página"}</strong> {t("connected")}
                      </div>
                      {fb.category && (
                        <div className="mt-0.5 text-xs opacity-80">
                          {fb.category}
                        </div>
                      )}

                      <p className="mt-1 text-xs opacity-80">
                        {pausedLabel(localPaused.facebook)}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleToggleChannel("facebook")}
                        disabled={loadingChannel === "facebook"}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ring-1 ring-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {localPaused.facebook ? (
                          <PlayCircle className="h-3.5 w-3.5" />
                        ) : (
                          <PauseCircle className="h-3.5 w-3.5" />
                        )}
                        {loadingChannel === "facebook"
                          ? uiLang === "en"
                            ? "Updating..."
                            : "Actualizando..."
                          : btnText(localPaused.facebook)}
                      </button>

                      {facebookReconnectButton && (
                        <div className="mt-2">
                          {facebookReconnectButton}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
