
import React, { useState, useEffect } from "react"
import { useSmoothScroll } from "../hooks/use-smooth-scroll"
import { useI18n } from "../lib/i18n"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

const Header = () => {
  const { scrollToSection } = useSmoothScroll()
  const { language, setLanguage, t } = useI18n()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es')
  }

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId)
    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    { id: 'beneficios', label: t('nav.benefits') },
    { id: 'caracteristicas', label: t('nav.features') },
    { id: 'casos-de-uso', label: t('nav.useCases') },
    { id: 'precios', label: 'Pricing' },
  ]

  return (
    <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4">
      <div className="w-full max-w-6xl relative">
        <motion.header
          initial={false}
          animate={{
            height: isScrolled ? '64px' : '76px',
            backgroundColor: isScrolled ? 'rgba(9, 9, 9, 0.8)' : 'rgba(9, 9, 9, 0.4)',
            borderColor: isScrolled ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: isScrolled ? 'blur(16px)' : 'blur(8px)',
          }}
          transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="w-full rounded-full border shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-visible"
        >
          <div className="h-full px-6 lg:px-8">
            <nav className="flex items-center justify-between h-full">
              <motion.button
                onClick={() => handleNavClick('home')}
                className="flex items-center"
                animate={{
                  scale: isScrolled ? 0.9 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="/DT_logo.png"
                  alt="Datacivis"
                  className={`w-auto transition-all duration-300 ${isScrolled ? 'h-8' : 'h-10'}`}
                />
              </motion.button>

              <div className="hidden lg:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <motion.button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className="text-white/50 hover:text-white font-medium transition-colors tracking-wide uppercase"
                    animate={{
                      fontSize: isScrolled ? '11px' : '12px',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {link.label}
                  </motion.button>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-4">
                <motion.button
                  onClick={() => handleNavClick('conversational')}
                  className="rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all"
                  animate={{
                    paddingLeft: isScrolled ? '16px' : '20px',
                    paddingRight: isScrolled ? '16px' : '20px',
                    paddingTop: isScrolled ? '6px' : '8px',
                    paddingBottom: isScrolled ? '6px' : '8px',
                    fontSize: isScrolled ? '11px' : '12px',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {t('header.contact')}
                </motion.button>

                <button
                  onClick={toggleLanguage}
                  className="text-white/40 hover:text-white/60 font-medium transition-colors uppercase tracking-wider text-xs"
                >
                  {language === 'es' ? 'EN' : 'ES'}
                </button>
              </div>

              <div className="lg:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </nav>
          </div>
        </motion.header>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="lg:hidden absolute top-full left-0 right-0 mt-2 bg-[#090909]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50"
            >
              <div className="px-6 py-6 space-y-3">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className="block w-full text-left text-sm text-white/60 hover:text-white py-2 transition-colors uppercase tracking-wide"
                  >
                    {link.label}
                  </button>
                ))}

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => handleNavClick('conversational')}
                    className="w-full px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold mb-3"
                  >
                    {t('header.contact')}
                  </button>
                  <button
                    onClick={toggleLanguage}
                    className="w-full px-5 py-2.5 rounded-full border border-white/20 text-white/60 hover:text-white text-xs font-medium transition-colors uppercase tracking-wider"
                  >
                    {language === 'es' ? 'EN' : 'ES'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Header
