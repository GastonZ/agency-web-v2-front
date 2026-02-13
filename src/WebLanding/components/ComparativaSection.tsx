
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import { IconCircleCheckFilled, IconCircleXFilled, IconChevronRight } from "@tabler/icons-react";

const SECTION_BADGE_STYLE = "mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-4 py-1.5 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-white/60 select-none cursor-default mx-auto";

export default function ComparativaSection() {
  const { t } = useI18n()

  const comparativa = [
    {
      feature: t('comparison.features.realtime_data'),
      datacivis: true,
      competencia: false
    },
    {
      feature: t('comparison.features.full_automation'),
      datacivis: true,
      competencia: false
    },
    {
      feature: t('comparison.features.multichannel'),
      datacivis: true,
      competencia: true
    },
    {
      feature: t('comparison.features.compliance'),
      datacivis: true,
      competencia: false
    },
    {
      feature: t('comparison.features.support'),
      datacivis: true,
      competencia: false
    },
    {
      feature: t('comparison.features.implementation'),
      datacivis: true,
      competencia: false
    }
  ];

  return (
    <section
      id="comparativa"
      aria-labelledby="comparativa-title"
      className="relative w-full overflow-hidden"
    >

      <div className="mx-auto max-w-5xl py-24 sm:py-32 px-4 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex justify-center">
            <Badge variant="outline" className={SECTION_BADGE_STYLE}>
              {t('comparison.badge')}
            </Badge>
          </div>
          <h2 className="text-3xl lg:text-[36px] font-heading font-bold text-white tracking-tight mb-8 max-w-3xl mx-auto leading-[1.2]">
            {t('comparison.title')}
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed">
            {t('comparison.description')}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-sm"
        >
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-0 border-b border-white/10 bg-white/[0.01]">
            <div className="col-span-6 p-8 border-r border-white/10 flex items-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Capacidad</span>
            </div>
            <div className="col-span-3 p-8 border-r border-white/10 bg-white/[0.03] flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-white mb-0.5">Datacivis</span>
                <div className="w-8 h-1 bg-white rounded-full opacity-40" />
              </div>
            </div>
            <div className="col-span-3 p-8 flex items-center justify-center bg-[#0a0a0a]">
              <span className="text-sm font-medium text-white/40 uppercase tracking-widest text-center">Otros</span>
            </div>
          </div>

          {/* Feature Rows */}
          {comparativa.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`grid grid-cols-12 gap-0 border-b border-white/[0.05] group/row ${index === comparativa.length - 1 ? 'border-b-0' : ''
                }`}
            >
              <div className="col-span-6 p-6 sm:p-8 border-r border-white/10 flex items-center group-hover/row:bg-white/[0.03] transition-colors">
                <p className="text-white/80 text-sm sm:text-base font-medium transition-colors group-hover/row:text-white">
                  {item.feature}
                </p>
              </div>

              <div className="col-span-3 p-6 sm:p-8 border-r border-white/10 bg-white/[0.02] flex items-center justify-center relative">
                {/* Highlight glow for winner column */}
                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover/row:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center justify-center">
                  <IconCircleCheckFilled className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
              </div>

              <div className="col-span-3 p-6 sm:p-8 flex items-center justify-center bg-[#0a0a0a]/50">
                {item.competencia === true ? (
                  <IconCircleCheckFilled className="w-5 h-5 text-white/20" />
                ) : (
                  <IconCircleXFilled className="w-5 h-5 text-red-500/20" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
