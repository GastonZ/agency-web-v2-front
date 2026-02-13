
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import {
  IconMessageChatbot,
  IconHierarchy,
  IconReportAnalytics,
  IconCircleCheckFilled
} from "@tabler/icons-react";

const SECTION_BADGE_STYLE = "mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-4 py-1.5 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-white/60 mx-auto";

export default function Benefits() {
  const { t } = useI18n();
  const stepsData = t('benefits.features') || [];

  const getStepIcon = (index: number) => {
    switch (index) {
      case 0: return <IconMessageChatbot size={28} className="text-white" />;
      case 1: return <IconHierarchy size={28} className="text-white" />;
      case 2: return <IconReportAnalytics size={28} className="text-white" />;
      default: return null;
    }
  };

  return (
    <section
      id="beneficios"
      className="relative w-full overflow-hidden"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-radial from-white/[0.02] to-transparent pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 py-24 sm:py-32 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <Badge variant="outline" className={SECTION_BADGE_STYLE}>
              {t('benefits.badge')}
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="font-heading font-bold text-white text-3xl lg:text-[36px] tracking-tight mb-6 max-w-2xl mx-auto"
          >
            {t('benefits.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-white/40 max-w-xl mx-auto"
          >
            {t('benefits.description')}
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical Stepper Line - Gradient and Glow */}
          <div className="absolute left-8 sm:left-[2.75rem] top-0 bottom-0 w-[2px] bg-gradient-to-b from-white/20 via-white/5 to-transparent hidden sm:block">
            <motion.div
              className="absolute inset-0 bg-white/20 blur-[2px]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>

          <div className="space-y-32">
            {stepsData.map((step: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative flex flex-col sm:flex-row gap-12 sm:gap-20 items-start"
              >
                {/* Visual Marker (Number + Icon) */}
                <div className="relative flex-shrink-0 z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center relative shadow-2xl group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {getStepIcon(i)}

                    {/* Small number badge */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-bold shadow-xl">
                      0{i + 1}
                    </div>
                  </div>
                  {/* Outer glow */}
                  <div className="absolute -inset-4 bg-white/[0.03] rounded-3xl blur-xl -z-10" />
                </div>

                {/* Content Card */}
                <div className="flex-grow pt-2">
                  <div className="max-w-xl">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-heading tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-lg text-white/50 leading-relaxed mb-8 font-normal">
                      {step.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {step.benefits?.map((b: string, j: number) => (
                        <div key={j} className="flex items-center gap-3 text-sm text-white/70 list-none">
                          <IconCircleCheckFilled size={16} className="text-white/20" />
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
