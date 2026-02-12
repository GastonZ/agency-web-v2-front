
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import {
  IconSettingsAutomation,
  IconShare,
  IconComponents,
  IconMessageChatbot
} from "@tabler/icons-react";
import { PipelineConnector, PipelineNode } from "./PipelineComponents";

const SECTION_BADGE_STYLE = "mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-4 py-1.5 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-white/60";

export default function AIStack() {
  const { t } = useI18n();

  return (
    <section id="stack" className="relative w-full py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex justify-center">
            <Badge variant="outline" className={SECTION_BADGE_STYLE}>
              {t('nav.tech')}
            </Badge>
          </div>
          <h2 className="text-3xl lg:text-[36px] font-heading font-bold text-white tracking-tight mb-4 max-w-2xl mx-auto leading-tight">
            {t('tech.title')}
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-base leading-relaxed">
            {t('tech.description')}
          </p>
        </motion.div>

        {/* Pipeline Flow Visualization */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-y-12 lg:gap-0 lg:px-10">

          {/* Stage 1: Intelligence Models */}
          <PipelineNode
            title="Modelos de Lenguaje"
            icon={IconMessageChatbot}
            items={["OpenAI", "Qwen", "LLaMA", "Grok"]}
          />

          <PipelineConnector delay={0} />

          {/* Stage 2: Media & Automation */}
          <PipelineNode
            title="Voz, Imagen y Video"
            icon={IconComponents}
            items={["ElevenLabs", "Kling AI", "Google Veo-3"]}
          />

          <PipelineConnector delay={0.5} />

          {/* Stage 3: Datacivis Core (Active) */}
          <PipelineNode
            title="Datacivis Core"
            icon={IconSettingsAutomation}
            items={["LISA Orchestrator", "Agent Workflows"]}
            active={true}
          />

          <PipelineConnector delay={1} />

          {/* Stage 4: Propagation */}
          <PipelineNode
            title="Canales y Anuncios"
            icon={IconShare}
            items={["Meta Ads", "WhatsApp", "Instagram"]}
            logos={["/Meta_Platforms_Inc._logo_(cropped).svg.png", "/WhatsApp.svg.png", "/ig.svg"]}
          />

        </div>

        {/* Technical Footer Label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 flex justify-center"
        >
          <div className="px-6 py-2 rounded-full border border-white/5 bg-white/[0.02] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">End-to-End Autonomous Pipeline</span>
          </div>
        </motion.div>
      </div>
      {/* Dark Mask Transition - Softens the entry to the structure background */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

    </section>
  );
}
