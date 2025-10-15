import { useSmoothScroll } from "../hooks/use-smooth-scroll"
import { useI18n } from "../lib/i18n";
import { motion } from "framer-motion";

const Footer = () => {
  const { scrollToSection } = useSmoothScroll()
  const { t } = useI18n()

  return (
    <>
      {/* Footer principal con bordes consistentes */}
      <footer className="relative w-full m-0 p-0 overflow-hidden" role="contentinfo">
        <div className="mx-auto max-w-7xl border-t border-gray-200">
          {/* Contenido del footer */}
          <div className="flex flex-col sm:flex-row lg:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8">
            {/* Logo con background abstract */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="flex-shrink-0 flex-1 py-8"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden">
                <img
                  src="/datacivis-iso.svg"
                  alt="Datacivis - Logo de la empresa"
                  className="absolute inset-0 w-full h-full object-contain p-2 invert"
                  role="img"
                />
              </div>
            </motion.div>
            {/* Navegación */}
            <div className="flex flex-1 py-4 sm:py-8 justify-center items-center border-y sm:border-x border-gray-200">
              <nav className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4" role="navigation" aria-label="Navegación del footer">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('quienes-somos')}
                  className="text-center sm:text-left text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm lg:text-base"
                  aria-label={`Navegar a ${t('footer.about')}`}
                >
                  {t('footer.about')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('beneficios')}
                  className="text-center sm:text-left text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm lg:text-base"
                  aria-label={`Navegar a ${t('footer.benefits')}`}
                >
                  {t('footer.benefits')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('caracteristicas')}
                  className="text-center sm:text-left text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm lg:text-base"
                  aria-label={`Navegar a ${t('footer.features')}`}
                >
                  {t('footer.features')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('casos-de-uso')}
                  className="text-center sm:text-left text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm lg:text-base"
                  aria-label={`Navegar a ${t('footer.useCases')}`}
                >
                  {t('footer.useCases')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('testimonios')}
                  className="text-center sm:text-left text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm lg:text-base"
                  aria-label={`Navegar a ${t('footer.testimonials')}`}
                >
                  {t('footer.testimonials')}
                </motion.button>
              </nav>
            </div>

            {/* Contacto y redes sociales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col gap-3 sm:gap-4 lg:gap-6 flex-1 py-4 sm:py-8 items-center sm:items-start"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
                viewport={{ once: true, amount: 0.3 }}
                className="text-gray-800 font-medium text-sm sm:text-base text-center sm:text-left"
              >
                hola@datacivis.com
              </motion.div>

              {/* Redes sociales */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4"
              >
                <a href="https://www.facebook.com/datacivis/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Síguenos en Facebook">
                  <img src="/fb.svg" alt="Facebook" className="w-4 h-4 sm:w-5 sm:h-5 invert" />
                </a>
                <a href="https://www.instagram.com/iadatacivis/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Síguenos en Instagram">
                  <img src="/ig.svg" alt="Instagram" className="w-4 h-4 sm:w-5 sm:h-5 invert" />
                </a>
                <a href="https://www.linkedin.com/company/datacivis" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Síguenos en LinkedIn">
                  <img src="/in.svg" alt="LinkedIn" className="w-4 h-4 sm:w-5 sm:h-5 invert" />
                </a>
              </motion.div>
            </motion.div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-200 py-8 w-full">
          </div>
        </div>

        {/* Watermark separado del footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="relative w-full m-0 p-0"
        >
          <div className="text-center max-w-7xl mx-auto m-0 p-0">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.9 }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-[120px] sm:text-[160px] md:text-[200px] lg:text-[250px] xl:text-[300px] font-medium leading-none tracking-tight bg-gradient-to-b from-gray-900/5 from-[1%] to-gray-600 bg-clip-text text-transparent select-none m-0 p-0 "
            >
              Datacivis
            </motion.h2>
          </div>
        </motion.div>
      </footer>
    </>
  )
}

export default Footer
