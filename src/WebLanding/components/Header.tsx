import React from "react"
import { useSmoothScroll } from "../hooks/use-smooth-scroll"
import { useI18n } from "../lib/i18n"

const Header = () => {
  const { scrollToSection } = useSmoothScroll()
  const { language, setLanguage, t } = useI18n()
  
  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#090909] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/DT_logo.png"
              alt="Datacivis"
              className="h-12 w-auto"
            />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => scrollToSection('quienes-somos')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t('nav.about')}
            </button>
            <button 
              onClick={() => scrollToSection('beneficios')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t('nav.benefits')}
            </button>
            <button 
              onClick={() => scrollToSection('caracteristicas')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t('nav.features')}
            </button>
            <button 
              onClick={() => scrollToSection('casos-de-uso')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t('nav.useCases')}
            </button>
            <button 
              onClick={() => scrollToSection('testimonios')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t('nav.testimonials')}
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t('nav.faq')}
            </button>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {/* Facebook Icon */}
            <a 
              href="https://www.facebook.com/datacivis/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <img src="/fb.svg" alt="Facebook" className="w-6 h-6" />
            </a>

            {/* Instagram Icon */}
            <a 
              href="https://www.instagram.com/iadatacivis/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <img src="/ig.svg" alt="Instagram" className="w-6 h-6" />
            </a>

            {/* LinkedIn Icon */}
            <a 
              href="https://www.linkedin.com/company/datacivis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <img src="/in.svg" alt="LinkedIn" className="w-6 h-6" />
            </a>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="text-white text-sm font-medium">
                {language === 'es' ? 'EN' : 'ES'}
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
