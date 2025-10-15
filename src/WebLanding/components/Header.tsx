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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16" role="navigation" aria-label="Navegación principal">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/DT_logo.png"
              alt="Datacivis - Logo de la empresa"
              className="h-12 w-auto invert"
              role="img"
            />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              aria-label={`Navegar a ${t('nav.home')}`}
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => scrollToSection('quienes-somos')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              aria-label={`Navegar a ${t('nav.about')}`}
            >
              {t('nav.about')}
            </button>
            <button 
              onClick={() => scrollToSection('beneficios')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              aria-label={`Navegar a ${t('nav.benefits')}`}
            >
              {t('nav.benefits')}
            </button>
            <button 
              onClick={() => scrollToSection('caracteristicas')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              aria-label={`Navegar a ${t('nav.features')}`}
            >
              {t('nav.features')}
            </button>
            <button 
              onClick={() => scrollToSection('casos-de-uso')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              aria-label={`Navegar a ${t('nav.useCases')}`}
            >
              {t('nav.useCases')}
            </button>
            <button 
              onClick={() => scrollToSection('testimonios')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              aria-label={`Navegar a ${t('nav.testimonials')}`}
            >
              {t('nav.testimonials')}
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              aria-label={`Navegar a ${t('nav.faq')}`}
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
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-full"
            >
              <img src="/fb.svg" alt="Síguenos en Facebook" className="w-6 h-6 invert" />
            </a>

            {/* Instagram Icon */}
            <a
              href="https://www.instagram.com/iadatacivis/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-full"
            >
              <img src="/ig.svg" alt="Síguenos en Instagram" className="w-6 h-6 invert" />
            </a>

            {/* LinkedIn Icon */}
            <a
              href="https://www.linkedin.com/company/datacivis"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-full"
            >
              <img src="/in.svg" alt="Síguenos en LinkedIn" className="w-6 h-6 invert" />
            </a>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label={`Cambiar idioma a ${language === 'es' ? 'inglés' : 'español'}`}
            >
              <span className="text-gray-900 text-sm font-medium">
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
