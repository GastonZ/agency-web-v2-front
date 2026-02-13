
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import { IconChevronDown } from "@tabler/icons-react";

const SECTION_BADGE_STYLE = "mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-5 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-white/60 select-none cursor-default";

export default function FAQSection() {
  const { t } = useI18n();
  const faqs = t('faq.items') || [];
  const [activeItem, setActiveItem] = useState<number | null>(null);

  const getCategory = (index: number) => {
    const categories = ["PRODUCT", "IMPLEMENTATION", "TECH", "OMNICHANNEL", "SYSTEM"];
    return categories[index % categories.length];
  };

  return (
    <section id="faq" className="relative w-full overflow-visible bg-[#0a0a0a]">

      {/* Brand Aurora Atmosphere */}
      <div className="absolute top-0 left-0 w-1/3 h-full pointer-events-none opacity-[0.05] blur-[120px] overflow-visible">
        <div className="absolute top-1/4 -left-1/4 w-full h-1/2 bg-emerald-500 rounded-full" />
      </div>

      <div className="mx-auto max-w-6xl py-24 sm:py-32 px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Static Sidebar Header */}
          <div className="lg:col-span-4 h-fit lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <Badge variant="outline" className={SECTION_BADGE_STYLE}>
                {t('faq.badge')}
              </Badge>
              <h2 className="text-3xl lg:text-[36px] font-heading font-bold text-white tracking-tight leading-[1.1]">
                {t('faq.title')}
              </h2>
              <p className="text-white/40 text-lg sm:text-xl leading-relaxed max-w-sm font-medium">
                {t('faq.description')}
              </p>

              <div className="pt-8 flex items-center gap-5">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                  LISA Support Online
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dynamic Accordion Area */}
          <div className="lg:col-span-8 flex flex-col">
            {faqs.map((faq: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className={`group border-b border-white/5 transition-colors duration-500 ${activeItem === index ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
              >
                <div
                  onClick={() => setActiveItem(activeItem === index ? null : index)}
                  className="flex items-center gap-10 py-12 px-8 cursor-pointer select-none"
                >
                  <div className="hidden sm:flex flex-col gap-1.5 min-w-[120px]">
                    <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-emerald-500/40 transition-colors">
                      CAT-{index + 1}
                    </span>
                    <span className="text-[12px] font-bold text-white/40 group-hover:text-white/60 transition-colors tracking-tight">
                      {getCategory(index)}
                    </span>
                  </div>

                  <span className={`flex-1 text-xl sm:text-2xl font-bold font-heading tracking-tight transition-all duration-300 ${activeItem === index ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {faq.question}
                  </span>

                  <motion.div
                    animate={{ rotate: activeItem === index ? 180 : 0 }}
                    className={`p-3 rounded-full border border-white/5 transition-colors ${activeItem === index ? 'bg-white text-black border-white' : 'text-white/20 group-hover:text-white/40'}`}
                  >
                    <IconChevronDown size={22} />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {activeItem === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 sm:pl-[200px] pb-12 pr-16 text-white/50 leading-relaxed text-lg sm:text-xl max-w-4xl font-medium">
                        <div className="space-y-6">
                          <p>{faq.answer}</p>
                          {index === 0 && (
                            <div className="flex items-center gap-4 px-5 py-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl w-fit">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[12px] font-bold uppercase tracking-widest text-emerald-500/80">Global System Function Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Support Footer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-28 p-12 sm:p-16 rounded-3xl bg-[#0d0d0d] border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          <div className="space-y-4 text-center lg:text-left">
            <h4 className="text-white font-bold text-3xl tracking-tight">¿Alguna otra consulta?</h4>
            <p className="text-white/30 text-lg sm:text-xl font-medium max-w-xl">LISA está configurada para responder dudas comerciales y técnicas 24/7 de forma inmediata.</p>
          </div>
          <button className="whitespace-nowrap px-12 py-5 rounded-full bg-emerald-500 text-black text-[13px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(16,185,129,0.15)]">
            Hablar con LISA en WhatsApp
          </button>
        </motion.div>
      </div>
    </section>
  );
}
