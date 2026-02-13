
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import {
  IconUserCheck,
  IconMessageCircle,
  IconTrendingUp,
  IconAlertTriangle,
  IconCheck
} from "@tabler/icons-react";
import { useI18n } from "../lib/i18n";
import { RatingBadge } from "./foundations/rating-badge";

const SECTION_BADGE_STYLE = "mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-4 py-1.5 text-[10px] font-black tracking-[0.3em] uppercase transition-colors hover:text-white/60";

export default function UseCasesSection() {
  const { t } = useI18n();
  const cases = t('useCases.items') || [];

  const getCaseImage = (id: string) => {
    switch (id) {
      case 'politica': return '/case-politica.jpg';
      case 'atencion': return '/case-chatbot.jpg';
      case 'ecommerce': return '/claire.jpg';
      default: return '/placeholder.jpg';
    }
  };

  const getCaseIcon = (index: number) => {
    switch (index) {
      case 0: return <IconUserCheck size={40} className="text-white" />;
      case 1: return <IconMessageCircle size={40} className="text-white" />;
      default: return <IconTrendingUp size={40} className="text-white" />;
    }
  };

  return (
    <section
      id="casos-de-uso"
      className="relative w-full overflow-hidden"
    >
      <div className="mx-auto max-w-7xl py-20 sm:py-28 px-4 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16 sm:mb-24"
        >
          <div className="flex justify-center">
            <Badge variant="outline" className={SECTION_BADGE_STYLE}>
              {t('useCases.badge')}
            </Badge>
          </div>
          <h2 className="text-3xl lg:text-[36px] font-heading font-bold text-white tracking-tight mb-5 max-w-2xl mx-auto">
            {t('useCases.title')}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-base leading-relaxed">
            {t('useCases.description')}
          </p>
        </motion.header>

        <div className="space-y-12">
          {cases.map((useCase: any, index: number) => (
            <motion.div
              key={useCase.id || index}
              className={`relative border rounded-3xl overflow-hidden group transition-all duration-500 ${index === 0
                ? "bg-gradient-to-br from-[#121212] via-[#0D0D0D] to-[#080808] border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.05)]"
                : "bg-[#090909]/40 border-white/10"
                }`}
            >
              {index === 0 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                  <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-yellow-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>
              )}

              <div className="grid md:grid-cols-12 gap-0 relative z-10">
                {/* Visual Side */}
                <div className="md:col-span-5 relative min-h-[300px] md:min-h-full overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                  <img
                    src={getCaseImage(useCase.id)}
                    alt={useCase.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent md:bg-gradient-to-r" />

                  {/* Floating Metric Badge - Enhanced */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 sm:p-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                        {getCaseIcon(index)}
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-white tracking-tighter leading-none mb-1">{useCase.metric}</div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">{useCase.metricLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className={`md:col-span-7 p-8 md:p-10 lg:p-12 bg-gradient-to-br from-white/[0.01] to-transparent ${index === 0 ? "lg:py-10" : ""}`}>
                  <div className="flex flex-col h-full">
                    <div className="mb-8">
                      <Badge variant="outline" className={SECTION_BADGE_STYLE}>
                        {useCase.title}
                      </Badge>
                      <h3 className={`font-bold mb-4 leading-[1.2] tracking-tight max-w-lg ${index === 0 ? "text-2xl sm:text-4xl text-white" : "text-2xl sm:text-4xl text-white"}`}>{useCase.subtitle}</h3>
                      {index === 0 && (
                        <RatingBadge
                          rating={5}
                          title="Top Global AI Solution"
                          subtitle="2025 TECH EXCELLENCE"
                          className="mt-4"
                          variant="gold"
                        />
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/10 bg-red-500/5 text-red-400/90 font-bold text-[9px] uppercase tracking-[0.2em] w-fit">
                          <IconAlertTriangle size={12} />
                          El Problema
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed pl-1">{useCase.problem}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/10 bg-emerald-500/5 text-emerald-400/90 font-bold text-[9px] uppercase tracking-[0.2em] w-fit">
                          <IconTrendingUp size={12} />
                          La Solución
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed pl-1">{useCase.solution}</p>
                      </div>
                    </div>

                    <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group/quote">
                      <div className="flex items-center gap-2 text-green-400 font-bold text-[9px] uppercase tracking-[0.4em] mb-4 opacity-70">
                        <IconCheck size={14} />
                        Impacto Generado
                      </div>
                      <p className="text-white/80 text-lg font-medium leading-relaxed italic relative z-10">
                        "{useCase.result}"
                      </p>
                      <div className="absolute top-4 right-6 text-white/5 font-serif text-6xl pointer-events-none select-none">“</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
