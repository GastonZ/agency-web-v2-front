import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type WhatsappStatus = {
  qrScanned?: boolean;
  qrScannedAt?: string | null;
  qrScannedBy?: string | null;
  qrScannedByPhone?: string | null;
} | null | undefined;

type SocialAccsData = {
  instagram?: {
    username?: string;
    profilePicture?: string;
    name?: string;
  };
  facebook?: {
    id?: string;
    name?: string;
    category?: string;
    profilePicture?: string;
  };
};

type Props = {
  socialAccsData?: SocialAccsData | null;
  whatsappStatus?: WhatsappStatus;
  className?: string;
};

export default function ConnectedAccountsPanel({
  socialAccsData,
  whatsappStatus,
  className = "",
}: Props) {
  const { i18n } = useTranslation();
  const { t } = useTranslation("translations");
  const uiLang = i18n.language.startsWith("en") ? "en" : "es";

  const isWhatsConnected = Boolean(whatsappStatus?.qrScanned);
  const whatsPhone = whatsappStatus?.qrScannedByPhone || null;
  const whatsWhen = whatsappStatus?.qrScannedAt || null;

  const ig = socialAccsData?.instagram;
  const fb = socialAccsData?.facebook;

  const isIgConnected = Boolean(ig && (ig.username || ig.profilePicture || ig.name));
  const isFbConnected = Boolean(fb && (fb.id || fb.name || fb.profilePicture));

  const showAnything = isWhatsConnected || isIgConnected || isFbConnected;
  if (!showAnything) return null;

  console.log(socialAccsData);
  

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
      {/* Glow decorativo */}
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
                  </div>
                </div>
              </motion.div>
            )}

            {/* INSTAGRAM (desde socialAccsData.instagram) */}
            {isIgConnected && ig && (
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
                    {ig.profilePicture ? (
                      <img
                        className="h-6 w-6 rounded-full object-cover"
                        src={ig.profilePicture}
                        alt="Instagram profile picture"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-emerald-500/40" />
                    )}
                  </motion.div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">
                      Instagram{" "}
                      <strong>{ig.username || ig.name || "Cuenta"}</strong>{" "}
                      {t("connected")}
                    </div>
                    <div className="mt-0.5 text-xs opacity-80">
                      {t("ready_messages")}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FACEBOOK (desde socialAccsData.facebook) */}
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
                    <div className="mt-0.5 text-xs opacity-80">
                      {t("ready_messages")}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
