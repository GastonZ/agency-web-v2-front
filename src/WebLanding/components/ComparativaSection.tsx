import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { Check, X } from "lucide-react";
import { useI18n } from "../lib/i18n";

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
      competencia: t('comparison.competitor_details.partial')
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
      competencia: t('comparison.competitor.business_hours')
    },
    {
      feature: t('comparison.features.implementation'),
      datacivis: true,
      competencia: t('comparison.competitor.months')
    },
    {
      feature: t('comparison.features.pricing'),
      datacivis: true,
      competencia: false
    },
    {
      feature: t('comparison.features.training'),
      datacivis: true,
      competencia: t('comparison.competitor.additional_cost')
    }
  ];
  return (
    <section
      id="comparativa"
      aria-labelledby="comparativa-title"
      className="relative w-full border-t border-gray-200"
    >
      <div className="mx-auto max-w-6xl py-16 sm:py-20 md:py-24 px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12 sm:mb-16"
        >
          <Badge variant="outline" className="mb-4 sm:mb-6 bg-white border-gray-200 text-gray-800 rounded-full px-6 py-2 text-sm font-medium shadow-sm">
            {t('comparison.badge')}
          </Badge>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            id="comparativa-title"
            className="font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4"
          >
            {t('comparison.title')}
          </motion.h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            {t('comparison.description')}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="bg-gray-50 backdrop-blur-sm border-2 border-gray-300 overflow-hidden"
        >
          {/* Header de la tabla - Textos más grandes y centrados */}
          <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
            <div className="p-4 sm:p-6 border-r border-gray-200">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
                className="text-sm sm:text-base md:text-lg font-medium uppercase tracking-wide text-center bg-gradient-to-b from-gray-600 from-[55%] to-gray-400 bg-clip-text text-transparent">
                {t('comparison.features.realtime_data').split(' ')[0]}
              </motion.h3>
            </div>
            <div className="p-4 sm:p-6 border-r border-gray-200 bg-gradient-to-br from-gray-900/5 to-transparent">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
                className="text-gray-900 text-base sm:text-lg md:text-xl font-medium text-center">
                Datacivis
              </motion.h3>
            </div>
            <div className="p-4 sm:p-6">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
                className="text-gray-600 text-base sm:text-lg md:text-xl font-medium text-center">
                {t('comparison.competitor')}
              </motion.h3>
            </div>
          </div>

          {/* Filas de comparación - Textos más grandes y centrados */}
          {comparativa.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className={`grid grid-cols-3 gap-0 border-b border-gray-200 hover:bg-white transition-colors ${index % 2 === 0 ? 'bg-gray-100' : ''
                }`}
            >
              <div className="p-4 sm:p-6 border-r border-gray-200">
                <p className="text-gray-900 text-base sm:text-lg md:text-xl font-medium text-center">
                  {item.feature}
                </p>
              </div>
              <div className="p-4 sm:p-6 border-r border-gray-200 flex items-center justify-center">
                {item.datacivis === true ? (
                  <Check className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                ) : (
                  <span className="text-green-500 text-base sm:text-lg md:text-xl font-medium text-center">
                    {item.datacivis}
                  </span>
                )}
              </div>
              <div className="p-4 sm:p-6 flex items-center justify-center">
                {item.competencia === true ? (
                  <Check className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                ) : item.competencia === false ? (
                  <X className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
                ) : (
                  <span className="text-gray-500 text-base sm:text-lg md:text-xl font-medium text-center">
                    {item.competencia}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mt-8 sm:mt-12"
        >
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            {t('comparison.cta')}
          </p>
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm hover:text-gray-900 transition-colors cursor-pointer">
            <span>{t('comparison.demo')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
