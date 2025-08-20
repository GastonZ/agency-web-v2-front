import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from 'i18next-http-backend'
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug:false,
    fallbackLng:'es',
    ns:['navbar','hero','services','contact','whyus'],
    defaultNS:'navbar',
    interpolation:{
      escapeValue:false
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense:true ,
    }
  })

export default i18n
