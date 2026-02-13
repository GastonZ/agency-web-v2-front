import React, { useCallback } from "react"
import { motion } from "framer-motion"
import { Badge } from "./ui/badge"
import { useI18n } from "../lib/i18n"
import { useNavigate } from "react-router-dom"
import V2ConversationalWidget from "../../V2Conversational/V2ConversationalWidget"

export default function ConversationalSection() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const handleNavigateToCreation = useCallback(() => {
    sessionStorage.setItem("post-login-redirect", "/campaign_moderation_creation/")
    navigate("/auth")
  }, [navigate])

  return (
    <section
      id="conversational"
      className="relative w-full py-24 sm:py-32 overflow-hidden"
    >
      <div className="mx-auto max-w-4xl px-4 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-4 py-1.5 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-white/60"
            >
              {t("conversational.badge")}
            </Badge>
          </div>
          <h2 className="text-3xl lg:text-[36px] font-heading font-bold text-white tracking-tight mb-4 max-w-2xl mx-auto leading-tight">
            {t("conversational.title")}
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-base leading-relaxed">
            {t("conversational.description")}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <V2ConversationalWidget
            profile="landing-datacivis"
            autoConnect={false}
            onNavigateToCreation={handleNavigateToCreation}
          />
        </motion.div>
      </div>
    </section>
  )
}
