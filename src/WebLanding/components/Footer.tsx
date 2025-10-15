import { useSmoothScroll } from "../hooks/use-smooth-scroll"
import { useI18n } from "../lib/i18n";
import { motion } from "framer-motion";

const Footer = () => {
  const { scrollToSection } = useSmoothScroll()
  const { t } = useI18n()

  return (
    <>
      {/* Footer principal con bordes consistentes */}
      <footer className="relative w-full m-0 p-0 overflow-hidden">
        <div className="mx-auto max-w-7xl border-t border-white/10">
          {/* Contenido del footer */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8">
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
                  alt="Datacivis"
                  className="absolute inset-0 w-full h-full object-contain p-2"
                />
              </div>
            </motion.div>
            {/* Navegación */}
            <div className="flex flex-1 py-8 justify-center items-center border-x border-white/10">
              <nav className="flex flex-col gap-3 sm:gap-4">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('quienes-somos')}
                  className="text-left text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                >
                  {t('footer.about')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('beneficios')}
                  className="text-left text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                >
                  {t('footer.benefits')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('caracteristicas')}
                  className="text-left text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                >
                  {t('footer.features')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('casos-de-uso')}
                  className="text-left text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                >
                  {t('footer.useCases')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                  viewport={{ once: true, amount: 0.3 }}
                  onClick={() => scrollToSection('testimonios')}
                  className="text-left text-white/70 hover:text-white transition-colors text-sm sm:text-base"
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
              className="flex flex-col gap-4 sm:gap-6 flex-1 py-8"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
                viewport={{ once: true, amount: 0.3 }}
                className="text-white font-medium text-sm sm:text-base"
              >
                hola@datacivis.com
              </motion.div>

              {/* Redes sociales */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex items-center gap-3 sm:gap-4"
              >
                <a href="https://www.facebook.com/datacivis/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                  <img src="/fb.svg" alt="Facebook" className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="https://www.instagram.com/iadatacivis/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                  <img src="/ig.svg" alt="Instagram" className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="https://www.linkedin.com/company/datacivis" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                  <img src="/in.svg" alt="LinkedIn" className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </motion.div>
            </motion.div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 py-8 w-full">
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
              className="text-[120px] sm:text-[160px] md:text-[200px] lg:text-[250px] xl:text-[300px] font-medium leading-none tracking-tight bg-gradient-to-b from-white/5 from-[25%] to-white/1 bg-clip-text text-transparent select-none m-0 p-0"
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
